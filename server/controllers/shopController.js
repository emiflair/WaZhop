const streamifier = require('streamifier');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, generateSlug } = require('../utils/helpers');
const { cloudinary } = require('../config/cloudinary');
const { FREE_THEME, PRO_THEMES } = require('../config/themePresets');

// Helper function to check storage limits
const checkStorageLimit = async (userId, newFileSize) => {
  const user = await User.findById(userId);
  const planLimits = user.getPlanLimits();

  if (planLimits.storage === 0) {
    return { allowed: false, message: 'Storage uploads are not available on the free plan. Upgrade to Pro or Premium.' };
  }

  const newTotal = user.storageUsed + newFileSize;

  if (newTotal > planLimits.storage) {
    const usedGB = (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
    const limitGB = (planLimits.storage / (1024 * 1024 * 1024)).toFixed(0);
    return {
      allowed: false,
      message: `Storage limit exceeded. You have used ${usedGB}GB of ${limitGB}GB. Upgrade your plan for more storage.`
    };
  }

  return { allowed: true, user, newTotal };
};

// Helper function to update storage usage
const updateStorageUsage = async (userId, sizeDelta) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { storageUsed: sizeDelta }
  });
};

// Helper function to upload to Cloudinary from buffer
const uploadFromBuffer = (buffer, folder) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
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

// @desc    Get current user's shop
// @route   GET /api/shops/my/shop
// @access  Private
exports.getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user.id }).populate('products');

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  res.status(200).json({
    success: true,
    data: shop
  });
});

// @desc    Get shop by slug (public)
// @route   GET /api/shops/:slug
// @access  Public
exports.getShopBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const shop = await Shop.findOne({ slug, isActive: true })
    .populate({
      path: 'owner',
      select: 'name whatsapp plan'
    });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Get active products for this shop
  const products = await Product.find({
    shop: shop._id,
    isActive: true
  }).sort({ position: 1, createdAt: -1 });

  // Increment view count
  await shop.incrementViews();

  res.status(200).json({
    success: true,
    data: {
      shop,
      products
    }
  });
});

// @desc    Update shop details
// @route   PUT /api/shops/my/shop?shopId=xxx
// @access  Private
exports.updateShop = asyncHandler(async (req, res) => {
  console.log('🔍 UPDATE SHOP - Full request body:', JSON.stringify(req.body, null, 2));
  const {
    shopName, description, category, location, slug, socialLinks, theme, paymentSettings
  } = req.body;
  const { shopId } = req.query;
  console.log('🔍 Extracted paymentSettings:', paymentSettings);

  // Find shop - use shopId if provided, otherwise get first active shop
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
      message: 'Cannot update an inactive shop. This shop was deactivated due to plan limits. Please upgrade your plan to reactivate it.'
    });
  }

  // If slug is being changed, check if it's unique
  if (slug && slug !== shop.slug) {
    const existingSlug = await Shop.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'This shop URL is already taken. Please choose another.'
      });
    }
    shop.slug = slug;
  }

  // Update fields
  if (shopName) shop.shopName = shopName;
  if (description !== undefined) shop.description = description;
  if (category) shop.category = category;
  if (location !== undefined) shop.location = location;
  if (socialLinks) shop.socialLinks = { ...shop.socialLinks, ...socialLinks };

  // Update payment settings (Premium only)
  if (paymentSettings) {
    console.log('📥 Received paymentSettings:', JSON.stringify(paymentSettings, null, 2));

    // Get user plan from request
    const user = await User.findById(req.user.id);

    if (paymentSettings.enabled && user.plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Payment integration is only available for Premium plan users. Upgrade to Premium to accept direct payments.'
      });
    }

    // Update payment settings - use explicit boolean check
    shop.paymentSettings = {
      enabled: paymentSettings.enabled === true,
      provider: paymentSettings.provider || null,
      flutterwave: {
        publicKey: paymentSettings.flutterwave?.publicKey || null,
        paymentLink: paymentSettings.flutterwave?.paymentLink || null
      },
      paystack: {
        publicKey: paymentSettings.paystack?.publicKey || null,
        paymentLink: paymentSettings.paystack?.paymentLink || null
      },
      allowWhatsAppNegotiation: paymentSettings.allowWhatsAppNegotiation ?? true,
      currency: paymentSettings.currency || 'NGN'
    };

    console.log('💾 Saving shop.paymentSettings:', JSON.stringify(shop.paymentSettings, null, 2));
  }

  // Update theme mode if provided (Premium only)
  if (theme?.mode) {
    // Get user plan from request
    const user = await User.findById(req.user.id);

    if (user.plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Theme mode customization is only available for Premium plan users. Upgrade to Premium to control your shop\'s display mode.'
      });
    }

    shop.theme.mode = theme.mode;
  }

  await shop.save();

  res.status(200).json({
    success: true,
    data: shop,
    message: 'Shop updated successfully'
  });
});

// @desc    Update shop theme
// @route   PUT /api/shops/my/theme?shopId=xxx
// @access  Private
exports.updateTheme = asyncHandler(async (req, res) => {
  const {
    themeName, primaryColor, accentColor, backgroundColor, textColor, layout, font
  } = req.body;
  const { shopId } = req.query;

  // Find shop - use shopId if provided, otherwise get first active shop
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
      message: 'Cannot update theme of an inactive shop. This shop was deactivated due to plan limits. Please upgrade your plan to reactivate it.'
    });
  }

  const userPlan = req.user.plan;

  // FREE PLAN: Cannot change theme at all
  if (userPlan === 'free') {
    return res.status(403).json({
      success: false,
      message: 'Theme customization is not available on the Free plan. Upgrade to Pro or Premium to customize your shop theme.',
      upgrade: true,
      requiredPlan: 'pro'
    });
  }

  // PRO PLAN: Can only use preset themes
  if (userPlan === 'pro') {
    if (!themeName || !PRO_THEMES[themeName]) {
      return res.status(400).json({
        success: false,
        message: 'Pro plan users must select from available preset themes.',
        availableThemes: Object.keys(PRO_THEMES),
        hint: 'Upgrade to Premium for unlimited color customization'
      });
    }

    // Apply preset theme with all properties
    const selectedTheme = PRO_THEMES[themeName];
    shop.theme = {
      name: selectedTheme.name,
      primaryColor: selectedTheme.primaryColor,
      accentColor: selectedTheme.accentColor,
      backgroundColor: selectedTheme.backgroundColor,
      textColor: selectedTheme.textColor,
      layout: selectedTheme.layout,
      font: selectedTheme.font,
      hasGradient: selectedTheme.hasGradient,
      gradient: selectedTheme.gradient,
      buttonStyle: selectedTheme.buttonStyle,
      cardStyle: selectedTheme.cardStyle,
      animations: selectedTheme.animations,
      customCSS: null // Pro users cannot use custom CSS
    };

    await shop.save();

    return res.status(200).json({
      success: true,
      data: shop,
      message: `Theme changed to ${selectedTheme.name} with all Pro features enabled!`
    });
  }

  // PREMIUM PLAN: Full customization allowed
  if (userPlan === 'premium') {
    if (themeName && PRO_THEMES[themeName]) {
      // Apply preset theme if selected with all properties
      const selectedTheme = PRO_THEMES[themeName];
      shop.theme = {
        name: selectedTheme.name,
        primaryColor: selectedTheme.primaryColor,
        accentColor: selectedTheme.accentColor,
        backgroundColor: selectedTheme.backgroundColor,
        textColor: selectedTheme.textColor,
        layout: selectedTheme.layout,
        font: selectedTheme.font,
        hasGradient: selectedTheme.hasGradient,
        gradient: selectedTheme.gradient,
        buttonStyle: selectedTheme.buttonStyle,
        cardStyle: selectedTheme.cardStyle,
        animations: selectedTheme.animations,
        customCSS: shop.theme.customCSS || null // Preserve existing custom CSS
      };
    } else {
      // Custom colors - Premium users can customize everything
      if (themeName) shop.theme.name = themeName;
      if (primaryColor) shop.theme.primaryColor = primaryColor;
      if (accentColor) shop.theme.accentColor = accentColor;
      if (backgroundColor) shop.theme.backgroundColor = backgroundColor;
      if (textColor) shop.theme.textColor = textColor;
      if (layout) shop.theme.layout = layout;
      if (font) shop.theme.font = font;
      if (req.body.hasGradient !== undefined) shop.theme.hasGradient = req.body.hasGradient;
      if (req.body.gradient) shop.theme.gradient = req.body.gradient;
      if (req.body.buttonStyle) shop.theme.buttonStyle = req.body.buttonStyle;
      if (req.body.cardStyle) shop.theme.cardStyle = req.body.cardStyle;
      if (req.body.animations !== undefined) shop.theme.animations = req.body.animations;
      if (req.body.customCSS !== undefined) shop.theme.customCSS = req.body.customCSS;
    }

    await shop.save();

    return res.status(200).json({
      success: true,
      data: shop,
      message: 'Theme updated successfully with Premium features!'
    });
  }

  res.status(400).json({
    success: false,
    message: 'Invalid plan'
  });
});

// @desc    Upload shop logo
// @route   POST /api/shops/my/logo
// @access  Private
exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  // Check storage limit
  const storageCheck = await checkStorageLimit(req.user.id, req.file.size);
  if (!storageCheck.allowed) {
    return res.status(403).json({
      success: false,
      message: storageCheck.message,
      upgrade: true
    });
  }

  const shop = await Shop.findOne({ owner: req.user.id });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Track old image size for storage calculation
  let oldImageSize = 0;
  if (shop.logo?.publicId) {
    try {
      // Get old image details before deleting
      const oldImage = await cloudinary.api.resource(shop.logo.publicId);
      oldImageSize = oldImage.bytes || 0;

      // Delete old logo from Cloudinary
      await cloudinary.uploader.destroy(shop.logo.publicId);

      // Subtract old image size from storage
      await updateStorageUsage(req.user.id, -oldImageSize);
    } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  }

  // Upload new logo
  const result = await uploadFromBuffer(req.file.buffer, 'wazhop/logos');

  // Add new image size to storage
  await updateStorageUsage(req.user.id, req.file.size);

  shop.logo = {
    url: result.secure_url,
    publicId: result.public_id
  };

  await shop.save();

  res.status(200).json({
    success: true,
    data: shop.logo,
    message: 'Logo uploaded successfully'
  });
});

// @desc    Upload shop banner
// @route   POST /api/shops/my/banner
// @access  Private
exports.uploadBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image file'
    });
  }

  // Check storage limit
  const storageCheck = await checkStorageLimit(req.user.id, req.file.size);
  if (!storageCheck.allowed) {
    return res.status(403).json({
      success: false,
      message: storageCheck.message,
      upgrade: true
    });
  }

  const shop = await Shop.findOne({ owner: req.user.id });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Track old image size for storage calculation
  let oldImageSize = 0;
  if (shop.banner?.publicId) {
    try {
      // Get old image details before deleting
      const oldImage = await cloudinary.api.resource(shop.banner.publicId);
      oldImageSize = oldImage.bytes || 0;

      // Delete old banner from Cloudinary
      await cloudinary.uploader.destroy(shop.banner.publicId);

      // Subtract old image size from storage
      await updateStorageUsage(req.user.id, -oldImageSize);
    } catch (error) {
      console.error('Error deleting old banner:', error);
    }
  }

  // Upload new banner
  const result = await uploadFromBuffer(req.file.buffer, 'wazhop/banners');

  // Add new image size to storage
  await updateStorageUsage(req.user.id, req.file.size);

  shop.banner = {
    url: result.secure_url,
    publicId: result.public_id
  };

  await shop.save();

  res.status(200).json({
    success: true,
    data: shop.banner,
    message: 'Banner uploaded successfully'
  });
});

// @desc    Delete logo or banner
// @route   DELETE /api/shops/my/image/:type
// @access  Private
exports.deleteImage = asyncHandler(async (req, res) => {
  const { type } = req.params; // 'logo' or 'banner'

  if (!['logo', 'banner'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid image type'
    });
  }

  const shop = await Shop.findOne({ owner: req.user.id });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Delete from Cloudinary and track storage
  if (shop[type]?.publicId) {
    try {
      // Get image size before deleting
      const cloudinaryImage = await cloudinary.api.resource(shop[type].publicId);
      const imageSize = cloudinaryImage.bytes || 0;

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(shop[type].publicId);

      // Reduce storage usage
      await updateStorageUsage(req.user.id, -imageSize);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  }

  shop[type] = { url: null, publicId: null };
  await shop.save();

  res.status(200).json({
    success: true,
    message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
  });
});

// @desc    Get available themes based on user plan
// @route   GET /api/shops/themes
// @access  Private
exports.getAvailableThemes = asyncHandler(async (req, res) => {
  const userPlan = req.user.plan;

  let themes = [];
  let customizationAllowed = false;

  if (userPlan === 'free') {
    themes = [FREE_THEME];
    customizationAllowed = false;
  } else if (userPlan === 'pro') {
    themes = Object.entries(PRO_THEMES).map(([key, theme]) => ({
      id: key,
      ...theme
    }));
    customizationAllowed = false;
  } else if (userPlan === 'premium') {
    themes = Object.entries(PRO_THEMES).map(([key, theme]) => ({
      id: key,
      ...theme
    }));
    customizationAllowed = true;
  }

  res.status(200).json({
    success: true,
    data: {
      plan: userPlan,
      themes,
      customizationAllowed,
      message: userPlan === 'free'
        ? 'Upgrade to Pro to access 5 professional themes, or Premium for unlimited customization'
        : userPlan === 'pro'
          ? 'Upgrade to Premium for unlimited color customization'
          : 'You have access to all features!'
    }
  });
});

// @desc    Get all shops for current user
// @route   GET /api/shops/my/shops
// @access  Private
exports.getMyShops = asyncHandler(async (req, res) => {
  const shops = await Shop.find({ owner: req.user.id }).sort({ createdAt: -1 });

  // Count active and inactive shops
  const activeShops = shops.filter((shop) => shop.isActive).length;
  const inactiveShops = shops.filter((shop) => !shop.isActive).length;

  res.status(200).json({
    success: true,
    data: {
      shops,
      count: shops.length,
      activeCount: activeShops,
      inactiveCount: inactiveShops,
      maxShops: req.user.getPlanLimits().maxShops
    }
  });
});

// @desc    Create new shop
// @route   POST /api/shops
// @access  Private
exports.createShop = asyncHandler(async (req, res) => {
  const {
    shopName, description, category, location
  } = req.body;

  // Check how many shops user already has
  const existingShops = await Shop.countDocuments({ owner: req.user.id });
  const planLimits = req.user.getPlanLimits();

  if (existingShops >= planLimits.maxShops) {
    return res.status(403).json({
      success: false,
      message: `You have reached the maximum number of shops (${planLimits.maxShops}) for your ${req.user.plan} plan. Upgrade to create more shops.`,
      upgrade: true,
      current: existingShops,
      max: planLimits.maxShops
    });
  }

  // Generate unique slug from shop name
  const baseSlug = generateSlug(shopName || `${req.user.name}'s Shop ${existingShops + 1}`);
  const uniqueSlug = await Shop.generateUniqueSlug(baseSlug);

  // Determine branding visibility based on user plan
  const showBranding = req.user.plan === 'free';
  const showWatermark = req.user.plan === 'free'; // Pro and Premium hide watermark

  // Create shop
  const shop = await Shop.create({
    owner: req.user.id,
    shopName: shopName || `${req.user.name}'s Shop ${existingShops + 1}`,
    slug: uniqueSlug,
    description: description || 'Welcome to my shop!',
    category: category || 'other',
    location: location || '',
    showBranding: showBranding,
    showWatermark: showWatermark,
    theme: {
      primaryColor: '#000000',
      accentColor: '#FFD700',
      layout: 'grid',
      font: 'inter'
    }
  });

  res.status(201).json({
    success: true,
    data: shop,
    message: 'Shop created successfully'
  });
});

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private
exports.deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ _id: req.params.id, owner: req.user.id });

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  let totalFreedStorage = 0;

  // Get all products for this shop to calculate storage
  const products = await Product.find({ shop: shop._id });

  // Delete product images from Cloudinary and calculate storage
  for (const product of products) {
    for (const image of product.images) {
      try {
        // Get image size before deleting
        const cloudinaryImage = await cloudinary.api.resource(image.publicId);
        totalFreedStorage += cloudinaryImage.bytes || 0;

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.publicId);
      } catch (error) {
        console.error(`Error deleting product image ${image.publicId}:`, error);
      }
    }
  }

  // Delete shop logo and banner from Cloudinary
  if (shop.logo?.publicId) {
    try {
      const logoImage = await cloudinary.api.resource(shop.logo.publicId);
      totalFreedStorage += logoImage.bytes || 0;
      await cloudinary.uploader.destroy(shop.logo.publicId);
    } catch (error) {
      console.error('Error deleting shop logo:', error);
    }
  }

  if (shop.banner?.publicId) {
    try {
      const bannerImage = await cloudinary.api.resource(shop.banner.publicId);
      totalFreedStorage += bannerImage.bytes || 0;
      await cloudinary.uploader.destroy(shop.banner.publicId);
    } catch (error) {
      console.error('Error deleting shop banner:', error);
    }
  }

  // Reduce storage usage
  if (totalFreedStorage > 0) {
    await updateStorageUsage(req.user.id, -totalFreedStorage);
  }

  // Delete all products associated with this shop
  await Product.deleteMany({ shop: shop._id });

  // Delete the shop
  await shop.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Shop and associated products deleted successfully'
  });
});

// @desc    Set custom domain (Premium only)
// @route   PUT /api/shops/my/domain
// @access  Private
exports.setCustomDomain = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  const { shopId } = req.query;

  // Check if user has Premium plan
  const user = await User.findById(req.user.id);
  if (user.plan !== 'premium') {
    return res.status(403).json({
      success: false,
      message: 'Custom domains are only available on the Premium plan'
    });
  }

  // Find shop
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Validate domain format
  const domainRegex = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid domain format. Example: myshop.com'
    });
  }

  // Check if domain is already used by another shop
  const existingDomain = await Shop.findOne({
    customDomain: domain,
    _id: { $ne: shop._id }
  });

  if (existingDomain) {
    return res.status(400).json({
      success: false,
      message: 'This domain is already connected to another shop'
    });
  }

  // Generate verification token
  const verificationToken = require('crypto').randomBytes(32).toString('hex');

  // Update shop
  shop.customDomain = domain;
  shop.domainVerified = false;
  shop.domainVerificationToken = verificationToken;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Domain added. Please verify DNS configuration.',
    data: {
      domain,
      verificationToken,
      instructions: {
        step1: `Add an A record for ${domain} pointing to your server IP`,
        step2: `Add a TXT record with name _washop-verify and value ${verificationToken}`,
        step3: 'Click verify button once DNS is configured'
      }
    }
  });
});

// @desc    Verify custom domain
// @route   POST /api/shops/my/domain/verify
// @access  Private
exports.verifyCustomDomain = asyncHandler(async (req, res) => {
  const { shopId } = req.query;
  const dns = require('dns').promises;

  // Find shop
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop || !shop.customDomain) {
    return res.status(404).json({
      success: false,
      message: 'No custom domain configured'
    });
  }

  try {
    // Check TXT record for verification token
    const txtRecords = await dns.resolveTxt(`_washop-verify.${shop.customDomain}`);
    const flatRecords = txtRecords.flat();

    const verified = flatRecords.includes(shop.domainVerificationToken);

    if (verified) {
      shop.domainVerified = true;
      await shop.save();

      return res.status(200).json({
        success: true,
        message: 'Domain verified successfully!',
        data: { verified: true }
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Verification failed. TXT record not found or incorrect.',
      data: { verified: false }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'DNS verification failed. Please ensure DNS records are properly configured.',
      error: error.message
    });
  }
});

// @desc    Remove custom domain
// @route   DELETE /api/shops/my/domain
// @access  Private
exports.removeCustomDomain = asyncHandler(async (req, res) => {
  const { shopId } = req.query;

  // Find shop
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  shop.customDomain = null;
  shop.domainVerified = false;
  shop.domainVerificationToken = null;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Custom domain removed successfully'
  });
});

// @desc    Set subdomain (Pro/Premium only)
// @route   PUT /api/shops/my/subdomain
// @access  Private
exports.setSubdomain = asyncHandler(async (req, res) => {
  const { subdomain } = req.body;
  const { shopId } = req.query;

  // Check if user has Pro or Premium plan
  const user = await User.findById(req.user.id);
  if (user.plan === 'free') {
    return res.status(403).json({
      success: false,
      message: 'Subdomains are available on Pro and Premium plans'
    });
  }

  // Find shop
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Validate subdomain format
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return res.status(400).json({
      success: false,
      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
    });
  }

  // Check if subdomain is already taken
  const existingSubdomain = await Shop.findOne({
    subdomain,
    _id: { $ne: shop._id }
  });

  if (existingSubdomain) {
    return res.status(400).json({
      success: false,
      message: 'This subdomain is already taken'
    });
  }

  shop.subdomain = subdomain;
  await shop.save();

  res.status(200).json({
    success: true,
    message: 'Subdomain set successfully',
    data: {
      subdomain,
      url: `https://${subdomain}.wazhop.com`
    }
  });
});
