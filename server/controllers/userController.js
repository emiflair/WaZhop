const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { asyncHandler, calculatePlanExpiry, normalizePhoneNumber } = require('../utils/helpers');

const FAVORITES_POPULATE = {
  path: 'favorites',
  select: 'name price comparePrice currency images shop inStock averageRating numReviews views moderation status createdAt',
  populate: {
    path: 'shop',
    select: 'shopName slug owner',
    populate: {
      path: 'owner',
      select: 'plan'
    }
  }
};

const filterActiveFavorites = (favorites = []) => {
  if (!Array.isArray(favorites)) return [];

  return favorites.filter((product) => {
    if (!product) return false;
    const isRejected = product?.moderation?.status === 'rejected';
    const isInactive = product?.isActive === false || product?.status === 'draft';
    return !isRejected && !isInactive;
  });
};

// @desc    Get subscription information
// @route   GET /api/users/subscription
// @access  Private
exports.getSubscriptionInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  const shop = await Shop.findOne({ owner: user._id });
  const productCount = await Product.countDocuments({ shop: shop._id });

  const limits = user.getPlanLimits();
  const isExpired = user.isPlanExpired();

  res.status(200).json({
    success: true,
    data: {
      currentPlan: user.plan,
      planExpiry: user.planExpiry,
      isExpired,
      limits,
      usage: {
        products: productCount,
        productsLimit: limits.products
      },
      availableUpgrades: {
        pro: user.plan === 'free',
        premium: user.plan === 'free' || user.plan === 'pro'
      }
    }
  });
});

// @desc    Upgrade subscription plan
// @route   POST /api/users/upgrade
// @access  Private
exports.upgradePlan = asyncHandler(async (req, res) => {
  const {
    plan, duration, billingPeriod, couponCode
  } = req.body; // plan: 'pro' or 'premium', duration: number of months, billingPeriod: 'monthly' or 'yearly'

  if (!['pro', 'premium'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan. Choose "pro" or "premium"'
    });
  }

  // Define plan prices
  const planPrices = {
    pro: {
      monthly: 5000,
      yearly: 42000 // 30% discount from 60,000
    },
    premium: {
      monthly: 15000,
      yearly: 126000 // 30% discount from 180,000
    }
  };

  const user = await User.findById(req.user.id);

  // Check if already on this plan or higher
  const planHierarchy = { free: 0, pro: 1, premium: 2 };
  if (planHierarchy[user.plan] >= planHierarchy[plan]) {
    return res.status(400).json({
      success: false,
      message: `You are already on ${user.plan} plan or higher`
    });
  }

  // Calculate expiry date and amount
  const isYearly = billingPeriod === 'yearly';
  const months = isYearly ? 12 : (duration || 1);
  const originalAmount = isYearly ? planPrices[plan].yearly : planPrices[plan].monthly * (duration || 1);
  let finalAmount = originalAmount;
  let discountApplied = null;
  const expiryDate = calculatePlanExpiry(months);

  // Apply coupon if provided
  if (couponCode) {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Validate coupon
    const validation = coupon.isValid();
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check if applicable to the plan
    if (!coupon.applicablePlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `This coupon is not applicable to ${plan} plan`
      });
    }

    // Check if user already used this coupon
    const alreadyUsed = coupon.usedBy.some(
      (usage) => usage.user.toString() === req.user.id
    );

    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this coupon'
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(originalAmount);
    finalAmount = discount.finalAmount;
    discountApplied = {
      code: coupon.code,
      discountAmount: discount.discountAmount,
      discountPercentage: discount.discountPercentage
    };

    // Record usage
    coupon.usedBy.push({
      user: req.user.id,
      usedAt: new Date(),
      plan,
      originalAmount: discount.originalAmount,
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount
    });
    coupon.usedCount += 1;
    await coupon.save();
  }

  // Update user plan (In production, this should happen after payment)
  user.plan = plan;
  user.billingPeriod = billingPeriod || 'monthly';
  user.planExpiry = expiryDate;
  user.lastBillingDate = new Date();
  user.subscriptionStatus = 'active';
  await user.save();

  console.log('✅ User plan upgraded:', {
    userId: user._id, email: user.email, plan, planExpiry: expiryDate
  });

  // Update all shops branding and watermark visibility
  if (plan === 'pro' || plan === 'premium') {
    await Shop.updateMany(
      { owner: user._id },
      { $set: { showBranding: false, showWatermark: false } }
    );
    console.log('✅ Shop branding updated for paid plan');
  }

  // Notify referrer if user was referred
  if (user.referredBy) {
    console.log('🎯 User has referrer, calling notifyReferrerOfUpgrade:', { userId: user._id, referredBy: user.referredBy, plan });
    const { notifyReferrerOfUpgrade } = require('./referralController');
    await notifyReferrerOfUpgrade(user._id, plan);
  } else {
    console.log('ℹ️ User has no referrer (user.referredBy is null/undefined)');
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      planExpiry: user.planExpiry,
      storageUsed: user.storageUsed,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralStats: user.referralStats
    },
    data: {
      plan: user.plan,
      planExpiry: user.planExpiry,
      amount: finalAmount,
      billingPeriod: isYearly ? 'yearly' : 'monthly',
      months: months
    },
    payment: {
      originalAmount,
      finalAmount,
      discountApplied
    },
    message: `Successfully upgraded to ${plan} plan!`
  });
});

// @desc    Downgrade subscription plan (supports destructive cleanup on confirm)
// @route   POST /api/users/downgrade
// @access  Private
exports.downgradePlan = asyncHandler(async (req, res) => {
  const { plan, confirmLoss = false } = req.body; // plan: 'free' or 'pro', confirmLoss: boolean

  if (!['free', 'pro'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan. Choose "free" or "pro"'
    });
  }

  const user = await User.findById(req.user.id);

  // Check if already on this plan or lower
  const planHierarchy = { free: 0, pro: 1, premium: 2 };
  if (planHierarchy[user.plan] <= planHierarchy[plan]) {
    return res.status(400).json({
      success: false,
      message: `You are already on ${user.plan} plan or lower`
    });
  }

  // Get new plan limits
  const newLimits = {
    free: { products: 5, maxShops: 1, storage: 0 },
    pro: { products: 100, maxShops: 2, storage: 69793218560 },
    premium: { products: Infinity, maxShops: 3, storage: 1099511627776 }
  };

  // Get all user shops
  const shops = await Shop.find({ owner: user._id });

  // If user confirmed destructive downgrade to Free, perform cleanup automatically
  if (plan === 'free' && confirmLoss === true) {
    const { enforceFreePlanForUser } = require('../utils/planEnforcement');
    const stats = await enforceFreePlanForUser(user._id, { destructive: true });
    // Proceed to plan update after enforcement
    shops.length = Math.min(shops.length, 1);
  } else {
    // Check shop count only when not confirmed for destructive cleanup
    if (shops.length > newLimits[plan].maxShops) {
      return res.status(400).json({
        success: false,
        message: `Cannot downgrade. You have ${shops.length} shops, but ${plan} plan allows only ${newLimits[plan].maxShops}. Please delete ${shops.length - newLimits[plan].maxShops} shop(s) first.`,
        requiresAction: true,
        currentShops: shops.length,
        allowedShops: newLimits[plan].maxShops
      });
    }
  }

  // Check total product count across all shops
  let totalProducts = 0;
  for (const shop of shops) {
    const count = await Product.countDocuments({ shop: shop._id });
    totalProducts += count;
  }

  if (!(plan === 'free' && confirmLoss === true)) {
    if (totalProducts > newLimits[plan].products) {
      return res.status(400).json({
        success: false,
        message: `Cannot downgrade. You have ${totalProducts} products, but ${plan} plan allows only ${newLimits[plan].products}. Please delete ${totalProducts - newLimits[plan].products} product(s) first.`,
        requiresAction: true,
        currentProducts: totalProducts,
        allowedProducts: newLimits[plan].products
      });
    }
  }

  // Check storage usage (only applicable when downgrading to free)
  if (!(plan === 'free' && confirmLoss === true)) {
    if (plan === 'free' && user.storageUsed > 0) {
      const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
      return res.status(400).json({
        success: false,
        message: `Cannot downgrade to Free plan. You are using ${usedMB}MB of storage. Free plan does not include storage. Please delete all images (logos, banners, product images) first.`,
        requiresAction: true,
        currentStorage: user.storageUsed,
        allowedStorage: 0
      });
    }
  }

  // If downgrading from Premium to Pro, check custom theme features
  if (user.plan === 'premium' && plan === 'pro') {
    // Reset any shops with custom themes to preset themes
    for (const shop of shops) {
      if (shop.theme.customCSS || !shop.theme.name || shop.theme.name === 'Custom') {
        // Reset to default Pro theme
        shop.theme = {
          name: 'Clean White',
          primaryColor: '#FFFFFF',
          accentColor: '#000000',
          backgroundColor: '#F9FAFB',
          textColor: '#111827',
          layout: 'grid',
          font: 'inter',
          hasGradient: false,
          gradient: null,
          buttonStyle: 'rounded',
          cardStyle: 'shadow',
          animations: false,
          customCSS: null
        };
        await shop.save();
      }
    }
  }

  // Update user plan
  user.plan = plan;
  if (plan === 'free') {
    user.planExpiry = null;
    user.billingPeriod = 'monthly';
    user.autoRenew = false;
    user.subscriptionStatus = 'active';
  }
  await user.save();

  // Update all shops branding and watermark visibility
  if (plan === 'free') {
    await Shop.updateMany(
      { owner: user._id },
      { $set: { showBranding: true, showWatermark: true } }
    );
  }

  // Deactivate extra shops if needed (keep the oldest shop active for free plan) – already handled in destructive mode
  if (plan === 'free' && shops.length > 0 && !confirmLoss) {
    const primaryShop = shops.sort((a, b) => a.createdAt - b.createdAt)[0];
    await Shop.updateMany(
      { owner: user._id, _id: { $ne: primaryShop._id } },
      { $set: { isActive: false } }
    );
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      planExpiry: user.planExpiry,
      storageUsed: user.storageUsed,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralStats: user.referralStats
    },
    data: {
      plan: user.plan,
      planExpiry: user.planExpiry,
      restrictions: {
        maxShops: newLimits[plan].maxShops,
        maxProducts: newLimits[plan].products,
        storage: newLimits[plan].storage,
        brandsRemoved: plan !== 'free',
        customThemes: plan === 'premium'
      }
    },
    message: `Successfully downgraded to ${plan} plan.${plan === 'free' && confirmLoss ? ' We removed extra shops/products and cleared images to fit Free plan limits.' : plan === 'free' ? ' Only your oldest shop remains active.' : ''} Some features have been restricted.`
  });
});

// @desc    Get current user favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('favorites')
    .populate(FAVORITES_POPULATE)
    .lean();

  const favorites = filterActiveFavorites(user?.favorites || []);

  res.status(200).json({
    success: true,
    data: {
      favorites
    }
  });
});

// @desc    Add product to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product is required' });
  }

  const product = await Product.findById(productId)
    .populate({
      path: 'shop',
      select: 'shopName slug owner',
      populate: {
        path: 'owner',
        select: 'plan'
      }
    });

  if (!product || product.moderation?.status === 'rejected' || product.isActive === false) {
    return res.status(404).json({ success: false, message: 'Product not available' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const alreadyFavorited = user.favorites.some((fav) => fav.toString() === productId.toString());

  if (!alreadyFavorited) {
    user.favorites.push(product._id);
    await user.save();
  }

  const hydratedUser = await User.findById(user._id)
    .select('favorites')
    .populate(FAVORITES_POPULATE)
    .lean();

  const favorites = filterActiveFavorites(hydratedUser?.favorites || []);

  res.status(200).json({
    success: true,
    data: {
      favorites
    },
    message: alreadyFavorited ? 'Product already in favorites' : 'Product added to favorites'
  });
});

// @desc    Remove product from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
exports.removeFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product is required' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const originalCount = user.favorites.length;
  user.favorites = user.favorites.filter((fav) => fav.toString() !== productId.toString());

  if (user.favorites.length !== originalCount) {
    await user.save();
  }

  const hydratedUser = await User.findById(user._id)
    .select('favorites')
    .populate(FAVORITES_POPULATE)
    .lean();

  const favorites = filterActiveFavorites(hydratedUser?.favorites || []);

  res.status(200).json({
    success: true,
    data: {
      favorites
    },
    message: 'Product removed from favorites'
  });
});

// @desc    Get all users (Admin)
// @route   GET /api/users/admin/all
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 });

  // Calculate stats
  const stats = {
    total: users.length,
    free: users.filter((u) => u.plan === 'free').length,
    pro: users.filter((u) => u.plan === 'pro').length,
    premium: users.filter((u) => u.plan === 'premium').length,
    verified: users.filter((u) => u.isVerified).length,
    unverified: users.filter((u) => !u.isVerified).length
  };

  res.status(200).json({
    success: true,
    count: users.length,
    stats,
    data: users
  });
});

// @desc    Update user subscription (Admin)
// @route   PATCH /api/users/admin/:userId
// @access  Admin
exports.updateUserSubscription = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    plan, billingPeriod, subscriptionEndDate, isVerified
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update plan if provided
  if (plan && ['free', 'pro', 'premium'].includes(plan)) {
    user.plan = plan;
  }

  // Update billing period if provided
  if (billingPeriod && ['monthly', 'yearly'].includes(billingPeriod)) {
    user.billingPeriod = billingPeriod;
  }

  // Update subscription end date if provided
  if (subscriptionEndDate) {
    user.subscriptionEndDate = new Date(subscriptionEndDate);
    user.planExpiry = new Date(subscriptionEndDate);
  }

  // Update verification status if provided
  if (typeof isVerified === 'boolean') {
    user.isVerified = isVerified;
  }

  // Update subscription status
  if (plan === 'free') {
    user.subscriptionStatus = 'active';
    user.planExpiry = null;
    user.subscriptionEndDate = null;
  } else {
    user.subscriptionStatus = 'active';
  }

  await user.save();

  // Update shop branding based on plan
  const Shop = require('../models/Shop');
  if (plan === 'pro' || plan === 'premium') {
    await Shop.updateMany(
      { owner: user._id },
      { $set: { showBranding: false, showWatermark: false } }
    );
  } else if (plan === 'free') {
    await Shop.updateMany(
      { owner: user._id },
      { $set: { showBranding: true, showWatermark: true } }
    );
  }

  res.status(200).json({
    success: true,
    message: 'User subscription updated successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      billingPeriod: user.billingPeriod,
      planExpiry: user.planExpiry,
      subscriptionEndDate: user.subscriptionEndDate,
      isVerified: user.isVerified,
      subscriptionStatus: user.subscriptionStatus
    }
  });
});

// @desc    Switch buyer to seller
// @route   POST /api/users/switch-to-seller
// @access  Private (Buyer only)
exports.switchToSeller = asyncHandler(async (req, res) => {
  const { whatsappNumber, plan } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already a seller
  if (user.role === 'seller') {
    return res.status(400).json({
      success: false,
      message: 'You are already a seller'
    });
  }

  // Validate WhatsApp number
  if (!whatsappNumber) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid WhatsApp number with country code'
    });
  }

  const normalizedNumber = normalizePhoneNumber(whatsappNumber);

  if (!normalizedNumber) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid WhatsApp number with country code'
    });
  }

  const phoneInUse = await User.findOne({ whatsapp: normalizedNumber, _id: { $ne: req.user.id } });
  if (phoneInUse) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp number is already in use'
    });
  }

  // Validate plan
  if (!['free', 'pro', 'premium'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan. Choose "free", "pro", or "premium"'
    });
  }

  // Update user to seller
  user.role = 'seller';
  user.whatsapp = normalizedNumber;
  user.plan = plan;

  // Set plan expiry for paid plans
  if (plan === 'pro' || plan === 'premium') {
    user.planExpiry = calculatePlanExpiry(1); // 1 month
    user.subscriptionStatus = 'active';
    user.lastBillingDate = new Date();
  }

  await user.save();

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp,
      plan: user.plan,
      planExpiry: user.planExpiry,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified
    },
    message: `Successfully switched to seller with ${plan} plan!`
  });
});
