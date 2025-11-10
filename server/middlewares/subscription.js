const User = require('../models/User');

/**
 * Middleware to check subscription expiry and auto-downgrade expired users
 * Add this middleware AFTER auth middleware on routes that require active subscription
 */
const checkSubscriptionExpiry = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Skip check for free plan users
    if (user.plan === 'free') {
      return next();
    }
    
    const now = new Date();
    
    // Check if plan has expired
    if (user.planExpiry && user.planExpiry < now) {
      console.log(`[Subscription] Plan expired for ${user.email}, downgrading to free`);
      
      // Auto-downgrade to free plan
      user.plan = 'free';
      user.planExpiry = null;
      user.subscriptionStatus = 'expired';
      user.autoRenew = false;
      
      await user.save();
      
      // Update req.user with new plan info
      req.user.plan = 'free';
      req.user.subscriptionStatus = 'expired';
      
      return res.status(402).json({
        success: false,
        message: 'Your subscription has expired and you have been downgraded to the free plan. Please upgrade to continue using premium features.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    // Update subscription status to active if it was cancelled but still within period
    if (user.subscriptionStatus === 'cancelled' && user.planExpiry > now) {
      user.subscriptionStatus = 'active';
      await user.save();
    }
    
    next();
  } catch (error) {
    console.error('[Subscription] Error checking expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

/**
 * Middleware to require a specific plan level
 * Usage: requirePlan(['pro', 'premium'])
 */
const requirePlan = (allowedPlans) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!allowedPlans.includes(user.plan)) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${allowedPlans.join(' or ')} plan. Please upgrade your subscription.`,
          code: 'PLAN_REQUIRED',
          requiredPlans: allowedPlans,
          currentPlan: user.plan
        });
      }
      
      next();
    } catch (error) {
      console.error('[Subscription] Error checking plan:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking plan requirements'
      });
    }
  };
};

module.exports = {
  checkSubscriptionExpiry,
  requirePlan
};
