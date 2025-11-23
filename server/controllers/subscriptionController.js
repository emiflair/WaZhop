const axios = require('axios');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../utils/helpers');
const { sendEmail } = require('../utils/notify');

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

// @desc    Verify Flutterwave payment and upgrade plan
// @route   POST /api/subscription/verify-payment
// @access  Private
exports.verifyPaymentAndUpgrade = asyncHandler(async (req, res) => {
  const {
    transactionId, txRef, plan, billingPeriod, couponCode
  } = req.body;

  if (!transactionId || !txRef) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID and reference are required'
    });
  }

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

  // Check if this is a free upgrade (100% discount)
  const isFreeUpgrade = transactionId.startsWith('FREE_') && txRef.startsWith('free_upgrade_');

  if (isFreeUpgrade) {
    // Process free upgrade without payment verification
    try {
      // Get expected amount based on plan
      const prices = {
        'pro-monthly': 9000,
        'pro-yearly': 75600,
        'premium-monthly': 18000,
        'premium-yearly': 151200
      };

      const priceKey = `${plan}-${billingPeriod}`;
      const expectedAmount = prices[priceKey];
      let finalAmount = expectedAmount;
      let discountApplied = null;

      // Verify coupon provides 100% discount
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: 'Invalid coupon code'
          });
        }

        const validation = coupon.isValid();
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message
          });
        }

        if (!coupon.applicablePlans.includes(plan)) {
          return res.status(400).json({
            success: false,
            message: `Coupon not applicable to ${plan} plan`
          });
        }

        const discount = coupon.calculateDiscount(expectedAmount);
        finalAmount = discount.finalAmount;

        // Verify it's actually a 100% discount
        if (finalAmount > 0) {
          return res.status(400).json({
            success: false,
            message: 'Free upgrade requires 100% discount coupon'
          });
        }

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
      } else {
        return res.status(400).json({
          success: false,
          message: 'Coupon code required for free upgrade'
        });
      }

      // Upgrade user plan
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Calculate expiry date
      const duration = getPlanDuration(plan, billingPeriod);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);

      user.plan = plan;
      user.billingPeriod = billingPeriod;
      user.planExpiry = expiryDate;
      user.lastBillingDate = new Date();
      user.subscriptionStatus = 'active';
      user.renewalAttempts = 0;
      user.lastRenewalAttempt = null;
      user.renewalFailureReason = null;

      await user.save();

      return res.json({
        success: true,
        message: `Successfully upgraded to ${plan} plan (${billingPeriod}) - Free with 100% discount!`,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          billingPeriod: user.billingPeriod,
          planExpiry: user.planExpiry,
          subscriptionStatus: user.subscriptionStatus
        },
        payment: {
          transactionId,
          amount: 0,
          currency: 'NGN',
          discountApplied
        }
      });
    } catch (error) {
      console.error('Free upgrade error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process free upgrade. Please try again.'
      });
    }
  }

  // Verify payment with Flutterwave for paid upgrades
  try {
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveSecretKey) {
      console.error('Flutterwave secret key not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment verification is not configured. Please contact support.'
      });
    }

    // Verify transaction with Flutterwave API
    const verifyResponse = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`
        }
      }
    );

    const paymentData = verifyResponse.data.data;

    // Check if payment was successful
    if (paymentData.status !== 'successful') {
      return res.status(400).json({
        success: false,
        message: 'Payment was not successful. Please try again.'
      });
    }

    // Check if transaction reference matches
    if (paymentData.tx_ref !== txRef) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference mismatch. Please contact support.'
      });
    }

    // Get expected amount based on plan
    const prices = {
      'pro-monthly': 9000,
      'pro-yearly': 75600,
      'premium-monthly': 18000,
      'premium-yearly': 151200
    };

    const priceKey = `${plan}-${billingPeriod}`;
    const expectedAmount = prices[priceKey];
    let finalAmount = expectedAmount;
    let discountApplied = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (coupon) {
        const validation = coupon.isValid();
        if (validation.valid && coupon.applicablePlans.includes(plan)) {
          const discount = coupon.calculateDiscount(expectedAmount);
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
      }
    }

    // Verify amount paid (with 1 NGN tolerance for rounding)
    if (Math.abs(paymentData.amount - finalAmount) > 1) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected ₦${finalAmount.toLocaleString()}, got ₦${paymentData.amount.toLocaleString()}`
      });
    }

    // Payment verified successfully - upgrade user plan
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate expiry date
    const duration = getPlanDuration(plan, billingPeriod);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    user.plan = plan;
    user.billingPeriod = billingPeriod;
    user.planExpiry = expiryDate;
    user.lastBillingDate = new Date();
    user.subscriptionStatus = 'active';
    // Reset renewal attempts on successful payment
    user.renewalAttempts = 0;
    user.lastRenewalAttempt = null;
    user.renewalFailureReason = null;

    await user.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan (${billingPeriod})`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        billingPeriod: user.billingPeriod,
        planExpiry: user.planExpiry,
        subscriptionStatus: user.subscriptionStatus
      },
      payment: {
        transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        discountApplied
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found. Please contact support.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment. Please contact support with your transaction reference.'
    });
  }
});

// @desc    Check and downgrade expired subscriptions (called by cron or middleware)
// @route   Internal function
// @access  Internal
exports.checkExpiredSubscriptions = async () => {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Find users whose subscriptions expire in the next 24 hours (for warning emails)
    const expiringUsers = await User.find({
      plan: { $in: ['pro', 'premium'] },
      planExpiry: { $gt: now, $lte: twentyFourHoursFromNow },
      subscriptionStatus: 'active',
      lastExpiryWarning: { $exists: false } // Only send warning once
    });

    console.log(`[Subscription] Found ${expiringUsers.length} subscriptions expiring in 24 hours`);

    // Send 24-hour warning emails
    for (const user of expiringUsers) {
      const hoursRemaining = Math.ceil((user.planExpiry - now) / (1000 * 60 * 60));
      const planText = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);

      const warningEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">⚠️ Your WaZhop Subscription Expires Soon</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Your <strong>${planText} plan</strong> will expire in approximately <strong>${hoursRemaining} hours</strong>.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <strong>Expiry Date:</strong> ${new Date(user.planExpiry).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
          </div>

          <h3>What happens after expiry:</h3>
          <ul style="color: #555;">
            <li>Your account will be downgraded to the <strong>Free plan</strong></li>
            <li>You'll lose access to premium features (analytics, custom domain, etc.)</li>
            <li>Only 1 shop and 10 products will remain active</li>
            <li>Additional shops and products will be hidden (but not deleted)</li>
          </ul>

          <p style="margin-top: 30px;"><strong>Renew now to keep all your premium features!</strong></p>
          <p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" 
               style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Renew Subscription Now
            </a>
          </p>

          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Don't worry - all your data is safe! You can upgrade anytime to restore full access.
          </p>

          <p style="margin-top: 30px;">Best regards,<br><strong>WaZhop Team</strong></p>
        </div>
      `;

      try {
        await sendEmail({
          to: user.email,
          subject: `⚠️ WaZhop: Your ${planText} Plan Expires in ${hoursRemaining} Hours`,
          html: warningEmailHtml
        });

        // Mark that warning was sent
        user.lastExpiryWarning = now;
        await user.save();

        console.log(`[Subscription] Warning email sent to ${user.email} (expires in ${hoursRemaining}h)`);
      } catch (emailError) {
        console.error(`[Subscription] Failed to send warning email to ${user.email}:`, emailError.message);
      }
    }

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
        const billingPeriod = user.billingPeriod || 'monthly';
        const maxAttempts = 3;

        // Check if we've already tried 3 times
        if (user.renewalAttempts >= maxAttempts) {
          console.log(`[Subscription] Max renewal attempts (${maxAttempts}) reached for ${user.email}. Downgrading to free.`);

          // Downgrade after 3 failed attempts
          user.plan = 'free';
          user.planExpiry = null;
          user.subscriptionStatus = 'cancelled';
          user.autoRenew = false;
          user.renewalAttempts = 0;
          user.renewalFailureReason = `Auto-renewal failed after ${maxAttempts} attempts`;

          await user.save();

          // Enforce free plan limits
          try {
            const { enforceFreePlanForUser } = require('../utils/planEnforcement');
            await enforceFreePlanForUser(user._id, { destructive: false });
          } catch (e) {
            console.warn('[Subscription] Enforcement error (non-fatal):', e.message);
          }

          // Send email notification about downgrade
          const previousPlan = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
          const downgradeEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">❌ Your WaZhop Subscription Has Been Downgraded</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Your <strong>${previousPlan} plan</strong> subscription has been downgraded to the <strong>Free plan</strong> after ${maxAttempts} failed renewal attempts.</p>
              
              <div style="background: #fee; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
                <strong>Reason:</strong> ${user.renewalFailureReason}
              </div>

              <h3>What this means for your account:</h3>
              <ul style="color: #555;">
                <li>✅ You now have access to <strong>Free plan features only</strong> (1 shop, 10 products max)</li>
                <li>🔒 Extra shops and products beyond free limits have been <strong>deactivated</strong> (not deleted)</li>
                <li>❌ Premium features are <strong>no longer available</strong> (analytics, custom domain, advanced themes, etc.)</li>
                <li>💾 All your data is <strong>safe and preserved</strong> - nothing has been deleted</li>
              </ul>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
                <strong>Good News:</strong> You can upgrade anytime to restore all your premium features and reactivate hidden shops/products!
              </div>

              <p style="margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" 
                   style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Upgrade to Restore Access
                </a>
              </p>

              <p style="margin-top: 30px;">Thank you for using WaZhop!</p>
              <p>Best regards,<br><strong>WaZhop Team</strong></p>
            </div>
          `;

          try {
            await sendEmail({
              to: user.email,
              subject: 'WaZhop: Your Subscription Has Been Downgraded',
              html: downgradeEmailHtml
            });
            console.log(`[Subscription] Downgrade notification sent to ${user.email}`);
          } catch (emailError) {
            console.error(`[Subscription] Failed to send downgrade email to ${user.email}:`, emailError.message);
          }

          console.log(`[Subscription] User ${user.email} downgraded to free after failed renewal attempts`);
          continue;
        }

        // Attempt auto-renewal payment
        console.log(`[Subscription] Auto-renewal attempt ${user.renewalAttempts + 1}/${maxAttempts} for ${user.email} (${user.plan} - ${billingPeriod})`);

        try {
          // Calculate renewal amount
          const planPrices = {
            'pro-monthly': 9000,
            'pro-yearly': 75600,
            'premium-monthly': 18000,
            'premium-yearly': 151200
          };
          const priceKey = `${user.plan}-${billingPeriod}`;
          const amount = planPrices[priceKey];

          if (!amount) {
            throw new Error(`Invalid plan/billing combination: ${priceKey}`);
          }

          // Note: Flutterwave doesn't support automatic card charging without user interaction
          // You would need to implement one of these solutions:
          // 1. Use Flutterwave's recurring payment feature with saved cards
          // 2. Send email reminder to user to renew manually
          // 3. Use a different payment gateway that supports auto-charging

          // For now, we'll send reminder and give grace period
          console.log(`[Subscription] Would charge ${amount} NGN for ${user.email}`);

          // Increment attempt counter
          user.renewalAttempts += 1;
          user.lastRenewalAttempt = now;
          user.renewalFailureReason = 'Manual payment required - check email for renewal link';

          // Give 7-day grace period before next attempt
          const gracePeriod = 7; // days
          user.planExpiry = new Date(user.planExpiry);
          user.planExpiry.setDate(user.planExpiry.getDate() + gracePeriod);

          await user.save();

          // Send email reminder for manual renewal
          const periodText = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
          const planText = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
          const daysRemaining = Math.ceil((user.planExpiry - now) / (1000 * 60 * 60 * 24));

          const emailHtml = `
            <h2>WaZhop Subscription Renewal Required</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Your <strong>${planText} ${periodText}</strong> subscription requires renewal.</p>
            <p><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
            <p><strong>Days remaining:</strong> ${daysRemaining} days (grace period)</p>
            <p><strong>Renewal attempt:</strong> ${user.renewalAttempts} of ${maxAttempts}</p>
            <p>Please renew your subscription to continue enjoying premium features.</p>
            <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Renew Subscription</a></p>
            <p style="color: #ef4444; margin-top: 20px;"><strong>Important:</strong> If you don't renew within ${daysRemaining} days or after ${maxAttempts - user.renewalAttempts} more attempts, your account will be downgraded to the Free plan.</p>
            <p>Best regards,<br>WaZhop Team</p>
          `;

          try {
            await sendEmail({
              to: user.email,
              subject: `WaZhop: Subscription Renewal Required (Attempt ${user.renewalAttempts}/${maxAttempts})`,
              html: emailHtml
            });
            console.log(`[Subscription] Renewal reminder sent to ${user.email}`);
          } catch (emailError) {
            console.error(`[Subscription] Failed to send renewal email to ${user.email}:`, emailError.message);
          }

          console.log(`[Subscription] Grace period extended for ${user.email}. Attempt ${user.renewalAttempts}/${maxAttempts}`);
        } catch (error) {
          console.error(`[Subscription] Renewal error for ${user.email}:`, error.message);

          // Increment attempt counter on error
          user.renewalAttempts += 1;
          user.lastRenewalAttempt = now;
          user.renewalFailureReason = error.message;

          await user.save();
        }
      } else {
        // Downgrade to free plan (no auto-renew enabled)
        console.log(`[Subscription] Downgrading ${user.email} from ${user.plan} to free (no auto-renew)`);

        const previousPlan = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
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

        // Send email notification about expiration
        const expirationEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Your WaZhop Subscription Has Expired</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Your <strong>${previousPlan} plan</strong> subscription has expired and your account has been downgraded to the <strong>Free plan</strong>.</p>
            
            <div style="background: #fee; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
              <strong>Expiry Date:</strong> ${new Date(user.planExpiry || now).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
            </div>

            <h3>What this means:</h3>
            <ul style="color: #555;">
              <li>You can only access <strong>Free plan features</strong> (1 shop, 10 products max)</li>
              <li>Additional shops and products are now <strong>hidden</strong> but safely preserved</li>
              <li>Premium features like analytics, custom domain, and advanced themes are disabled</li>
              <li>WaZhop branding will be shown on your shop</li>
            </ul>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
              <strong>Good News:</strong> All your data is safe! Upgrade anytime to restore full access to all your shops, products, and premium features.
            </div>

            <p style="margin-top: 30px;"><strong>Ready to upgrade?</strong></p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" 
                 style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Renew Your Subscription
              </a>
            </p>

            <p style="margin-top: 30px;">Thank you for being part of WaZhop!</p>
            <p>Best regards,<br><strong>WaZhop Team</strong></p>
          </div>
        `;

        try {
          await sendEmail({
            to: user.email,
            subject: 'WaZhop: Your Subscription Has Expired',
            html: expirationEmailHtml
          });
          console.log(`[Subscription] Expiration notification sent to ${user.email}`);
        } catch (emailError) {
          console.error(`[Subscription] Failed to send expiration email to ${user.email}:`, emailError.message);
        }

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
