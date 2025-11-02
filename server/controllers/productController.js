const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to Cloudinary from buffer
const uploadFromBuffer = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Helper function to check storage limit before upload
const checkStorageLimit = async (userId, newFileSize) => {
  const user = await User.findById(userId);
  const limits = user.getPlanLimits();
  
  // Free plan has no storage allowance
  if (limits.storage === 0) {
    return {
      allowed: false,
      message: 'Storage not available on Free plan. Upgrade to Pro or Premium for storage.'
    };
  }
  
  const newTotal = user.storageUsed + newFileSize;
  
  if (newTotal > limits.storage) {
    const usedGB = (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
    const limitGB = (limits.storage / (1024 * 1024 * 1024)).toFixed(0);
    return {
      allowed: false,
      message: `Storage limit exceeded. Using ${usedGB}GB of ${limitGB}GB. Upgrade to get more storage.`
    };
  }
  
  return {
    allowed: true,
    user,
    newTotal
  };
};

// Helper function to update storage usage
const updateStorageUsage = async (userId, sizeDelta) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { storageUsed: sizeDelta }
  });
};

// @desc    Get all products for current user's shop(s)
// @route   GET /api/products/my/products?shopId=xxx
// @access  Private
exports.getMyProducts = asyncHandler(async (req, res) => {
  const { shopId } = req.query;

  // If shopId is provided, get products for that specific shop
  if (shopId) {
    const shop = await Shop.findOne({ _id: shopId, owner: req.user.id });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found or you do not own this shop'
      });
    }

    const products = await Product.find({ shop: shop._id })
      .sort({ position: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      shop: {
        id: shop._id,
        name: shop.shopName,
        isActive: shop.isActive
      }
    });
  }

  // Otherwise, get products from all user's shops
  const shops = await Shop.find({ owner: req.user.id });

  if (shops.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No shops found'
    });
  }

  const shopIds = shops.map(shop => shop._id);
  const products = await Product.find({ shop: { $in: shopIds } })
    .populate('shop', 'shopName slug isActive')
    .sort({ position: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    shops: shops.map(shop => ({
      id: shop._id,
      name: shop.shopName,
      isActive: shop.isActive
    }))
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'shop',
      select: 'shopName slug owner isActive',
      populate: {
        path: 'owner',
        select: 'whatsapp'
      }
    });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if shop is active (hidden if inactive)
  if (!product.shop.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Increment view count
  await product.incrementViews();

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, comparePrice, category, tags, inStock, sku, shopId } = req.body;

  // Find the shop - use provided shopId or default to user's first active shop
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found or you do not own this shop'
    });
  }

  // Check if shop is active
  if (!shop.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Cannot add products to an inactive shop. This shop was deactivated due to plan limits. Please upgrade your plan to reactivate it.'
    });
  }

  // Check plan limits for total products across all active shops
  const activeShops = await Shop.find({ owner: req.user.id, isActive: true });
  const activeShopIds = activeShops.map(s => s._id);
  const existingProductsCount = await Product.countDocuments({ shop: { $in: activeShopIds } });
  const planLimits = req.user.getPlanLimits();
  
  if (existingProductsCount >= planLimits.products) {
    return res.status(403).json({
      success: false,
      message: `Your ${req.user.plan} plan allows up to ${planLimits.products} products. Please upgrade to add more.`
    });
  }

  // Upload images if provided
  let images = [];
  if (req.files && req.files.length > 0) {
    // Check if Cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        for (let i = 0; i < req.files.length; i++) {
          const result = await uploadFromBuffer(req.files[i].buffer, 'washop/products');
          images.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: i === 0 // First image is primary
          });
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images. Please try again.'
        });
      }
    } else {
      console.warn('Cloudinary not configured - skipping image upload');
    }
  }

  // Get the highest position number
  const lastProduct = await Product.findOne({ shop: shop._id }).sort({ position: -1 });
  const position = lastProduct ? lastProduct.position + 1 : 0;

  const product = await Product.create({
    shop: shop._id,
    name,
    description,
    price,
    comparePrice,
    category,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    inStock: inStock !== undefined ? inStock : true,
    sku,
    images,
    position
  });

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully'
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check ownership
  const shop = await Shop.findById(product.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product'
    });
  }

  // Check if shop is active
  if (!shop.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Cannot update products in an inactive shop. Please upgrade your plan to reactivate this shop.'
    });
  }

  // Handle tags
  if (req.body.tags) {
    req.body.tags = Array.isArray(req.body.tags) 
      ? req.body.tags 
      : req.body.tags.split(',').map(t => t.trim());
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product updated successfully'
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check ownership
  const shop = await Shop.findById(product.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this product'
    });
  }

  // Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (error) {
        console.error('Error deleting product image:', error);
      }
    }
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Upload additional product images
// @route   POST /api/products/:id/images
// @access  Private
exports.uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check ownership
  const shop = await Shop.findById(product.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product'
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please upload at least one image'
    });
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Image upload service is not configured'
    });
  }

  // Check total images limit (max 10 per product)
  if (product.images.length + req.files.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 10 images allowed per product'
    });
  }

  // Calculate total size of new files
  const totalNewSize = req.files.reduce((sum, file) => sum + file.size, 0);
  
  // Check storage limit
  const storageCheck = await checkStorageLimit(req.user.id, totalNewSize);
  if (!storageCheck.allowed) {
    return res.status(403).json({
      success: false,
      message: storageCheck.message,
      upgrade: true
    });
  }

  // Upload new images
  const newImages = [];
  for (const file of req.files) {
    const result = await uploadFromBuffer(file.buffer, 'washop/products');
    newImages.push({
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: product.images.length === 0 && newImages.length === 0
    });
  }

  // Update storage usage
  await updateStorageUsage(req.user.id, totalNewSize);

  product.images.push(...newImages);
  await product.save();

  res.status(200).json({
    success: true,
    data: product.images,
    message: 'Images uploaded successfully'
  });
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private
exports.deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check ownership
  const shop = await Shop.findById(product.shop);
  if (shop.owner.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product'
    });
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  const imageToDelete = product.images[imageIndex];

  // Get image size from Cloudinary before deleting
  let imageSize = 0;
  try {
    const cloudinaryImage = await cloudinary.api.resource(imageToDelete.publicId);
    imageSize = cloudinaryImage.bytes || 0;
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(imageToDelete.publicId);
    
    // Reduce storage usage
    await updateStorageUsage(req.user.id, -imageSize);
  } catch (error) {
    console.error('Error deleting image:', error);
  }

  product.images.splice(imageIndex, 1);

  // If deleted image was primary, make first image primary
  if (product.images.length > 0 && !product.images.some(img => img.isPrimary)) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// @desc    Reorder products
// @route   PUT /api/products/my/reorder
// @access  Private
exports.reorderProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body; // Array of product IDs in new order

  if (!Array.isArray(productIds)) {
    return res.status(400).json({
      success: false,
      message: 'Product IDs must be an array'
    });
  }

  const shop = await Shop.findOne({ owner: req.user.id });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Update position for each product
  const updatePromises = productIds.map((id, index) => 
    Product.findOneAndUpdate(
      { _id: id, shop: shop._id },
      { position: index }
    )
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    success: true,
    message: 'Products reordered successfully'
  });
});

// @desc    Track product click (for WhatsApp button)
// @route   POST /api/products/:id/click
// @access  Public
exports.trackProductClick = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  await product.incrementClicks();

  res.status(200).json({
    success: true,
    message: 'Click tracked'
  });
});
