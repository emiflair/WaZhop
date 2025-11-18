const {
  body, param, query, validationResult
} = require('express-validator');
const { isValidNigerianPhone } = require('../utils/helpers');

// Validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
exports.validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),

  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('whatsapp')
    .optional()
    .custom((value) => {
      if (typeof value !== 'string') return false;
      const trimmed = value.trim();
      // Accept standard E.164 (+2348012345678) OR common NG local formats (08012345678 / 8012345678)
      const e164 = /^\+?[1-9]\d{1,14}$/;
      return e164.test(trimmed.replace(/\s/g, '')) || isValidNigerianPhone(trimmed);
    })
    .withMessage('Please provide a valid WhatsApp number (e.g., +2348012345678 or 8012345678)'),

  body('role')
    .optional()
    .isIn(['buyer', 'seller'])
    .withMessage('Role must be either buyer or seller'),

  exports.handleValidationErrors
];

exports.validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  exports.handleValidationErrors
];

exports.validateShop = [
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s'-]+$/)
    .withMessage('Shop name can only contain letters, numbers, spaces, hyphens, and apostrophes'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('category')
    .optional()
    .isIn(['fashion', 'electronics', 'food', 'beauty', 'home', 'services', 'other'])
    .withMessage('Invalid category'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('theme.primaryColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Primary color must be a valid hex color code'),

  body('theme.accentColor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Accent color must be a valid hex color code'),

  exports.handleValidationErrors
];

exports.validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('currency')
    .optional()
    .isIn(['NGN', 'USD', 'GHS', 'KES', 'ZAR'])
    .withMessage('Invalid currency'),

  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters'),

  exports.handleValidationErrors
];

exports.validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),

  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),

  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),

  body('customerEmail')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('customerPhone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),

  body('shippingAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Shipping address must be between 10 and 500 characters'),

  exports.handleValidationErrors
];

exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),

  exports.handleValidationErrors
];

exports.validateCoupon = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
   // Subdomain validation has been removed

  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),

  body('minOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),

  exports.handleValidationErrors
];

exports.validatePasswordReset = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  exports.handleValidationErrors
];

// Sanitize MongoDB ObjectId
exports.validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),

  exports.handleValidationErrors
];

// Validate pagination
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be between 1 and 10000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  exports.handleValidationErrors
];

// Validate search queries
exports.validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  exports.handleValidationErrors
];

// Domain/subdomain validation
exports.validateDomain = [
  body('customDomain')
    .optional()
    .matches(/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/)
    .withMessage('Please provide a valid domain name'),

  body('subdomain')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens')
    .isLength({ min: 3, max: 30 })
    .withMessage('Subdomain must be between 3 and 30 characters'),

  exports.handleValidationErrors
];

// Settings validation
exports.validateSettings = [
  body('platformName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Platform name must be between 2 and 50 characters'),

  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),

  body('supportPhone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid support phone number'),

  exports.handleValidationErrors
];
