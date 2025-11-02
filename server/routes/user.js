const express = require('express');
const router = express.Router();
const {
  upgradePlan,
  downgradePlan,
  getSubscriptionInfo
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/auth');

// Protected routes
router.get('/subscription', protect, getSubscriptionInfo);
router.post('/upgrade', protect, upgradePlan);
router.post('/downgrade', protect, downgradePlan);

module.exports = router;
