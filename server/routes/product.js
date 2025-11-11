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
  getBoostStatus
} = require('../controllers/productController');
const { protect, checkPlanLimit, requireRole } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const { moderateProductContent } = require('../middlewares/contentModeration');

// Public routes
router.get('/marketplace', getMarketplaceProducts);
router.get('/:id', getProduct);
router.post('/:id/click', trackProductClick);

// Protected routes
router.get('/my/products', protect, requireRole('seller'), getMyProducts);
router.post('/', protect, requireRole('seller'), checkPlanLimit('products'), upload.array('images', 5), moderateProductContent, createProduct);
router.put('/:id', protect, requireRole('seller'), moderateProductContent, updateProduct);
router.put('/:id/boost', protect, requireRole('seller'), boostProduct);
router.get('/:id/boost', protect, requireRole('seller'), getBoostStatus);
router.delete('/:id', protect, requireRole('seller'), deleteProduct);
router.post('/:id/images', protect, requireRole('seller'), upload.array('images', 5), uploadProductImages);
router.delete('/:id/images/:imageId', protect, requireRole('seller'), deleteProductImage);
router.put('/my/reorder', protect, requireRole('seller'), reorderProducts);

module.exports = router;
