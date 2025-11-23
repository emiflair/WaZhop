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
const {
  validateImage,
  imageUploadRateLimiter
} = require('../middlewares/imageOptimization');
const { checkSubscriptionExpiry } = require('../middlewares/subscription');

// Protected routes (must come before dynamic routes)
router.get('/my/shop', protect, checkSubscriptionExpiry, requireRole('seller'), getMyShop);
router.get('/my/shops', protect, checkSubscriptionExpiry, requireRole('seller'), getMyShops);
router.post('/', protect, checkSubscriptionExpiry, requireRole('seller'), checkShopLimit, moderateText, createShop);
router.delete('/:id', protect, checkSubscriptionExpiry, requireRole('seller'), deleteShop);
router.get('/themes', protect, checkSubscriptionExpiry, requireRole('seller'), getAvailableThemes);
router.put('/my/shop', protect, checkSubscriptionExpiry, requireRole('seller'), moderateText, updateShop);
router.put('/my/theme', protect, checkSubscriptionExpiry, requireRole('seller'), checkThemeCustomizationAccess, updateTheme);
router.post('/my/logo', protect, checkSubscriptionExpiry, requireRole('seller'), checkStorageAccess, imageUploadRateLimiter, upload.single('logo'), validateImage, uploadLogo);
router.post('/my/banner', protect, checkSubscriptionExpiry, requireRole('seller'), checkStorageAccess, imageUploadRateLimiter, upload.single('banner'), validateImage, uploadBanner);
router.delete('/my/image/:type', protect, checkSubscriptionExpiry, requireRole('seller'), deleteImage);

// Custom domain routes
router.put('/my/domain', protect, checkSubscriptionExpiry, requireRole('seller'), checkCustomDomainAccess, setCustomDomain);
router.post('/my/domain/verify', protect, checkSubscriptionExpiry, requireRole('seller'), checkCustomDomainAccess, verifyCustomDomain);
router.delete('/my/domain', protect, checkSubscriptionExpiry, requireRole('seller'), removeCustomDomain);

// Public route (dynamic route must come last)
router.get('/:slug', getShopBySlug);

module.exports = router;
