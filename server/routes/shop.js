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
const { protect, requireRole } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const { moderateText } = require('../middlewares/contentModeration');
const {
  checkShopLimit,
  checkStorageAccess,
  checkCustomDomainAccess,
  checkThemeCustomizationAccess,
  checkPremiumTemplateAccess
} = require('../middlewares/planLimits');

// Protected routes (must come before dynamic routes)
router.get('/my/shop', protect, requireRole('seller'), getMyShop);
router.get('/my/shops', protect, requireRole('seller'), getMyShops);
router.post('/', protect, requireRole('seller'), checkShopLimit, moderateText, createShop);
router.delete('/:id', protect, requireRole('seller'), deleteShop);
router.get('/themes', protect, requireRole('seller'), getAvailableThemes);
router.put('/my/shop', protect, requireRole('seller'), moderateText, updateShop);
router.put('/my/theme', protect, requireRole('seller'), checkThemeCustomizationAccess, updateTheme);
router.post('/my/logo', protect, requireRole('seller'), checkStorageAccess, upload.single('logo'), uploadLogo);
router.post('/my/banner', protect, requireRole('seller'), checkStorageAccess, upload.single('banner'), uploadBanner);
router.delete('/my/image/:type', protect, requireRole('seller'), deleteImage);

// Domain and subdomain routes
router.put('/my/domain', protect, requireRole('seller'), checkCustomDomainAccess, setCustomDomain);
router.post('/my/domain/verify', protect, requireRole('seller'), checkCustomDomainAccess, verifyCustomDomain);
router.delete('/my/domain', protect, requireRole('seller'), removeCustomDomain);
router.put('/my/subdomain', protect, requireRole('seller'), setSubdomain);

// Public routes (dynamic routes must come last)
router.get('/:slug', getShopBySlug);

module.exports = router;
