const User = require('../models/User');
const Shop = require('../models/Shop');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../utils/helpers');

// Plan pricing (in days)
const PLAN_DURATIONS = {
  free: null,
  'pro-monthly': 30,
  'pro-yearly': 365,
  'premium-monthly': 30,
  'premium-yearly': 365
};

// Helper to get duration based on plan and billing period
const getPlanDuration = (plan, billingPeriod) => {
  if (plan === 'free') return null;
  return billingPeriod === 'yearly' ? 365 : 30;
};

// @desc    Upgrade user plan
// @route   POST /api/subscription/upgrade
// @access  Private
exports.upgradePlan = asyncHandler(async (req, res) => {
  const { plan, billingPeriod = 'monthly', couponCode } = req.body;

  if (!['pro', 'premium'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan. Choose "pro" or "premium"'
    });
  }

  if (!['monthly', 'yearly'].includes(billingPeriod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid billing period. Choose "monthly" or "yearly"'
    });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Calculate original amount (you can customize these prices)
  const prices = {
    'pro-monthly': 5000,
    'pro-yearly': 42000,
    'premium-monthly': 15000,
    'premium-yearly': 126000
  };

  const priceKey = `${plan}-${billingPeriod}`;
  const originalAmount = prices[priceKey];
  let finalAmount = originalAmount;
  let discountApplied = null;

  // Apply coupon if provided
  if (couponCode) {
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

  // Calculate expiry date based on billing period
  const duration = getPlanDuration(plan, billingPeriod);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + duration);

  user.plan = plan;
  user.billingPeriod = billingPeriod;
  user.planExpiry = expiryDate;
  user.lastBillingDate = new Date();
  user.subscriptionStatus = 'active';

  await user.save();

  res.json({
    success: true,
    message: `Successfully upgraded to ${plan} plan (${billingPeriod})`,
    data: {
      plan: user.plan,
      billingPeriod: user.billingPeriod,
      planExpiry: user.planExpiry,
      autoRenew: user.autoRenew,
      subscriptionStatus: user.subscriptionStatus,
      payment: {
        originalAmount,
        finalAmount,
        discountApplied
      }
    }
  });
});

// @desc    Renew current plan
// @route   POST /api/subscription/renew
// @access  Private
exports.renewPlan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.plan === 'free') {
    return res.status(400).json({
      success: false,
      message: 'Cannot renew free plan. Please upgrade first.'
    });
  }

  // Use current billing period (monthly or yearly)
  const billingPeriod = user.billingPeriod || 'monthly';
  const duration = getPlanDuration(user.plan, billingPeriod);
  const now = new Date();

  // If plan already expired, start from now
  // If not expired, extend from current expiry
  const startDate = user.planExpiry && user.planExpiry > now ? user.planExpiry : now;

  const newExpiry = new Date(startDate);
  newExpiry.setDate(newExpiry.getDate() + duration);

  user.planExpiry = newExpiry;
  user.lastBillingDate = now;
  user.subscriptionStatus = 'active';

  await user.save();

  const periodText = billingPeriod === 'yearly' ? '1 year' : '30 days';

  res.json({
    success: true,
    message: `Successfully renewed ${user.plan} plan for ${periodText}`,
    data: {
      plan: user.plan,
      billingPeriod: user.billingPeriod,
      planExpiry: user.planExpiry,
      autoRenew: user.autoRenew,
      subscriptionStatus: user.subscriptionStatus
    }
  });
});

// @desc    Toggle auto-renewal
// @route   PATCH /api/subscription/auto-renew
// @access  Private
exports.toggleAutoRenew = asyncHandler(async (req, res) => {
  const { autoRenew } = req.body;

  if (typeof autoRenew !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'autoRenew must be a boolean value'
    });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.plan === 'free') {
    return res.status(400).json({
      success: false,
      message: 'Auto-renewal is not available for free plan'
    });
  }

  user.autoRenew = autoRenew;
  await user.save();

  res.json({
    success: true,
    message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`,
    data: {
      autoRenew: user.autoRenew
    }
  });
});

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.plan === 'free') {
    return res.status(400).json({
      success: false,
      message: 'You are already on the free plan'
    });
  }

  user.autoRenew = false;
  user.subscriptionStatus = 'cancelled';

  await user.save();

  res.json({
    success: true,
    message: 'Subscription cancelled. You can continue using your current plan until expiry.',
    data: {
      plan: user.plan,
      planExpiry: user.planExpiry,
      autoRenew: user.autoRenew,
      subscriptionStatus: user.subscriptionStatus
    }
  });
});

// @desc    Get subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getSubscriptionStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const now = new Date();
  const isExpired = user.planExpiry && user.planExpiry < now;
  const daysRemaining = user.planExpiry
    ? Math.max(0, Math.ceil((user.planExpiry - now) / (1000 * 60 * 60 * 24)))
    : null;

  res.json({
    success: true,
    data: {
      plan: user.plan,
      billingPeriod: user.billingPeriod || 'monthly',
      planExpiry: user.planExpiry,
      autoRenew: user.autoRenew,
      subscriptionStatus: user.subscriptionStatus,
      lastBillingDate: user.lastBillingDate,
      isExpired,
      daysRemaining
    }
  });
});

// @desc    Check and downgrade expired subscriptions (called by cron or middleware)
// @route   Internal function
// @access  Internal
exports.checkExpiredSubscriptions = async () => {
  const now = new Date();

  try {
    // Find users with expired paid plans
    const expiredUsers = await User.find({
      plan: { $in: ['pro', 'premium'] },
      planExpiry: { $lt: now },
      subscriptionStatus: { $ne: 'cancelled' }
    });

    console.log(`[Subscription] Found ${expiredUsers.length} expired subscriptions`);

    for (const user of expiredUsers) {
      // Check if auto-renewal is enabled
      if (user.autoRenew) {
        // TODO: Process payment here (integrate with payment gateway)
        // For now, just log that auto-renewal would happen
        const billingPeriod = user.billingPeriod || 'monthly';
        console.log(`[Subscription] Auto-renewal triggered for user ${user.email} (${user.plan} - ${billingPeriod})`);

        // Simulate successful renewal with correct duration
        const duration = getPlanDuration(user.plan, billingPeriod);
        const newExpiry = new Date(user.planExpiry);
        newExpiry.setDate(newExpiry.getDate() + duration);

        user.planExpiry = newExpiry;
        user.lastBillingDate = now;
        user.subscriptionStatus = 'active';

        await user.save();
        const periodText = billingPeriod === 'yearly' ? '1 year' : '30 days';
        console.log(`[Subscription] Successfully renewed ${user.email} for ${periodText} until ${newExpiry}`);
      } else {
        // Downgrade to free plan
        console.log(`[Subscription] Downgrading ${user.email} from ${user.plan} to free`);

        user.plan = 'free';
        user.planExpiry = null;
        user.subscriptionStatus = 'expired';
        user.autoRenew = false;

        await user.save();
        // Enforce Free plan limits non-destructively (deactivate extra shops, show branding)
        try {
          const { enforceFreePlanForUser } = require('../utils/planEnforcement');
          await enforceFreePlanForUser(user._id, { destructive: false });
        } catch (e) {
          console.warn('[Subscription] Enforcement error (non-fatal):', e.message);
        }

        // TODO: Send email notification about expiration
        console.log(`[Subscription] User ${user.email} downgraded to free plan`);
      }
    }

    return {
      success: true,
      processed: expiredUsers.length
    };
  } catch (error) {
    console.error('[Subscription] Error checking expired subscriptions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
