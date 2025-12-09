const express = require('express');

const router = express.Router();
const {
  upgradePlan,
  downgradePlan,
  getSubscriptionInfo,
  getAllUsers,
  updateUserSubscription,
  switchToSeller,
  getFavorites,
  addFavorite,
  removeFavorite
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/auth');

// Protected routes
router.get('/subscription', protect, getSubscriptionInfo);
router.post('/upgrade', protect, upgradePlan);
router.post('/downgrade', protect, downgradePlan);
router.post('/switch-to-seller', protect, switchToSeller);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:productId', protect, addFavorite);
router.delete('/favorites/:productId', protect, removeFavorite);

// Admin routes
router.get('/admin/all', getAllUsers);
router.patch('/admin/:userId', updateUserSubscription);

module.exports = router;
