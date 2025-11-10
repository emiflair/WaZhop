const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  requestEmailVerification,
  requestEmailVerificationPublic,
  verifyEmail,
  forgotPassword,
  resetPassword,
  requestSmsCode,
  verifySmsCode
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Invalid role'),
  // whatsapp required only if role=seller
  body('whatsapp')
    .if(body('role').equals('seller'))
    .notEmpty().withMessage('WhatsApp number is required for sellers')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/verify-email', verifyEmail);
router.post('/request-email-verification-public', requestEmailVerificationPublic);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/request-email-verification', protect, requestEmailVerification);
router.post('/request-sms-code', protect, requestSmsCode);
router.post('/verify-sms', protect, verifySmsCode);

module.exports = router;
