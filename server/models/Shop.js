const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Changed from unique to index to allow multiple shops
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    minlength: [2, 'Shop name must be at least 2 characters'],
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  category: {
    type: String,
    enum: ['fashion', 'electronics', 'food', 'beauty', 'home', 'services', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  theme: {
    name: {
      type: String,
      default: 'Clean White'
    },
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#FFFFFF',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    },
    accentColor: {
      type: String,
      default: '#000000',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    },
    backgroundColor: {
      type: String,
      default: '#F9FAFB',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    },
    textColor: {
      type: String,
      default: '#111827',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color code']
    },
    layout: {
      type: String,
      enum: ['grid', 'list', 'minimal', 'masonry'],
      default: 'grid'
    },
    font: {
      type: String,
      enum: ['inter', 'roboto', 'poppins', 'montserrat'],
      default: 'inter'
    },
    hasGradient: {
      type: Boolean,
      default: false
    },
    gradient: {
      type: String,
      default: null
    },
    buttonStyle: {
      type: String,
      enum: ['rounded', 'rounded-full', 'square'],
      default: 'rounded'
    },
    cardStyle: {
      type: String,
      enum: ['shadow', 'border', 'elevated'],
      default: 'shadow'
    },
    animations: {
      type: Boolean,
      default: false
    },
    customCSS: {
      type: String,
      default: null
    }
  },
  logo: {
    url: String,
    publicId: String
  },
  banner: {
    url: String,
    publicId: String
  },
  profileImage: {
    url: String,
    publicId: String
  },
  verifiedBadge: {
    type: Boolean,
    default: false // Premium plans only
  },
  // Template System
  template: {
    id: {
      type: String,
      default: 'classic-gradient',
      enum: ['classic-gradient', 'minimal-white', 'modern-dark', 'lifestyle-banner', 'luxury-motion']
    },
    customSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  // Enhanced Social Links
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String,
    tiktok: String,
    whatsapp: String,
    telegram: String,
    enabled: {
      type: [String],
      default: ['whatsapp']
    }
  },
  // WhatsApp Business Number (for inquiry links)
  whatsappNumber: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid international phone number']
  },
  // WhatsApp Business API Integration (Premium only)
  whatsappBusiness: {
    enabled: {
      type: Boolean,
      default: false
    },
    catalogId: {
      type: String,
      default: null
    },
    catalogSyncedAt: {
      type: Date,
      default: null
    },
    automatedMessages: {
      orderConfirmation: {
        type: Boolean,
        default: true
      },
      orderStatusUpdate: {
        type: Boolean,
        default: true
      },
      abandonedCart: {
        type: Boolean,
        default: false
      }
    }
  },
  showWatermark: {
    type: Boolean,
    default: true // Free plan shows watermark, Pro/Premium hides it
  },
  views: {
    type: Number,
    default: 0
  },
  // Custom domain for Premium plan
  customDomain: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/, 'Please provide a valid domain name']
  },
  domainVerified: {
    type: Boolean,
    default: false
  },
  domainVerificationToken: {
    type: String,
    default: null
  },
  // Payment Integration (Premium plan only)
  paymentSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['flutterwave', 'paystack', null],
      default: null
    },
    // For Flutterwave
    flutterwave: {
      publicKey: {
        type: String,
        default: null
      },
      // Store encrypted secret key or use payment link
      paymentLink: {
        type: String,
        default: null
      }
    },
    // For Paystack
    paystack: {
      publicKey: {
        type: String,
        default: null
      },
      // Store encrypted secret key or use payment link
      paymentLink: {
        type: String,
        default: null
      }
    },
    // Payment options
    allowWhatsAppNegotiation: {
      type: Boolean,
      default: true // Always allow WhatsApp as fallback
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'USD', 'GHS', 'KES', 'ZAR']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate products
shopSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'shop'
});

// Generate unique slug
shopSchema.statics.generateUniqueSlug = async function (baseSlug) {
  const slug = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  let counter = 1;
  let uniqueSlug = slug;

  while (await this.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

// Increment view count
shopSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// Indexes are already created via unique: true on slug and owner fields

module.exports = mongoose.model('Shop', shopSchema);
