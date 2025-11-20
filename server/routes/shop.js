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
  removeCustomDomain
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
const { cacheMiddleware, CACHE_TTL } = require('../utils/cache');
const {
  validateImage,
  imageUploadRateLimiter
} = require('../middlewares/imageOptimization');

// Protected routes (must come before dynamic routes)
router.get('/my/shop', protect, requireRole('seller'), getMyShop);
router.get('/my/shops', protect, requireRole('seller'), cacheMiddleware('user-shops', CACHE_TTL.USER_SHOPS), getMyShops);
router.post('/', protect, requireRole('seller'), checkShopLimit, moderateText, createShop);
router.delete('/:id', protect, requireRole('seller'), deleteShop);
router.get('/themes', protect, requireRole('seller'), getAvailableThemes);
router.put('/my/shop', protect, requireRole('seller'), moderateText, updateShop);
router.put('/my/theme', protect, requireRole('seller'), checkThemeCustomizationAccess, updateTheme);
router.post('/my/logo', protect, requireRole('seller'), checkStorageAccess, imageUploadRateLimiter, upload.single('logo'), validateImage, uploadLogo);
router.post('/my/banner', protect, requireRole('seller'), checkStorageAccess, imageUploadRateLimiter, upload.single('banner'), validateImage, uploadBanner);
router.delete('/my/image/:type', protect, requireRole('seller'), deleteImage);

// Custom domain routes
router.put('/my/domain', protect, requireRole('seller'), checkCustomDomainAccess, setCustomDomain);
router.post('/my/domain/verify', protect, requireRole('seller'), checkCustomDomainAccess, verifyCustomDomain);
router.delete('/my/domain', protect, requireRole('seller'), removeCustomDomain);

// Public route (dynamic route must come last) - cached for performance
router.get('/:slug', cacheMiddleware('shop-page', CACHE_TTL.SHOP_PAGE), getShopBySlug);

module.exports = router;
