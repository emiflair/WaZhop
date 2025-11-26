const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const crypto = require('crypto');
const { asyncHandler, generateSlug } = require('../utils/helpers');

// @desc    Create temporary store with admin
// @route   POST /api/admin/create-store
// @access  Private (Admin only)
exports.createTemporaryStore = asyncHandler(async (req, res) => {
  const { storeName, category, tags } = req.body;

  if (!storeName) {
    return res.status(400).json({
      success: false,
      message: 'Store name is required'
    });
  }

  // Generate unique slug
  const baseSlug = generateSlug(storeName);
  const uniqueSlug = await Shop.generateUniqueSlug(baseSlug);

  // Create temporary user account
  const tempEmail = `temp_${uniqueSlug}_${Date.now()}@wazhop.ng`;
  const randomPassword = crypto.randomBytes(32).toString('hex');
  
  const tempUser = await User.create({
    name: storeName,
    email: tempEmail,
    password: randomPassword,
    role: 'seller',
    plan: 'free',
    isTemporary: true,
    accountStatus: 'pending_activation',
    whatsapp: null
  });

  // Generate activation token (valid for 90 days)
  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationExpires = new Date();
  activationExpires.setDate(activationExpires.getDate() + 90);

  // Create temporary shop
  const shop = await Shop.create({
    owner: tempUser._id,
    shopName: storeName,
    slug: uniqueSlug,
    description: '',
    category: category || 'other',
    isTemporary: true,
    createdByAdmin: true,
    activationToken,
    activationTokenExpires: activationExpires,
    theme: {
      name: 'Clean White',
      mode: 'light',
      primaryColor: '#FFFFFF',
      accentColor: '#000000',
      backgroundColor: '#F9FAFB',
      textColor: '#111827',
      layout: 'grid',
      font: 'inter',
      buttonStyle: 'rounded',
      cardStyle: 'shadow'
    }
  });

  // Generate preview URL
  const previewUrl = `${process.env.CLIENT_URL}/s/${uniqueSlug}?preview=true`;
  const activationUrl = `${process.env.CLIENT_URL}/activate-store/${shop._id}/${activationToken}`;

  res.status(201).json({
    success: true,
    data: {
      shop: {
        id: shop._id,
        name: shop.shopName,
        slug: shop.slug,
        previewUrl,
        activationUrl
      },
      user: {
        id: tempUser._id,
        email: tempUser.email
      }
    },
    message: 'Temporary store created successfully'
  });
});

// @desc    Add product to temporary store
// @route   POST /api/admin/create-store/:shopId/products
// @access  Private (Admin only)
exports.addProductToTempStore = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { name, description, price, category, subcategory, tags, inStock } = req.body;

  // Verify shop exists and is temporary
  const shop = await Shop.findById(shopId);
  
  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  if (!shop.isTemporary) {
    return res.status(400).json({
      success: false,
      message: 'This shop is not a temporary store'
    });
  }

  // Create product (images handled separately via upload endpoint)
  const product = await Product.create({
    shop: shop._id,
    name,
    description: description || name,
    price: parseFloat(price),
    category: category || 'other',
    subcategory: subcategory || null,
    tags: tags || [],
    inStock: inStock !== undefined ? inStock : true,
    images: [] // Will be added via separate upload
  });

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product added to temporary store'
  });
});

// @desc    Get all temporary stores
// @route   GET /api/admin/create-store/temporary
// @access  Private (Admin only)
exports.getTemporaryStores = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ isTemporary: true })
    .populate('owner', 'name email accountStatus')
    .sort({ createdAt: -1 });

  const shopsWithProducts = await Promise.all(
    shops.map(async (shop) => {
      const productCount = await Product.countDocuments({ shop: shop._id });
      return {
        ...shop.toObject(),
        productCount,
        previewUrl: `${process.env.CLIENT_URL}/s/${shop.slug}?preview=true`,
        activationUrl: `${process.env.CLIENT_URL}/activate-store/${shop._id}/${shop.activationToken}`
      };
    })
  );

  res.status(200).json({
    success: true,
    count: shopsWithProducts.length,
    data: shopsWithProducts
  });
});

// @desc    Delete temporary store
// @route   DELETE /api/admin/create-store/:shopId
// @access  Private (Admin only)
exports.deleteTemporaryStore = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  const shop = await Shop.findById(shopId);

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  if (!shop.isTemporary) {
    return res.status(400).json({
      success: false,
      message: 'Can only delete temporary stores'
    });
  }

  // Delete all products
  await Product.deleteMany({ shop: shop._id });

  // Delete the shop
  await shop.deleteOne();

  // Delete temporary user
  await User.findByIdAndDelete(shop.owner);

  res.status(200).json({
    success: true,
    message: 'Temporary store deleted successfully'
  });
});

module.exports = {
  createTemporaryStore,
  addProductToTempStore,
  getTemporaryStores,
  deleteTemporaryStore
};
