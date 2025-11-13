const express = require('express');

const router = express.Router();
const {
  getReferralStats,
  applyReferralCode,
  validateReferralCode,
  claimRewards
} = require('../controllers/referralController');
const { protect } = require('../middlewares/auth');
const User = require('../models/User');

// Debug endpoint to check referral relationships
router.get('/debug/users', protect, async (req, res) => {
  try {
    const users = await User.find({})
      .select('email name plan referredBy referralCode referralStats createdAt')
      .populate('referredBy', 'name email referralCode');

    const summary = {
      totalUsers: users.length,
      usersWithReferralCode: users.filter((u) => u.referralCode).length,
      usersWithReferrer: users.filter((u) => u.referredBy).length,
      users: users.map((u) => ({
        email: u.email,
        name: u.name,
        plan: u.plan,
        referralCode: u.referralCode,
        referredBy: u.referredBy ? {
          name: u.referredBy.name,
          email: u.referredBy.email,
          code: u.referredBy.referralCode
        } : null,
        stats: u.referralStats
      }))
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public routes
router.get('/validate/:code', validateReferralCode);
router.post('/apply', applyReferralCode);

// Protected routes
router.get('/stats', protect, getReferralStats);
router.post('/claim', protect, claimRewards);

module.exports = router;
