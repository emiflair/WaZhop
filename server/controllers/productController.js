const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Review = require('../models/Review');
const { asyncHandler, paginate, paginationMeta } = require('../utils/helpers');
const cache = require('../utils/cache');
const { cloudinary } = require('../config/cloudinary');
const {
  uploadImageSync,
  uploadImageBatch,
  deleteImageFromCloudinary
} = require('../utils/imageProcessor');

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

  const shopIds = shops.map((shop) => shop._id);
  const products = await Product.find({ shop: { $in: shopIds } })
    .populate('shop', 'shopName slug isActive')
    .sort({ position: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    shops: shops.map((shop) => ({
      id: shop._id,
      name: shop.shopName,
      isActive: shop.isActive
    }))
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'shop',
      select: 'shopName slug owner isActive isVerified',
      populate: {
        path: 'owner',
        select: 'whatsapp'
      }
    });

  if (!product) {
    console.log(`❌ Product not found with ID: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if shop exists and is populated
  if (!product.shop) {
    console.log(`❌ Product ${req.params.id} has no shop or shop was deleted`);
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if shop is active - if inactive, still show product but mark as unavailable
  const isShopInactive = !product.shop.isActive;
  if (isShopInactive) {
    console.log(`⚠️  Product ${req.params.id} shop is inactive: ${product.shop.shopName} - showing as unavailable`);
  }

  // Increment view count
  await product.incrementViews();

  // Cache product details for 2 minutes (views still increment server-side)
  res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');

  res.status(200).json({
    success: true,
    data: product,
    shopInactive: isShopInactive,
    message: isShopInactive ? 'This shop is temporarily unavailable due to plan limits. Products cannot be purchased at this time.' : undefined
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, price, comparePrice, category, subcategory, tags, inStock, sku, shopId, locationState, locationArea
  } = req.body;

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
  const activeShopIds = activeShops.map((s) => s._id);
  const existingProductsCount = await Product.countDocuments({ shop: { $in: activeShopIds } });
  const planLimits = req.user.getPlanLimits();

  if (existingProductsCount >= planLimits.products) {
    return res.status(403).json({
      success: false,
      message: `Your ${req.user.plan} plan allows up to ${planLimits.products} products. Please upgrade to add more.`
    });
  }

  // Upload images if provided (using optimized processing)
  const images = [];
  if (req.files && req.files.length > 0) {
    // Check if Cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        // Use optimized image processor with compression
        for (let i = 0; i < req.files.length; i++) {
          const result = await uploadImageSync(
            req.files[i].buffer,
            'wazhop/products',
            'product' // Apply product-specific compression
          );
          images.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: i === 0 // First image is primary
          });
        }
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload images. Please try again.'
        });
      }
    } else {
      console.warn('Cloudinary not configured - skipping image upload');
    }
  }

  // Get the highest position number
  const lastProduct = await Product.findOne({ shop: shop._id }).sort({ position: -1 });
  const position = lastProduct ? lastProduct.position + 1 : 0;

  // Normalize location (store consistent casing; allow null)
  const normState = locationState ? locationState.toString().trim() : null;
  const normArea = locationArea ? locationArea.toString().trim() : null;

  const product = await Product.create({
    shop: shop._id,
    name,
    description,
    price,
    comparePrice,
    category,
    subcategory: subcategory || null,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    inStock: inStock !== undefined ? inStock : true,
    sku,
    images,
    position,
    locationState: normState,
    locationArea: normArea
  });

  // Invalidate relevant caches
  await cache.invalidateCache('marketplace', '*'); // New product affects marketplace
  await cache.invalidateCache('shop-products', shop._id.toString());
  await cache.invalidateCache('shop-page', shop.slug);

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
      : req.body.tags.split(',').map((t) => t.trim());
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    (() => {
      const update = { ...req.body };
      if (update.locationState !== undefined) {
        update.locationState = update.locationState ? update.locationState.toString().trim() : null;
      }
      if (update.locationArea !== undefined) {
        update.locationArea = update.locationArea ? update.locationArea.toString().trim() : null;
      }
      return update;
    })(),
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

  // Upload new images (optimized with compression)
  const newImages = [];
  for (const file of req.files) {
    const result = await uploadImageSync(file.buffer, 'wazhop/products', 'product');
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
    (img) => img._id.toString() === req.params.imageId
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

    // Delete from Cloudinary (with retry logic)
    await deleteImageFromCloudinary(imageToDelete.publicId);

    // Reduce storage usage
    await updateStorageUsage(req.user.id, -imageSize);
  } catch (error) {
    console.error('Error deleting image:', error);
  }

  product.images.splice(imageIndex, 1);

  // If deleted image was primary, make first image primary
  if (product.images.length > 0 && !product.images.some((img) => img.isPrimary)) {
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
  const updatePromises = productIds.map((id, index) => Product.findOneAndUpdate(
    { _id: id, shop: shop._id },
    { position: index }
  ));

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

// @desc    Get marketplace products (all public products across all active shops)
// @route   GET /api/products/marketplace
// @access  Public
exports.getMarketplaceProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 24, category, subcategory, search, minPrice, maxPrice, sort, state, area
  } = req.query;

  // Build query for products from active shops only
  const activeShops = await Shop.find({ isActive: true }).select('_id');
  const activeShopIds = activeShops.map((s) => s._id);

  const query = { shop: { $in: activeShopIds } };

  // Filter by category if provided
  if (category && category !== 'all') {
    query.category = category.toLowerCase();
  }

  // Filter by subcategory if provided
  if (subcategory && subcategory !== 'all') {
    query.subcategory = subcategory.toLowerCase();
  }

  // Advanced search with weighted scoring
  // Split search into keywords for better matching
  const searchKeywords = search ? search.trim().toLowerCase().split(/\s+/).filter((k) => k.length > 0) : [];

  if (searchKeywords.length > 0) {
    // Build flexible search conditions
    const searchConditions = searchKeywords.map((keyword) => ({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $elemMatch: { $regex: keyword, $options: 'i' } } },
        { category: { $regex: keyword, $options: 'i' } },
        { subcategory: { $regex: keyword, $options: 'i' } }
      ]
    }));

    // Products must match at least one keyword
    query.$or = searchConditions.length === 1 ? searchConditions[0].$or : [
      { $and: searchConditions }
    ];
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Optional location targeting: prioritize or filter by boost target or shop.location
  if (state || area) {
    const orConds = [];

    // Match boost targeting
    if (state) orConds.push({ 'boost.state': { $regex: new RegExp(`^${state}$`, 'i') } });
    if (area) orConds.push({ 'boost.area': { $regex: new RegExp(area, 'i') } });

    // Match persistent product-level location
    if (state) orConds.push({ locationState: { $regex: new RegExp(`^${state}$`, 'i') } });
    if (area) orConds.push({ locationArea: { $regex: new RegExp(area, 'i') } });

    // Match shop.location field (broad string match)
    const shopLocQuery = { isActive: true };
    if (state && area) {
      shopLocQuery.location = { $regex: new RegExp(`${state}.*${area}|${area}.*${state}`, 'i') };
    } else if (state) {
      shopLocQuery.location = { $regex: new RegExp(state, 'i') };
    } else if (area) {
      shopLocQuery.location = { $regex: new RegExp(area, 'i') };
    }
    const shopsByLoc = await Shop.find(shopLocQuery).select('_id');
    const matchedShopIds = shopsByLoc.map((s) => s._id);
    if (matchedShopIds.length) orConds.push({ shop: { $in: matchedShopIds } });

    if (orConds.length) {
      query.$and = (query.$and || []).concat([{ $or: orConds }]);
    }
  }

  // Pagination
  const { skip, limit: pLimit } = paginate(page, limit);

  // Get total count for pagination
  const total = await Product.countDocuments(query);

  // Fetch products with shop and owner details
  // Only select fields needed for marketplace listing (reduces payload size)
  const products = await Product.find(query)
    .select('name price images category subcategory tags boost shop views createdAt inStock stock comparePrice')
    .populate({
      path: 'shop',
      select: 'shopName slug logo owner',
      populate: {
        path: 'owner',
        select: 'plan'
      }
    })
    .lean();

  // Calculate remaining boost hours, relevance score, and sort products
  const now = new Date();
  const productsWithBoostHours = products.map((product) => {
    let remainingBoostHours = 0;
    let isBoosted = false;

    if (product.boost?.active && product.boost?.endAt) {
      const endTime = new Date(product.boost.endAt);
      if (endTime > now) {
        // Calculate remaining hours (can be fractional)
        remainingBoostHours = (endTime - now) / (1000 * 60 * 60);
        isBoosted = true;
      }
    }

    // Calculate relevance score for search results (0-100)
    let relevanceScore = 0;
    if (searchKeywords.length > 0) {
      const nameLower = (product.name || '').toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      const tagsLower = (product.tags || []).map((t) => t.toLowerCase());
      const categoryLower = (product.category || '').toLowerCase();
      const subcategoryLower = (product.subcategory || '').toLowerCase();

      searchKeywords.forEach((keyword) => {
        // Exact match in name: 30 points
        if (nameLower === keyword) relevanceScore += 30;
        // Name starts with keyword: 20 points
        else if (nameLower.startsWith(keyword)) relevanceScore += 20;
        // Name contains keyword: 10 points
        else if (nameLower.includes(keyword)) relevanceScore += 10;

        // Category exact match: 15 points
        if (categoryLower === keyword) relevanceScore += 15;
        else if (categoryLower.includes(keyword)) relevanceScore += 8;

        // Subcategory exact match: 12 points
        if (subcategoryLower === keyword) relevanceScore += 12;
        else if (subcategoryLower.includes(keyword)) relevanceScore += 6;

        // Tags match: 12 points per tag
        if (tagsLower.some((tag) => tag === keyword)) relevanceScore += 12;
        else if (tagsLower.some((tag) => tag.includes(keyword))) relevanceScore += 6;

        // Description contains: 5 points
        if (descLower.includes(keyword)) relevanceScore += 5;
      });

      // Bonus for matching all keywords
      if (searchKeywords.length > 1) {
        const allMatch = searchKeywords.every((k) => (
          nameLower.includes(k)
          || descLower.includes(k)
          || tagsLower.some((t) => t.includes(k))
          || categoryLower.includes(k)
          || subcategoryLower.includes(k)
        ));
        if (allMatch) relevanceScore += 15;
      }
    }

    return {
      ...product,
      isBoosted,
      remainingBoostHours,
      relevanceScore
    };
  });

  // Sort: boosted products first (by remaining time), then non-boosted randomized by default
  const boosted = productsWithBoostHours.filter((p) => p.isBoosted)
    .sort((a, b) => b.remainingBoostHours - a.remainingBoostHours);

  const nonBoosted = productsWithBoostHours.filter((p) => !p.isBoosted);

  const wantRandom = searchKeywords.length === 0 && (!sort || sort === '' || sort === 'featured');

  if (wantRandom) {
    // Fisher–Yates shuffle for non-boosted items
    for (let i = nonBoosted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonBoosted[i], nonBoosted[j]] = [nonBoosted[j], nonBoosted[i]];
    }
  } else {
    // If searching or explicit sort applied, keep deterministic ordering
    nonBoosted.sort((a, b) => {
      if (searchKeywords.length > 0) {
        const scoreDiff = b.relevanceScore - a.relevanceScore;
        if (scoreDiff !== 0) return scoreDiff;
      }
      const aEngagement = (a.views || 0) + (a.clicks || 0) * 2;
      const bEngagement = (b.views || 0) + (b.clicks || 0) * 2;
      if (bEngagement !== aEngagement) return bEngagement - aEngagement;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  const ordered = [...boosted, ...nonBoosted];

  // Apply pagination after sorting
  const paginatedProducts = ordered.slice(skip, skip + pLimit);

  // Enrich each product with review stats
  const enriched = await Promise.all(
    paginatedProducts.map(async (product) => {
      const reviewStats = await Review.aggregate([
        { $match: { product: product._id, isApproved: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        ...product,
        reviewStats: reviewStats[0] || { avgRating: 0, count: 0 }
      };
    })
  );

  res.status(200).json({
    success: true,
    data: enriched,
    pagination: paginationMeta(total, page, pLimit)
  });
});

// Pricing: simple flat rate per hour (NGN)
const BOOST_RATE_PER_HOUR_NGN = 400; // e.g., ₦2000 for 5 hours

// @desc    Start/extend a product boost
// @route   PUT /api/products/:id/boost
// @access  Private
exports.boostProduct = asyncHandler(async (req, res) => {
  const {
    hours, state, area, startAt
  } = req.body;

  const durationHours = Math.max(1, parseInt(hours, 10) || 0);
  if (!durationHours) {
    return res.status(400).json({ success: false, message: 'Please provide boost hours' });
  }

  const product = await Product.findById(req.params.id).populate('shop');
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Ownership check
  if (product.shop.owner.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to boost this product' });
  }

  // Shop must be active
  if (!product.shop.isActive) {
    return res.status(403).json({ success: false, message: 'Cannot boost products in an inactive shop' });
  }

  const now = new Date();
  const boostStart = startAt ? new Date(startAt) : now;
  // If there is an existing active boost, extend from its end time
  const existingEnd = product.boost?.endAt && new Date(product.boost.endAt) > now
    ? new Date(product.boost.endAt)
    : boostStart;
  const boostEnd = new Date(existingEnd.getTime() + durationHours * 60 * 60 * 1000);

  const amount = durationHours * BOOST_RATE_PER_HOUR_NGN;

  // Update product boost fields
  product.boost = {
    active: true,
    startAt: product.boost?.startAt && new Date(product.boost.startAt) > now ? product.boost.startAt : boostStart,
    endAt: boostEnd,
    durationHours: (product.boost?.durationHours || 0) + durationHours,
    amount: (product.boost?.amount || 0) + amount,
    state: state || product.boost?.state || null,
    area: area || product.boost?.area || null,
    country: 'NG'
  };

  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    message: `Boost started. Your product will be highlighted until ${boostEnd.toLocaleString()}.`
  });
});

// @desc    Get boost status for a product
// @route   GET /api/products/:id/boost
// @access  Private
exports.getBoostStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('boost').lean();
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  const now = new Date();
  const active = product.boost?.endAt && new Date(product.boost.endAt) > now;
  res.status(200).json({
    success: true,
    data: {
      ...product.boost,
      active
    }
  });
});

// @desc    Get related products (same category/subcategory)
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  // Get the product to find related items
  const product = await Product.findById(req.params.id).select('category subcategory shop').lean();
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Find products in same subcategory or category, excluding current product
  const query = {
    _id: { $ne: product._id },
    category: product.category
  };

  // Prefer same subcategory if available
  if (product.subcategory) {
    query.subcategory = product.subcategory;
  }

  // Only show products from active shops
  const activeShops = await Shop.find({ isActive: true }).select('_id');
  query.shop = { $in: activeShops.map((s) => s._id) };

  const relatedProducts = await Product.find(query)
    .select('name price images category subcategory shop views createdAt inStock stock comparePrice')
    .populate({
      path: 'shop',
      select: 'shopName slug logo'
    })
    .limit(parseInt(limit))
    .sort({ views: -1, createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: relatedProducts
  });
});
