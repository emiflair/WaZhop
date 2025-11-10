const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { asyncHandler, calculatePlanExpiry } = require('../utils/helpers');

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
  const { plan, duration, billingPeriod, couponCode } = req.body; // plan: 'pro' or 'premium', duration: number of months, billingPeriod: 'monthly' or 'yearly'

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
  let originalAmount = isYearly ? planPrices[plan].yearly : planPrices[plan].monthly * (duration || 1);
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
      usage => usage.user.toString() === req.user.id
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

  console.log('✅ User plan upgraded:', { userId: user._id, email: user.email, plan, planExpiry: expiryDate });

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

// @desc    Downgrade subscription plan
// @route   POST /api/users/downgrade
// @access  Private
exports.downgradePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body; // plan: 'free' or 'pro'

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
  
  // Check shop count
  if (shops.length > newLimits[plan].maxShops) {
    return res.status(400).json({
      success: false,
      message: `Cannot downgrade. You have ${shops.length} shops, but ${plan} plan allows only ${newLimits[plan].maxShops}. Please delete ${shops.length - newLimits[plan].maxShops} shop(s) first.`,
      requiresAction: true,
      currentShops: shops.length,
      allowedShops: newLimits[plan].maxShops
    });
  }

  // Check total product count across all shops
  let totalProducts = 0;
  for (const shop of shops) {
    const count = await Product.countDocuments({ shop: shop._id });
    totalProducts += count;
  }

  if (totalProducts > newLimits[plan].products) {
    return res.status(400).json({
      success: false,
      message: `Cannot downgrade. You have ${totalProducts} products, but ${plan} plan allows only ${newLimits[plan].products}. Please delete ${totalProducts - newLimits[plan].products} product(s) first.`,
      requiresAction: true,
      currentProducts: totalProducts,
      allowedProducts: newLimits[plan].products
    });
  }

  // Check storage usage (only applicable when downgrading to free)
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

  // Deactivate extra shops if needed (keep the oldest shop active for free plan)
  if (plan === 'free' && shops.length > 0) {
    // Keep only the first shop active
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
    message: `Successfully downgraded to ${plan} plan. ${plan === 'free' ? 'Only your oldest shop remains active. ' : ''}Some features have been restricted.`
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
    free: users.filter(u => u.plan === 'free').length,
    pro: users.filter(u => u.plan === 'pro').length,
    premium: users.filter(u => u.plan === 'premium').length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length
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
  const { plan, billingPeriod, subscriptionEndDate, isVerified } = req.body;

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
