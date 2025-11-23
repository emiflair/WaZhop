const express = require('express');

const router = express.Router();
const {
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  reorderProducts,
  trackProductClick,
  getMarketplaceProducts,
  boostProduct,
  getBoostStatus,
  getRelatedProducts
} = require('../controllers/productController');
const { protect, checkPlanLimit, requireRole } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const { moderateProductContent } = require('../middlewares/contentModeration');
const {
  validateImage,
  imageUploadRateLimiter,
  limitConcurrentUploads
} = require('../middlewares/imageOptimization');
const { checkSubscriptionExpiry } = require('../middlewares/subscription');

// Public routes
router.get('/marketplace', getMarketplaceProducts);

// Protected routes - place specific routes before dynamic :id routes
router.get('/my/products', protect, checkSubscriptionExpiry, requireRole('seller'), getMyProducts);

// Dynamic routes (must come after specific routes)
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts);
router.post('/:id/click', trackProductClick);
router.post('/', protect, checkSubscriptionExpiry, requireRole('seller'), checkPlanLimit('products'), imageUploadRateLimiter, upload.array('images', 5), limitConcurrentUploads, validateImage, moderateProductContent, createProduct);
router.put('/:id', protect, checkSubscriptionExpiry, requireRole('seller'), moderateProductContent, updateProduct);
router.put('/:id/boost', protect, checkSubscriptionExpiry, requireRole('seller'), boostProduct);
router.get('/:id/boost', protect, checkSubscriptionExpiry, requireRole('seller'), getBoostStatus);
router.delete('/:id', protect, checkSubscriptionExpiry, requireRole('seller'), deleteProduct);
router.post('/:id/images', protect, checkSubscriptionExpiry, requireRole('seller'), imageUploadRateLimiter, upload.array('images', 5), limitConcurrentUploads, validateImage, uploadProductImages);
router.delete('/:id/images/:imageId', protect, checkSubscriptionExpiry, requireRole('seller'), deleteProductImage);
router.put('/my/reorder', protect, checkSubscriptionExpiry, requireRole('seller'), reorderProducts);

module.exports = router;
