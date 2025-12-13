const User = require('../models/User');

const PREMIUM_MONTHLY_PRICE = 18000;
const COMMISSION_RATE = 0.05;
const COMMISSION_PERCENT = Math.round(COMMISSION_RATE * 100);
const MIN_PAYOUT_AMOUNT = 20000;
const ACTIVATION_HOLD_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MONTH_IN_MS = 30 * DAY_IN_MS;

const ensureReferralEarningsStructure = (user) => {
  if (!user.referralEarnings) {
    user.referralEarnings = {
      lockedAmount: 0,
      records: [],
      payoutRequests: []
    };
    return;
  }

  user.referralEarnings.lockedAmount = user.referralEarnings.lockedAmount || 0;
  user.referralEarnings.records = user.referralEarnings.records || [];
  user.referralEarnings.payoutRequests = user.referralEarnings.payoutRequests || [];
};

const generateReferralId = () => `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const generatePayoutId = () => `PAYOUT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const defaultEarningsSummary = () => ({
  totalEarned: 0,
  totalPaidOut: 0,
  withdrawableBalance: 0,
  lockedAmount: 0,
  monthlyEarnings: 0,
  activePremiumReferrals: 0,
  pendingActivation: 0,
  commissionPercent: COMMISSION_PERCENT,
  perReferralCommission: Math.round(PREMIUM_MONTHLY_PRICE * COMMISSION_RATE),
  minimumPayout: MIN_PAYOUT_AMOUNT,
  currency: 'NGN'
});

const normalizePayoutRequests = (requests = []) => requests.map((request) => {
  const normalized = request.toObject ? request.toObject() : request;
  if (!normalized.estimatedPayoutDate && normalized.requestedAt) {
    normalized.estimatedPayoutDate = new Date(new Date(normalized.requestedAt).getTime() + (14 * DAY_IN_MS));
  }
  return normalized;
});

const buildEarningsSnapshot = async (user) => {
  ensureReferralEarningsStructure(user);

  if (!user.referralEarnings.records.length && !user.referralEarnings.payoutRequests.length) {
    return {
      summary: defaultEarningsSummary(),
      records: [],
      payoutRequests: []
    };
  }

  await user.populate({
    path: 'referralEarnings.records.referredUser',
    select: 'name email plan subscriptionStatus'
  });

  const now = Date.now();
  let dirty = false;
  let totalEarned = 0;
  let totalPaidOut = 0;
  let lockedAmount = user.referralEarnings.lockedAmount || 0;
  let monthlyEarnings = 0;
  let activePremiumReferrals = 0;
  let pendingActivation = 0;

  const records = user.referralEarnings.records.map((record) => {
    const linkedUser = record.referredUser && record.referredUser._id ? record.referredUser : null;
    const linkedPlan = linkedUser?.plan || record.plan || 'free';
    const subscriptionStatus = linkedUser?.subscriptionStatus || 'inactive';
    const monthlyCommission = Math.round((record.planAmount || PREMIUM_MONTHLY_PRICE) * (record.commissionRate || COMMISSION_RATE));
    const activationTime = record.activationDate ? new Date(record.activationDate).getTime() : null;

    const releaseLockedAmount = () => {
      if (record.lockedAmount) {
        user.referralEarnings.lockedAmount = Math.max(0, (user.referralEarnings.lockedAmount || 0) - record.lockedAmount);
        lockedAmount = Math.max(0, lockedAmount - record.lockedAmount);
        record.lockedAmount = 0;
        dirty = true;
      }
    };

    if (!record.referralId) {
      record.referralId = generateReferralId();
      dirty = true;
    }

    if (linkedUser && !record.referredName) {
      record.referredName = linkedUser.name;
      dirty = true;
    }

    if (linkedUser && !record.referredEmail) {
      record.referredEmail = linkedUser.email;
      dirty = true;
    }

    if (record.status === 'pending_activation') {
      pendingActivation += 1;
      if (activationTime && activationTime <= now) {
        record.status = 'active';
        record.earningsStartDate = record.earningsStartDate || record.activationDate || new Date(activationTime);
        record.lastStatusChange = new Date(now);
        releaseLockedAmount();
        dirty = true;
        pendingActivation -= 1;
      }
    }

    const isPremiumActive = linkedPlan === 'premium' && subscriptionStatus !== 'cancelled';
    if (record.status === 'active' && !isPremiumActive) {
      record.status = 'cancelled';
      record.lastStatusChange = new Date(now);
      releaseLockedAmount();
      dirty = true;
    }

    if (record.status === 'active' && isPremiumActive) {
      activePremiumReferrals += 1;
      monthlyEarnings += monthlyCommission;
    }

    const startDate = record.earningsStartDate ? new Date(record.earningsStartDate).getTime() : null;
    if (record.status === 'active' && startDate && startDate <= now) {
      const monthsElapsed = Math.floor((now - startDate) / MONTH_IN_MS);
      const computed = Math.max(0, monthsElapsed) * monthlyCommission;
      if (record.accruedAmount !== computed) {
        record.accruedAmount = computed;
        dirty = true;
      }
    }

    const accruedAmount = record.accruedAmount || 0;
    totalEarned += accruedAmount;
    totalPaidOut += record.totalPaidOut || 0;

    return {
      referralId: record.referralId,
      referredUserId: linkedUser?._id || record.referredUser || null,
      referredName: record.referredName || linkedUser?.name || '—',
      referredEmail: record.referredEmail || linkedUser?.email || null,
      plan: linkedPlan,
      commissionPercent: Math.round((record.commissionRate || COMMISSION_RATE) * 100),
      monthlyCommissionValue: monthlyCommission,
      status: record.status,
      activationDate: record.activationDate,
      earningsStartDate: record.earningsStartDate,
      lastPayoutDate: record.lastPayoutDate,
      totalEarned: accruedAmount,
      totalPaidOut: record.totalPaidOut || 0,
      pendingAmount: Math.max(0, accruedAmount - (record.totalPaidOut || 0) - (record.lockedAmount || 0)),
      createdAt: record.createdAt
    };
  });

  const withdrawableBalance = Math.max(0, totalEarned - totalPaidOut - lockedAmount);
  const payoutRequests = normalizePayoutRequests(user.referralEarnings.payoutRequests);

  if (dirty) {
    user.markModified('referralEarnings');
    await user.save();
  }

  return {
    summary: {
      totalEarned,
      totalPaidOut,
      withdrawableBalance,
      lockedAmount,
      monthlyEarnings,
      activePremiumReferrals,
      pendingActivation,
      commissionPercent: COMMISSION_PERCENT,
      perReferralCommission: Math.round(PREMIUM_MONTHLY_PRICE * COMMISSION_RATE),
      minimumPayout: MIN_PAYOUT_AMOUNT,
      currency: 'NGN'
    },
    records,
    payoutRequests
  };
};

// @desc    Get user's referral stats and code
// @route   GET /api/referrals/stats
// @access  Private
exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode referralStats plan planExpiry referralEarnings');

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

    const earnings = await buildEarningsSnapshot(user);

    const responseData = {
      referralCode: user.referralCode,
      referralLink: `${clientUrl}/register?ref=${user.referralCode}`,
      stats: user.referralStats,
      currentPlan: user.plan,
      planExpiry: user.planExpiry,
      referredUsers,
      earnings
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

    if (newUser._id.toString() === referrer._id.toString()) {
      console.log('⚠️ Attempted self-referral');
      return res.status(400).json({ message: 'You cannot use your own referral code' });
    }

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
    if (!referrer.referralStats) {
      referrer.referralStats = {
        totalReferrals: 0,
        freeReferred: 0,
        proReferred: 0,
        premiumReferred: 0,
        rewardsEarned: 0,
        rewardsUsed: 0
      };
    }

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

// @desc    Submit referral earnings payout request
// @route   POST /api/referrals/payout-request
// @access  Private
exports.requestPayout = async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    const notes = req.body.notes;

    if (!amount || Number.isNaN(amount)) {
      return res.status(400).json({ message: 'Valid payout amount is required' });
    }

    if (amount < MIN_PAYOUT_AMOUNT) {
      return res.status(400).json({ message: `Minimum payout request is ₦${MIN_PAYOUT_AMOUNT.toLocaleString()}` });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    ensureReferralEarningsStructure(user);

    const hasPendingRequest = (user.referralEarnings.payoutRequests || []).some((request) => request.status === 'pending' || request.status === 'processing');

    if (hasPendingRequest) {
      return res.status(400).json({ message: 'You already have a payout request in progress' });
    }

    const snapshot = await buildEarningsSnapshot(user);

    if (amount > snapshot.summary.withdrawableBalance) {
      return res.status(400).json({ message: 'Requested amount exceeds available balance' });
    }

    user.referralEarnings.lockedAmount = (user.referralEarnings.lockedAmount || 0) + amount;

    const payoutRequest = {
      requestId: generatePayoutId(),
      amount,
      status: 'pending',
      requestedAt: new Date(),
      estimatedPayoutDate: new Date(Date.now() + (14 * DAY_IN_MS)),
      notes: notes || 'Manual payout request via dashboard'
    };

    user.referralEarnings.payoutRequests.push(payoutRequest);
    user.markModified('referralEarnings');
    await user.save();

    const refreshedUser = await User.findById(req.user.id).select('referralEarnings');
    const earnings = await buildEarningsSnapshot(refreshedUser);

    res.json({
      message: 'Payout request submitted successfully',
      payoutRequest,
      earnings
    });
  } catch (error) {
    console.error('Request payout error:', error);
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

    if (!referrer.referralStats) {
      referrer.referralStats = {
        totalReferrals: 0,
        freeReferred: 0,
        proReferred: 0,
        premiumReferred: 0,
        rewardsEarned: 0,
        rewardsUsed: 0
      };
    }

    ensureReferralEarningsStructure(referrer);

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

      const monthlyCommission = Math.round(PREMIUM_MONTHLY_PRICE * COMMISSION_RATE);
      const activationDate = new Date(Date.now() + (ACTIVATION_HOLD_DAYS * DAY_IN_MS));
      const existingRecord = referrer.referralEarnings.records.find((record) => {
        if (!record.referredUser) return false;
        const recordUserId = record.referredUser._id ? record.referredUser._id.toString() : record.referredUser.toString();
        return recordUserId === user._id.toString();
      });

      if (existingRecord) {
        const currentLocked = existingRecord.lockedAmount || 0;
        if (monthlyCommission > currentLocked) {
          referrer.referralEarnings.lockedAmount = (referrer.referralEarnings.lockedAmount || 0) + (monthlyCommission - currentLocked);
        }
        existingRecord.lockedAmount = monthlyCommission;
        existingRecord.status = 'pending_activation';
        existingRecord.activationDate = activationDate;
        existingRecord.earningsStartDate = null;
        existingRecord.lastStatusChange = new Date();
        existingRecord.referralCodeUsed = referrer.referralCode || existingRecord.referralCodeUsed || null;
      } else {
        referrer.referralEarnings.records.push({
          referralId: generateReferralId(),
          referredUser: user._id,
          referredEmail: user.email,
          referredName: user.name,
          plan: 'premium',
          planAmount: PREMIUM_MONTHLY_PRICE,
          commissionRate: COMMISSION_RATE,
          status: 'pending_activation',
          activationDate,
          earningsStartDate: null,
          lastStatusChange: new Date(),
          accruedAmount: 0,
          totalPaidOut: 0,
          lockedAmount: monthlyCommission,
          referralCodeUsed: referrer.referralCode || null
        });
        referrer.referralEarnings.lockedAmount = (referrer.referralEarnings.lockedAmount || 0) + monthlyCommission;
      }

      referrer.markModified('referralEarnings');
    }

    await referrer.save();
    console.log('💾 Referrer stats updated:', referrer.referralStats);
  } catch (error) {
    console.error('Notify referrer error:', error);
  }
};
