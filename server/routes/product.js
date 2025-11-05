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
const { protect, checkPlanLimit } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/marketplace', getMarketplaceProducts);
router.get('/:id', getProduct);
router.post('/:id/click', trackProductClick);

// Protected routes
router.get('/my/products', protect, getMyProducts);
router.post('/', protect, checkPlanLimit('products'), upload.array('images', 5), createProduct);
router.put('/:id', protect, updateProduct);
router.put('/:id/boost', protect, boostProduct);
router.get('/:id/boost', protect, getBoostStatus);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/images', protect, upload.array('images', 5), uploadProductImages);
router.delete('/:id/images/:imageId', protect, deleteProductImage);
router.put('/my/reorder', protect, reorderProducts);

module.exports = router;
