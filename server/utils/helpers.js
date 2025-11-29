const jwt = require('jsonwebtoken');

const AFRICAN_DIAL_CODES = [
  '290', // Saint Helena & Ascension
  '291', // Eritrea
  '27', // South Africa
  '20', // Egypt
  '211', '212', '213', '216', '218', // Northern Africa
  '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '230', '231', '232', '233', '234', '235', '236', '237', '238', '239',
  '240', '241', '242', '243', '244', '245', '246', '247', '248', '249',
  '250', '251', '252', '253', '254', '255', '256', '257', '258',
  '260', '261', '262', '263', '264', '265', '266', '267', '268', '269'
];

const SORTED_AFRICAN_DIAL_CODES = [...AFRICAN_DIAL_CODES].sort((a, b) => b.length - a.length);

const sanitizePhoneInput = (value = '') => value.replace(/[^+\d]/g, '');

const normalizeAfricanPhoneNumber = (phone) => {
  if (!phone) return null;

  let cleaned = sanitizePhoneInput(phone);

  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Backwards compatibility: support legacy local formats that began with 0 or had 10 digits (assume NG)
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = `234${cleaned.substring(1)}`;
  } else if (cleaned.length === 10) {
    cleaned = `234${cleaned}`;
  }

  if (!/^\d{6,14}$/.test(cleaned)) {
    return null;
  }

  const dialCode = SORTED_AFRICAN_DIAL_CODES.find((code) => cleaned.startsWith(code));

  if (!dialCode) {
    return null;
  }

  return `+${cleaned}`;
};

// Generate JWT token
exports.generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '30d'
});

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = this.generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp,
      plan: user.plan,
      planExpiry: user.planExpiry,
      isAdmin: user.isAdmin,
      shop: user.shop,
      twoFactorEnabled: user.twoFactorEnabled || false
    }
  });
};

// Async handler to wrap async route handlers
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Format validation errors
exports.formatValidationErrors = (errors) => errors.array().map((error) => ({
  field: error.param,
  message: error.msg
}));

// Calculate plan expiry date
exports.calculatePlanExpiry = (months = 1) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

// Generate unique slug from string
exports.generateSlug = (text) => text
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '') // Remove special characters
  .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
  .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
;

// Format price in Naira
exports.formatPrice = (price, currency = 'NGN') => {
  const symbols = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€'
  };
  return `${symbols[currency] || '₦'}${price.toLocaleString()}`;
};

exports.isValidAfricanPhone = (phone) => !!normalizeAfricanPhoneNumber(phone);

// Backwards compatible alias for legacy imports
exports.isValidNigerianPhone = (phone) => exports.isValidAfricanPhone(phone);

// Format phone number for WhatsApp (stores in E.164 format, e.g. +233201234567)
exports.formatWhatsAppNumber = (phone) => normalizeAfricanPhoneNumber(phone);

// Normalize phone number for uniqueness checks (E.164 format)
exports.normalizePhoneNumber = (phone) => normalizeAfricanPhoneNumber(phone);

exports.normalizeAfricanPhoneNumber = normalizeAfricanPhoneNumber;
exports.AFRICAN_DIAL_CODES = AFRICAN_DIAL_CODES;

// Paginate results
exports.paginate = (page = 1, limit = 20) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return {
    skip,
    limit: parseInt(limit)
  };
};

// Build pagination metadata
exports.paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};
