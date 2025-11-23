const User = require('../models/User');
const { sendEmail } = require('../utils/notify');

/**
 * Middleware to check subscription expiry and auto-downgrade expired users
 * Add this middleware AFTER auth middleware on routes that require active subscription
 * This provides real-time plan enforcement on every request
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
      const previousPlan = user.plan;
      user.plan = 'free';
      user.planExpiry = null;
      user.subscriptionStatus = 'expired';
      user.autoRenew = false;

      await user.save();

      // Enforce Free plan non-destructively (do not delete user data here)
      try {
        const { enforceFreePlanForUser } = require('../utils/planEnforcement');
        await enforceFreePlanForUser(user._id, { destructive: false });
      } catch (e) {
        console.warn('[Subscription] Enforcement error (middleware):', e.message);
      }

      // Send downgrade notification email (fire and forget)
      sendEmail({
        to: user.email,
        subject: 'WaZhop: Your Subscription Has Expired',
        html: `
          <h2>Your ${previousPlan.toUpperCase()} subscription has expired</h2>
          <p>Hi ${user.name},</p>
          <p>Your subscription has expired and your account has been downgraded to the <strong>Free plan</strong>.</p>
          <h3>What this means:</h3>
          <ul>
            <li>You can only access Free plan features (1 shop, 10 products max)</li>
            <li>Additional shops and products are now hidden</li>
            <li>Premium features like analytics, custom domain, and advanced themes are disabled</li>
          </ul>
          <p><strong>Don't worry!</strong> All your data is safe. Upgrade anytime to restore full access.</p>
          <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Subscription</a></p>
          <p>Best regards,<br>WaZhop Team</p>
        `
      }).catch((err) => console.error('[Subscription] Failed to send expiry email:', err.message));

      // Update req.user with new plan info
      req.user.plan = 'free';
      req.user.subscriptionStatus = 'expired';

      return res.status(402).json({
        success: false,
        message: `Your ${previousPlan.toUpperCase()} subscription has expired. You have been downgraded to the Free plan. Please upgrade to continue using premium features.`,
        code: 'SUBSCRIPTION_EXPIRED',
        previousPlan,
        currentPlan: 'free',
        upgradeUrl: '/dashboard/subscription'
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
 * This ensures users can only access features within their active subscription plan
 */
const requirePlan = (allowedPlans) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user's plan is in the allowed plans
    if (!allowedPlans.includes(user.plan)) {
      const requiredPlanText = allowedPlans.length === 1
        ? allowedPlans[0].toUpperCase()
        : allowedPlans.map((p) => p.toUpperCase()).join(' or ');

      return res.status(403).json({
        success: false,
        message: `This feature requires ${requiredPlanText} plan. Please upgrade your subscription.`,
        code: 'PLAN_REQUIRED',
        requiredPlans: allowedPlans,
        currentPlan: user.plan,
        upgradeUrl: '/dashboard/subscription'
      });
    }

    // Additional check: ensure plan is not expired (even if plan field shows pro/premium)
    if (user.plan !== 'free' && user.planExpiry && user.planExpiry < new Date()) {
      return res.status(402).json({
        success: false,
        message: 'Your subscription has expired. Please renew to access this feature.',
        code: 'SUBSCRIPTION_EXPIRED',
        currentPlan: user.plan,
        upgradeUrl: '/dashboard/subscription'
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

/**
 * Utility function to validate if a user has access to a specific plan feature
 * Can be used in controllers for custom validation
 */
const validatePlanAccess = async (userId, requiredPlan) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return {
        hasAccess: false,
        reason: 'USER_NOT_FOUND',
        message: 'User not found'
      };
    }

    const now = new Date();

    // Check if plan is expired
    if (user.plan !== 'free' && user.planExpiry && user.planExpiry < now) {
      return {
        hasAccess: false,
        reason: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired',
        currentPlan: user.plan,
        expiredAt: user.planExpiry
      };
    }

    // Define plan hierarchy: free < pro < premium
    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    const userPlanLevel = planHierarchy[user.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return {
        hasAccess: false,
        reason: 'INSUFFICIENT_PLAN',
        message: `This feature requires ${requiredPlan.toUpperCase()} plan or higher`,
        currentPlan: user.plan,
        requiredPlan
      };
    }

    return {
      hasAccess: true,
      currentPlan: user.plan,
      planExpiry: user.planExpiry
    };
  } catch (error) {
    console.error('[Subscription] Error validating plan access:', error);
    return {
      hasAccess: false,
      reason: 'VALIDATION_ERROR',
      message: 'Error validating plan access'
    };
  }
};

module.exports = {
  checkSubscriptionExpiry,
  requirePlan,
  validatePlanAccess
};
