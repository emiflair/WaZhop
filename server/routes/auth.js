const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  upgradeToSeller,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Validation rules
const registerValidation = [
  body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // WhatsApp required only for sellers
  body('whatsapp')
    .if((value, { req }) => (req.body.role || 'buyer') === 'seller')
    .notEmpty().withMessage('WhatsApp number is required for sellers')
    .bail()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid WhatsApp number with country code')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', [ body('email').isEmail().withMessage('Please provide a valid email') ], forgotPassword);
router.post('/reset-password', [ 
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/upgrade-to-seller', protect, upgradeToSeller);

module.exports = router;
