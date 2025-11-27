const express = require('express');
const router = express.Router();
const {
  createTemporaryStore,
  addProductToTempStore,
  getTemporaryStores,
  deleteTemporaryStore
} = require('../controllers/adminCreateController');
const { protect, isAdmin } = require('../middlewares/auth');
const { uploadProductImages } = require('../middlewares/imageOptimization');

// Health check endpoint (no auth required for debugging)
router.get('/create-store/health', (req, res) => {
  res.json({ success: true, message: 'Admin Create Store routes loaded', timestamp: new Date() });
});

// All routes require admin authentication
router.use(protect);
router.use(isAdmin);

// Create temporary store
router.post('/create-store', createTemporaryStore);

// Get all temporary stores
router.get('/create-store/temporary', getTemporaryStores);

// Add product to temporary store (with image upload support)
router.post('/create-store/:shopId/products', uploadProductImages, addProductToTempStore);

// Delete temporary store
router.delete('/create-store/:shopId', deleteTemporaryStore);

module.exports = router;
