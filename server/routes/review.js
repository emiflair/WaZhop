const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getMyShopReviews,
  approveReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

// Public routes
router.get('/product/:productId', getProductReviews);
router.post('/', createReview);
router.post('/:id/helpful', markHelpful);

// Protected routes (shop owner)
router.get('/shop/my', protect, getMyShopReviews);
router.put('/:id/approve', protect, approveReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
