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
  trackProductClick
} = require('../controllers/productController');
const { protect, checkPlanLimit } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// Protected routes
router.get('/my/products', protect, getMyProducts);
router.post('/', protect, checkPlanLimit('products'), upload.array('images', 5), createProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/images', protect, upload.array('images', 5), uploadProductImages);
router.delete('/:id/images/:imageId', protect, deleteProductImage);
router.put('/my/reorder', protect, reorderProducts);
router.post('/:id/click', trackProductClick);

module.exports = router;
