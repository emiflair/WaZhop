const express = require('express');
const router = express.Router();
const {
  getMyShop,
  getMyShops,
  createShop,
  deleteShop,
  getShopBySlug,
  updateShop,
  updateTheme,
  uploadLogo,
  uploadBanner,
  deleteImage,
  getAvailableThemes,
  setCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
  setSubdomain
} = require('../controllers/shopController');
const { protect } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// Protected routes (must come before dynamic routes)
router.get('/my/shop', protect, getMyShop);
router.get('/my/shops', protect, getMyShops);
router.post('/', protect, createShop);
router.delete('/:id', protect, deleteShop);
router.get('/themes', protect, getAvailableThemes);
router.put('/my/shop', protect, updateShop);
router.put('/my/theme', protect, updateTheme);
router.post('/my/logo', protect, upload.single('logo'), uploadLogo);
router.post('/my/banner', protect, upload.single('banner'), uploadBanner);
router.delete('/my/image/:type', protect, deleteImage);

// Domain and subdomain routes
router.put('/my/domain', protect, setCustomDomain);
router.post('/my/domain/verify', protect, verifyCustomDomain);
router.delete('/my/domain', protect, removeCustomDomain);
router.put('/my/subdomain', protect, setSubdomain);

// Public routes (dynamic routes must come last)
router.get('/:slug', getShopBySlug);

module.exports = router;
