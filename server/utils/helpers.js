const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

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
      shop: user.shop
    }
  });
};

// Async handler to wrap async route handlers
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Format validation errors
exports.formatValidationErrors = (errors) => {
  return errors.array().map(error => ({
    field: error.param,
    message: error.msg
  }));
};

// Calculate plan expiry date
exports.calculatePlanExpiry = (months = 1) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

// Generate unique slug from string
exports.generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

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

// Validate Nigerian phone number
exports.isValidNigerianPhone = (phone) => {
  // Accepts formats like: +2348012345678, 2348012345678, 08012345678
  const regex = /^(\+?234|0)?[789]\d{9}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// Format phone number for WhatsApp
exports.formatWhatsAppNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

// Normalize phone number for uniqueness check (strips all non-digits, ensures country code)
exports.normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
    // If exactly 10 digits without country code, assume Nigerian
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

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
