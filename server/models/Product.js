const mongoose = require('mongoose');
const {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_COUNTRY_CODE,
  getCountryMeta,
  formatMoney,
  formatUsdApprox
} = require('../utils/currency');

const productSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
    default: null
  },
  currency: {
    type: String,
    enum: SUPPORTED_CURRENCIES,
    default: DEFAULT_CURRENCY
  },
  priceUSD: {
    type: Number,
    default: 0,
    min: [0, 'Converted USD price cannot be negative']
  },
  comparePriceUSD: {
    type: Number,
    default: null,
    min: [0, 'Converted USD compare price cannot be negative']
  },
  countryCode: {
    type: String,
    uppercase: true,
    default: DEFAULT_COUNTRY_CODE
  },
  countryName: {
    type: String,
    default: getCountryMeta(DEFAULT_COUNTRY_CODE).country
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'other'
  },
  subcategory: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Product-level location (distinct from temporary boost targeting)
  locationState: {
    type: String,
    trim: true,
    default: null
  },
  locationArea: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: null, // null means unlimited/not tracked
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  trackInventory: {
    type: Boolean,
    default: false // Only enabled for Pro/Premium users
  },
  lastRestockDate: {
    type: Date,
    default: null
  },
  sku: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values
  },
  variants: [{
    name: {
      type: String,
      required: true,
      trim: true // e.g., "Size", "Color"
    },
    options: [{
      value: String, // e.g., "Small", "Red"
      price: Number, // Additional price for this option
      stock: Number, // Stock for this specific variant
      sku: String
    }]
  }],
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm'],
      default: 'cm'
    }
  },
  clicks: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  position: {
    type: Number,
    default: 0
  },
  // Content Moderation
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved'
    },
    checkedAt: {
      type: Date,
      default: Date.now
    },
    rejectionReason: {
      type: String,
      default: null
    },
    severity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none'
    },
    flaggedCategories: [{
      type: String
    }],
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    overriddenAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Boosting subdocument
productSchema.add({
  boost: {
    active: { type: Boolean, default: false },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    durationHours: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }, // Amount paid in NGN
    state: { type: String, trim: true, default: null }, // e.g., 'Lagos'
    area: { type: String, trim: true, default: null }, // e.g., 'Victoria Island'
    country: { type: String, trim: true, default: 'NG' }
  }
});

// Get primary image
productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find((img) => img.isPrimary);
  return primary || this.images[0];
});

// Generate WhatsApp link
productSchema.methods.getWhatsAppLink = function (whatsappNumber) {
  const localPrice = formatMoney(this.price, this.currency);
  const approxUsd = formatUsdApprox(this.priceUSD);
  const message = encodeURIComponent(
    `Hello! I'm interested in your product: ${this.name}\nPrice: ${localPrice}${approxUsd ? ` ${approxUsd}` : ''}`
  );
  return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;
};

// Increment click count
productSchema.methods.incrementClicks = async function () {
  this.clicks += 1;
  await this.save();
};

// Increment view count
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// Indexes for better query performance
productSchema.index({ shop: 1, isActive: 1 });
productSchema.index({ shop: 1, position: 1 });
productSchema.index({ shop: 1, category: 1 });
productSchema.index({ shop: 1, category: 1, subcategory: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ 'boost.endAt': -1 });
productSchema.index({ locationState: 1, locationArea: 1 });
productSchema.index({ currency: 1 });
productSchema.index({ countryCode: 1 });

module.exports = mongoose.model('Product', productSchema);
