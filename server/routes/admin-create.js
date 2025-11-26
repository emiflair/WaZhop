const express = require('express');
const router = express.Router();
const {
  createTemporaryStore,
  addProductToTempStore,
  getTemporaryStores,
  deleteTemporaryStore
} = require('../controllers/adminCreateController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Create temporary store
router.post('/create-store', createTemporaryStore);

// Get all temporary stores
router.get('/create-store/temporary', getTemporaryStores);

// Add product to temporary store
router.post('/create-store/:shopId/products', addProductToTempStore);

// Delete temporary store
router.delete('/create-store/:shopId', deleteTemporaryStore);

module.exports = router;
