const express = require('express');

const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  upgradeToSeller,
  changePassword,
  requestEmailVerification,
  requestEmailVerificationPublic,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestSmsCode,
  verifySmsCode
} = require('../controllers/authController');
const { protect, protectAllowUnverified } = require('../middlewares/auth');
const {
  validateRegister,
  validateLogin,
  validatePasswordReset
} = require('../middlewares/validation');
const { authRateLimiter, strictRateLimiter } = require('../middlewares/security');
const {
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus
} = require('../middlewares/twoFactor');

// Public routes with rate limiting
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);
router.get('/verify-email', verifyEmail);
router.post('/request-email-verification-public', authRateLimiter, requestEmailVerificationPublic);
router.post('/forgot-password', strictRateLimiter, forgotPassword);
router.post('/reset-password', strictRateLimiter, validatePasswordReset, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/upgrade-to-seller', protect, upgradeToSeller);
router.put('/change-password', protect, changePassword);
router.post('/request-email-verification', protectAllowUnverified, requestEmailVerification);
router.post('/request-sms-code', protect, requestSmsCode);
router.post('/verify-sms', protect, verifySmsCode);

// 2FA routes (protected)
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/status', protect, get2FAStatus);

module.exports = router;
