const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // For percentage, max is 100%
  },
  applicablePlans: {
    type: [String],
    enum: ['pro', 'premium'],
    default: ['pro', 'premium']
  },
  maxUses: {
    type: Number,
    default: null // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null // null = never expires
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    plan: String,
    originalAmount: Number,
    discountAmount: Number,
    finalAmount: Number
  }],
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Check if coupon is valid
couponSchema.methods.isValid = function () {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };

  const now = new Date();
  if (this.validFrom && this.validFrom > now) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }

  if (this.validUntil && this.validUntil < now) {
    return { valid: false, message: 'Coupon has expired' };
  }

  if (this.maxUses && this.usedCount >= this.maxUses) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function (originalAmount) {
  if (this.discountType === 'percentage') {
    const discountAmount = (originalAmount * this.discountValue) / 100;
    return {
      originalAmount,
      discountAmount,
      finalAmount: originalAmount - discountAmount,
      discountPercentage: this.discountValue
    };
  }
  // Fixed amount discount
  const discountAmount = Math.min(this.discountValue, originalAmount);
  return {
    originalAmount,
    discountAmount,
    finalAmount: originalAmount - discountAmount,
    discountPercentage: ((discountAmount / originalAmount) * 100).toFixed(2)
  };
};

// Generate unique coupon code
couponSchema.statics.generateCode = function (prefix = 'WAZHOP') {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};

module.exports = mongoose.model('Coupon', couponSchema);
