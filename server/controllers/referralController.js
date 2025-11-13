const User = require('../models/User');

// @desc    Get user's referral stats and code
// @route   GET /api/referrals/stats
// @access  Private
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode referralStats plan planExpiry');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate referral code if user doesn't have one (for existing users)
    if (!user.referralCode) {
      const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

      let code = generateCode();
      let attempts = 0;

      // Ensure uniqueness
      while (attempts < 5) {
        const existing = await User.findOne({ referralCode: code });
        if (!existing) {
          user.referralCode = code;
          break;
        }
        code = generateCode();
        attempts++;
      }

      if (!user.referralCode) {
        user.referralCode = `${generateCode()}${Date.now().toString(36).slice(-4)}`;
      }

      await user.save();
    }

    // Initialize referralStats if not present
    if (!user.referralStats) {
      user.referralStats = {
        totalReferrals: 0,
        freeReferred: 0,
        proReferred: 0,
        premiumReferred: 0,
        rewardsEarned: 0,
        rewardsUsed: 0
      };
      await user.save();
    }

    // Get list of referred users
    const referredUsers = await User.find({ referredBy: req.user.id })
      .select('name email plan createdAt')
      .sort('-createdAt')
      .limit(50);

    // Build referral link with fallback
    // If CLIENT_URL has multiple URLs (comma-separated), use the first one
    const clientUrl = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')[0].trim()
      : 'http://localhost:5173';

    const responseData = {
      referralCode: user.referralCode,
      referralLink: `${clientUrl}/register?ref=${user.referralCode}`,
      stats: user.referralStats,
      currentPlan: user.plan,
      planExpiry: user.planExpiry,
      referredUsers
    };

    console.log('📤 Sending referral data:', {
      referralCode: responseData.referralCode,
      referralLink: responseData.referralLink,
      stats: responseData.stats,
      currentPlan: responseData.currentPlan
    });

    // Set cache control headers to prevent 304 responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(responseData);
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Apply referral code during registration
// @route   POST /api/referrals/apply
// @access  Public
exports.applyReferralCode = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    console.log('🎯 Applying referral code:', { referralCode, newUserId });

    if (!referralCode || !newUserId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Referral code and user ID required' });
    }

    // Find referrer by code
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });

    if (!referrer) {
      console.log('❌ Invalid referral code:', referralCode);
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    console.log('✅ Found referrer:', { id: referrer._id, email: referrer.email, name: referrer.name });

    // Find new user
    const newUser = await User.findById(newUserId);

    if (!newUser) {
      console.log('❌ New user not found:', newUserId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Found new user:', { id: newUser._id, email: newUser.email, name: newUser.name });

    // Check if user already has a referrer
    if (newUser.referredBy) {
      console.log('⚠️ User already has a referrer:', newUser.referredBy);
      return res.status(400).json({ message: 'User already has a referrer' });
    }

    // Link referral
    newUser.referredBy = referrer._id;
    await newUser.save();

    console.log('✅ Linked referral: newUser.referredBy =', newUser.referredBy);

    // Update referrer stats - but DON'T award rewards yet
    // User must upgrade to Pro/Premium first
    referrer.referralStats.totalReferrals += 1;
    referrer.referralStats.freeReferred += 1; // New user starts on free plan

    // NOTE: Rewards will be given when referred user upgrades to Pro/Premium
    // See notifyReferrerOfUpgrade function

    await referrer.save();

    console.log('✅ Updated referrer stats:', {
      totalReferrals: referrer.referralStats.totalReferrals,
      freeReferred: referrer.referralStats.freeReferred
    });

    res.json({
      message: 'Referral applied successfully',
      referrer: {
        name: referrer.name,
        totalReferrals: referrer.referralStats.totalReferrals
      }
    });
  } catch (error) {
    console.error('❌ Apply referral error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Validate referral code
// @route   GET /api/referrals/validate/:code
// @access  Public
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    const referrer = await User.findOne({ referralCode: code.toUpperCase() })
      .select('name referralCode');

    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrerName: referrer.name
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Claim referral rewards (convert to plan upgrade)
// @route   POST /api/referrals/claim
// @access  Private
exports.claimRewards = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const availableRewards = user.referralStats.rewardsEarned - user.referralStats.rewardsUsed;

    if (availableRewards < 30) {
      return res.status(400).json({
        message: 'Insufficient rewards. Need at least 30 days (5 referrals) to claim.'
      });
    }

    // Apply reward - extend plan by 30 days
    const daysToAdd = Math.floor(availableRewards / 30) * 30;

    if (user.plan === 'free') {
      // Upgrade to Pro
      user.plan = 'pro';
      user.planExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      // Extend existing plan
      const currentExpiry = user.planExpiry || new Date();
      const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      user.planExpiry = newExpiry;
    }

    user.referralStats.rewardsUsed += daysToAdd;
    await user.save();

    res.json({
      message: `Successfully claimed ${daysToAdd} days of Pro plan!`,
      plan: user.plan,
      planExpiry: user.planExpiry,
      remainingRewards: user.referralStats.rewardsEarned - user.referralStats.rewardsUsed
    });
  } catch (error) {
    console.error('Claim rewards error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update referrer stats when referred user upgrades
// @route   POST /api/referrals/upgrade-notification
// @access  Private (called internally when user upgrades)
exports.notifyReferrerOfUpgrade = async (upgradedUserId, newPlan) => {
  try {
    const user = await User.findById(upgradedUserId);

    if (!user || !user.referredBy) {
      console.log('No referral to notify - user not referred or no referrer');
      return;
    }

    const referrer = await User.findById(user.referredBy);

    if (!referrer) {
      console.log('Referrer not found');
      return;
    }

    console.log(`📢 Notifying referrer ${referrer.name} of upgrade to ${newPlan}`);

    // Update referrer's stats based on upgrade
    // Decrease free count, increase paid count
    if (referrer.referralStats.freeReferred > 0) {
      referrer.referralStats.freeReferred -= 1;
    }

    if (newPlan === 'pro') {
      referrer.referralStats.proReferred += 1;
      referrer.referralStats.rewardsEarned += 15; // 15 days for Pro upgrade
      console.log('✅ Referrer earned 15 days for Pro referral');
    } else if (newPlan === 'premium') {
      referrer.referralStats.premiumReferred += 1;
      referrer.referralStats.rewardsEarned += 30; // 30 days for Premium upgrade
      console.log('✅ Referrer earned 30 days for Premium referral');
    }

    await referrer.save();
    console.log('💾 Referrer stats updated:', referrer.referralStats);
  } catch (error) {
    console.error('Notify referrer error:', error);
  }
};
