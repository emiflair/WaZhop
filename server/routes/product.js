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

// Public routes
router.get('/marketplace', getMarketplaceProducts);

// Protected routes - place specific routes before dynamic :id routes
router.get('/my/products', protect, requireRole('seller'), getMyProducts);

// Dynamic routes (must come after specific routes)
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts);
router.post('/:id/click', trackProductClick);
router.post('/', protect, requireRole('seller'), checkPlanLimit('products'), imageUploadRateLimiter, upload.array('images', 5), limitConcurrentUploads, validateImage, moderateProductContent, createProduct);
router.put('/:id', protect, requireRole('seller'), moderateProductContent, updateProduct);
router.put('/:id/boost', protect, requireRole('seller'), boostProduct);
router.get('/:id/boost', protect, requireRole('seller'), getBoostStatus);
router.delete('/:id', protect, requireRole('seller'), deleteProduct);
router.post('/:id/images', protect, requireRole('seller'), imageUploadRateLimiter, upload.array('images', 5), limitConcurrentUploads, validateImage, uploadProductImages);
router.delete('/:id/images/:imageId', protect, requireRole('seller'), deleteProductImage);
router.put('/my/reorder', protect, requireRole('seller'), reorderProducts);

module.exports = router;
