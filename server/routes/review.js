const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { moderateText } = require('../middlewares/contentModeration');
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
// Allow a single optional image on review via multipart form
router.post('/', upload.single('image'), moderateText, createReview);
router.post('/:id/helpful', markHelpful);

// Protected routes (shop owner)
router.get('/shop/my', protect, getMyShopReviews);
router.put('/:id/approve', protect, approveReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
