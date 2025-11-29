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

const PLAN_PRICES = {
  pro: {
    monthly: 9000,
    yearly: 75600
  },
  premium: {
    monthly: 18000,
    yearly: 151200
  }
};

// Helper to get duration based on plan and billing period
const getPlanDuration = (plan, billingPeriod) => {
  if (plan === 'free') return null;
  return billingPeriod === 'yearly' ? 365 : 30;
};

const getPlanPrice = (plan, billingPeriod) => {
  if (!PLAN_PRICES[plan] || !PLAN_PRICES[plan][billingPeriod]) {
    throw new Error(`Unknown plan pricing for ${plan} (${billingPeriod})`);
  }
  return PLAN_PRICES[plan][billingPeriod];
};

const saveCardTokenIfAvailable = async (user, paymentData) => {
  const token = paymentData?.card?.token || paymentData?.meta?.authorization?.token;

  if (!token) {
    return false;
  }

  user.savedPaymentMethod = {
    cardToken: token,
    cardLast4: paymentData?.card?.last4 || paymentData?.meta?.authorization?.last4 || null,
    cardType: paymentData?.card?.type || paymentData?.meta?.authorization?.card_type || null,
    cardExpiry: paymentData?.card?.expiry || paymentData?.meta?.authorization?.expiry || null,
    paymentGateway: 'flutterwave',
    lastChargeId: paymentData?.id || paymentData?.flw_ref || null,
    lastChargeDate: new Date()
  };

  await user.save();
  return true;
};

const applySuccessfulSubscriptionPayment = async ({
  user,
  plan,
  billingPeriod,
  extendFromExisting = false
}) => {
  const duration = getPlanDuration(plan, billingPeriod);
  const now = new Date();

  const startDate = extendFromExisting && user.planExpiry && user.planExpiry > now
    ? user.planExpiry
    : now;

  const newExpiry = new Date(startDate);
  newExpiry.setDate(newExpiry.getDate() + duration);

  user.plan = plan;
  user.billingPeriod = billingPeriod;
  user.planExpiry = newExpiry;
  user.lastBillingDate = now;
  user.subscriptionStatus = 'active';
  user.renewalAttempts = 0;
  user.lastRenewalAttempt = null;
  user.renewalFailureReason = null;

  await user.save();

  return {
    plan: user.plan,
    billingPeriod: user.billingPeriod,
    planExpiry: user.planExpiry,
    autoRenew: user.autoRenew,
    subscriptionStatus: user.subscriptionStatus
  };
};

const chargeSavedPaymentMethod = async ({ user, amount, plan, billingPeriod }) => {
  if (!user.savedPaymentMethod?.cardToken) {
    throw new Error('No saved payment method available.');
  }

  const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!flutterwaveSecretKey) {
    throw new Error('Payment gateway not configured');
  }

  const txRef = `sub_renew_${user._id}_${Date.now()}`;

  const payload = {
    token: user.savedPaymentMethod.cardToken,
    amount,
    currency: 'NGN',
    email: user.email,
    tx_ref: txRef,
    narration: `WaZhop ${plan} ${billingPeriod} renewal`,
    ip: user.lastLoginIP || undefined
  };

  const response = await axios.post(
    'https://api.flutterwave.com/v3/tokenized-charges',
    payload,
    {
      headers: {
        Authorization: `Bearer ${flutterwaveSecretKey}`
      }
    }
  );

  const data = response?.data;

  if (!data || data.status !== 'success' || data.data?.status !== 'successful') {
    const errMessage = data?.message || 'Unable to complete renewal charge';
    throw new Error(errMessage);
  }

  // Persist latest charge metadata
  user.savedPaymentMethod.lastChargeDate = new Date();
  user.savedPaymentMethod.lastChargeId = data.data?.id || data.data?.flw_ref || txRef;
  await user.save();

  return data.data;
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

  const { useSavedPaymentMethod = true } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const originalAmount = getPlanPrice(plan, billingPeriod);
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

  const subscriptionData = await applySuccessfulSubscriptionPayment({
    user,
    plan,
    billingPeriod,
    extendFromExisting: false
  });

  res.json({
    success: true,
    message: `Successfully upgraded to ${plan} plan (${billingPeriod})`,
    data: {
      ...subscriptionData,
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
  const { useSavedPaymentMethod = true } = req.body;
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

  const billingPeriod = user.billingPeriod || 'monthly';
  const amount = getPlanPrice(user.plan, billingPeriod);

  if (!useSavedPaymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Manual renewals require payment verification. Please complete payment first.'
    });
  }

  try {
    await chargeSavedPaymentMethod({
      user,
      amount,
      plan: user.plan,
      billingPeriod
    });

    const subscriptionData = await applySuccessfulSubscriptionPayment({
      user,
      plan: user.plan,
      billingPeriod,
      extendFromExisting: true
    });

    const periodText = billingPeriod === 'yearly' ? '1 year' : '30 days';

    return res.json({
      success: true,
      message: `Successfully renewed ${user.plan} plan for ${periodText}`,
      data: subscriptionData
    });
  } catch (error) {
    user.renewalAttempts += 1;
    user.lastRenewalAttempt = new Date();
    user.renewalFailureReason = error.message;
    await user.save();

    return res.status(402).json({
      success: false,
      message: error.message || 'Unable to process renewal payment',
      attempts: user.renewalAttempts
    });
  }
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
      const expectedAmount = getPlanPrice(plan, billingPeriod);
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

      const subscriptionData = await applySuccessfulSubscriptionPayment({
        user,
        plan,
        billingPeriod,
        extendFromExisting: false
      });

      return res.json({
        success: true,
        message: `Successfully upgraded to ${plan} plan (${billingPeriod}) - Free with 100% discount!`,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          ...subscriptionData
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

    const expectedAmount = getPlanPrice(plan, billingPeriod);
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

    await saveCardTokenIfAvailable(user, paymentData);

    const subscriptionData = await applySuccessfulSubscriptionPayment({
      user,
      plan,
      billingPeriod,
      extendFromExisting: false
    });

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan (${billingPeriod})`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        ...subscriptionData
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
        const planText = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
        const amount = (() => {
          try {
            return getPlanPrice(user.plan, billingPeriod);
          } catch (err) {
            return null;
          }
        })();

        if (!amount) {
          console.error(`[Subscription] Unknown pricing for ${user.plan} (${billingPeriod}) - disabling auto renew for ${user.email}`);
          user.autoRenew = false;
          user.renewalFailureReason = 'Pricing configuration missing';
          await user.save();
          continue;
        }

        console.log(`[Subscription] Auto-renewal attempt ${user.renewalAttempts + 1}/${maxAttempts} for ${user.email} (${user.plan} - ${billingPeriod})`);

        try {
          const chargeResult = await chargeSavedPaymentMethod({
            user,
            amount,
            plan: user.plan,
            billingPeriod
          });

          const subscriptionData = await applySuccessfulSubscriptionPayment({
            user,
            plan: user.plan,
            billingPeriod,
            extendFromExisting: true
          });

          console.log(`[Subscription] Auto-renewal successful for ${user.email}. Tx: ${chargeResult?.tx_ref || chargeResult?.id}`);

          try {
            await sendEmail({
              to: user.email,
              subject: 'WaZhop: Subscription Renewed Successfully',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #16a34a;">✅ Subscription Renewed Successfully</h2>
                  <p>Hi ${user.name || 'there'},</p>
                  <p>Your <strong>${planText} ${billingPeriod}</strong> plan has been renewed successfully.</p>
                  <ul style="color: #555;">
                    <li>Amount charged: ₦${amount.toLocaleString()}</li>
                    <li>Next renewal date: ${new Date(subscriptionData.planExpiry).toLocaleDateString()}</li>
                    <li>Transaction reference: ${chargeResult?.tx_ref || chargeResult?.id}</li>
                  </ul>
                  <p>Thank you for staying with WaZhop!</p>
                </div>
              `
            });
          } catch (emailError) {
            console.error(`[Subscription] Failed to send renewal success email to ${user.email}:`, emailError.message);
          }

          continue;
        } catch (error) {
          console.error(`[Subscription] Auto-renewal failed for ${user.email}:`, error.message);

          user.renewalAttempts += 1;
          user.lastRenewalAttempt = now;
          user.renewalFailureReason = error.message;
          await user.save();

          const attemptsLeft = maxAttempts - user.renewalAttempts;

          if (attemptsLeft <= 0) {
            console.log(`[Subscription] Max renewal attempts reached for ${user.email}. Downgrading to free.`);

            const previousPlan = planText;
            user.plan = 'free';
            user.planExpiry = null;
            user.subscriptionStatus = 'cancelled';
            user.autoRenew = false;
            user.renewalAttempts = 0;
            user.renewalFailureReason = `Auto-renewal failed after ${maxAttempts} attempts`;

            await user.save();

            try {
              const { enforceFreePlanForUser } = require('../utils/planEnforcement');
              await enforceFreePlanForUser(user._id, { destructive: false });
            } catch (e) {
              console.warn('[Subscription] Enforcement error (non-fatal):', e.message);
            }

            const downgradeEmailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">❌ Your WaZhop Subscription Has Been Downgraded</h2>
                <p>Hi ${user.name || 'there'},</p>
                <p>Your <strong>${previousPlan} plan</strong> subscription has been downgraded to the <strong>Free plan</strong> after multiple failed renewal attempts.</p>
                <p><strong>Reason:</strong> ${user.renewalFailureReason}</p>
                <p>You can update your payment method and upgrade again anytime to restore full access.</p>
                <p>
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" 
                     style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                    Update Payment & Upgrade
                  </a>
                </p>
              </div>
            `;

            try {
              await sendEmail({
                to: user.email,
                subject: 'WaZhop: Subscription Downgraded',
                html: downgradeEmailHtml
              });
            } catch (emailError) {
              console.error(`[Subscription] Failed to send downgrade email to ${user.email}:`, emailError.message);
            }

            continue;
          }

          const failureEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">⚠️ Subscription Renewal Failed</h2>
              <p>Hi ${user.name || 'there'},</p>
              <p>Your automatic renewal for the <strong>${planText}</strong> plan was not successful.</p>
              <p><strong>Reason:</strong> ${error.message}</p>
              <p>Attempts remaining before downgrade: <strong>${attemptsLeft}</strong></p>
              <p>Please update your payment method or renew manually to avoid interruption.</p>
              <p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/subscription" 
                   style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Renew Now
                </a>
              </p>
            </div>
          `;

          try {
            await sendEmail({
              to: user.email,
              subject: 'WaZhop: Subscription Renewal Failed',
              html: failureEmailHtml
            });
          } catch (emailError) {
            console.error(`[Subscription] Failed to send renewal failure email to ${user.email}:`, emailError.message);
          }

          continue;
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
