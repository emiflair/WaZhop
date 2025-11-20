const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // Allow common valid characters like +._% in the local part and longer TLDs
    match: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  whatsapp: {
    type: String,
    // Required for sellers, optional for buyers
    required: false,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid WhatsApp number with country code']
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  // Verification flags
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  // Email verification token + expiry
  emailVerificationToken: {
    type: String,
    default: null,
    index: true
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  // SMS verification code + expiry
  phoneVerificationCode: {
    type: String,
    default: null
  },
  phoneVerificationExpires: {
    type: Date,
    default: null
  },
  // Password reset token + expiry
  passwordResetToken: {
    type: String,
    default: null,
    index: true
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  planExpiry: {
    type: Date,
    default: null
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  lastBillingDate: {
    type: Date,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  // Auto-renewal retry tracking
  renewalAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastRenewalAttempt: {
    type: Date,
    default: null
  },
  renewalFailureReason: {
    type: String,
    default: null
  },
  storageUsed: {
    type: Number,
    default: 0, // in bytes
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralStats: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    freeReferred: {
      type: Number,
      default: 0
    },
    proReferred: {
      type: Number,
      default: 0
    },
    premiumReferred: {
      type: Number,
      default: 0
    },
    rewardsEarned: {
      type: Number,
      default: 0 // In days of free premium
    },
    rewardsUsed: {
      type: Number,
      default: 0
    }
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorTempSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  // Security logs
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code on first save
userSchema.pre('save', async function (next) {
  if (!this.referralCode && !this.isNew) {
    return next();
  }

  if (this.isNew && !this.referralCode) {
    // Generate unique 8-character code
    const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

    let code = generateCode();
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 5) {
      const existing = await mongoose.model('User').findOne({ referralCode: code });
      if (!existing) {
        this.referralCode = code;
        break;
      }
      code = generateCode();
      attempts++;
    }

    if (!this.referralCode) {
      this.referralCode = `${generateCode()}${Date.now().toString(36).slice(-4)}`;
    }
  }

  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get plan limits
userSchema.methods.getPlanLimits = function () {
  const limits = {
    free: {
      products: 10,
      themes: 1,
      maxShops: 1,
      storage: 0, // No storage - images only
      analytics: false,
      customDomain: false,
      gradients: false,
      animations: false,
      customCSS: false,
      advancedFeatures: false,
      prioritySupport: false,
      inventoryManagement: false,
      features: [
        'Basic shop setup',
        '1 shop',
        'Up to 10 products',
        '1 default theme (white)',
        'Basic product management',
        'Standard support'
      ]
    },
    pro: {
      products: 100,
      themes: 10,
      maxShops: 2,
      storage: 65 * 1024 * 1024 * 1024, // 65GB in bytes
      analytics: true,
      customDomain: false,
      gradients: true,
      animations: true,
      customCSS: false,
      advancedFeatures: true,
      prioritySupport: false,
      inventoryManagement: true,
      features: [
        'Everything in Free',
        '2 shops',
        'Up to 100 products per shop',
        '65GB storage',
        '10 professional preset themes',
        'Beautiful gradient themes',
        'Smooth animations',
        'Inventory management system',
        'Low stock alerts',
        'Automated stock tracking',
        'Advanced analytics dashboard',
        'Sales reports & insights',
        'Customer behavior tracking',
        'Multiple shop layouts',
        'Custom fonts',
        'Social media integration',
        'Email support'
      ]
    },
    premium: {
      products: Infinity,
      themes: Infinity,
      maxShops: 3,
      storage: 1024 * 1024 * 1024 * 1024, // 1TB in bytes
      analytics: true,
      customDomain: true,
      gradients: true,
      animations: true,
      customCSS: true,
      advancedFeatures: true,
      prioritySupport: true,
      inventoryManagement: true,
      features: [
        'Everything in Pro',
        '3 shops',
        'UNLIMITED products',
        '1TB storage',
        'UNLIMITED theme customization',
        'Custom color pickers',
        'Custom gradient builder',
        'Custom CSS & styling',
        'Custom domain (yourshop.com)',
        'Remove WaZhop branding',
        'Advanced inventory management',
        'Supplier management',
        'Batch inventory updates',
        'Video backgrounds',
        'Advanced animations',
        'SEO optimization tools',
        'Email marketing integration',
        'Multi-currency support',
        'Automated backups',
        'Priority 24/7 support',
        'Dedicated account manager',
        'Custom feature requests'
      ]
    }
  };
  return limits[this.plan];
};

// Check if plan is expired
userSchema.methods.isPlanExpired = function () {
  if (this.plan === 'free') return false;
  if (!this.planExpiry) return false;
  return new Date() > this.planExpiry;
};

// Cascade delete: Remove user's shops, products, reviews, and orders when user is deleted
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const Shop = mongoose.model('Shop');
    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');
    const Order = mongoose.model('Order');

    console.log(`🗑️  Cascade delete triggered for user: ${this.email}`);

    // Find all shops owned by this user
    const userShops = await Shop.find({ owner: this._id });
    const shopIds = userShops.map((shop) => shop._id);

    if (shopIds.length > 0) {
      // Delete all products in these shops
      const deletedProducts = await Product.deleteMany({ shop: { $in: shopIds } });
      console.log(`   ✅ Deleted ${deletedProducts.deletedCount} products`);

      // Delete all reviews for products in these shops
      const deletedReviews = await Review.deleteMany({ shop: { $in: shopIds } });
      console.log(`   ✅ Deleted ${deletedReviews.deletedCount} reviews`);

      // Delete all orders for these shops
      const deletedOrders = await Order.deleteMany({ shop: { $in: shopIds } });
      console.log(`   ✅ Deleted ${deletedOrders.deletedCount} orders`);

      // Delete all shops
      const deletedShops = await Shop.deleteMany({ owner: this._id });
      console.log(`   ✅ Deleted ${deletedShops.deletedCount} shops`);
    }

    console.log(`   ✅ User ${this.email} and all associated data deleted successfully`);
    next();
  } catch (error) {
    console.error('❌ Cascade delete error:', error);
    next(error);
  }
});

// Also handle findOneAndDelete and deleteMany
userSchema.pre('deleteMany', async function (next) {
  try {
    const users = await this.model.find(this.getFilter());

    for (const user of users) {
      const Shop = mongoose.model('Shop');
      const Product = mongoose.model('Product');
      const Review = mongoose.model('Review');
      const Order = mongoose.model('Order');

      console.log(`🗑️  Cascade delete for user: ${user.email}`);

      const userShops = await Shop.find({ owner: user._id });
      const shopIds = userShops.map((shop) => shop._id);

      if (shopIds.length > 0) {
        await Product.deleteMany({ shop: { $in: shopIds } });
        await Review.deleteMany({ shop: { $in: shopIds } });
        await Order.deleteMany({ shop: { $in: shopIds } });
        await Shop.deleteMany({ owner: user._id });
        console.log(`   ✅ Deleted all data for ${user.email}`);
      }
    }

    next();
  } catch (error) {
    console.error('❌ Cascade deleteMany error:', error);
    next(error);
  }
});

// Performance indexes for faster queries
userSchema.index({ email: 1 }); // Already unique, explicit for clarity
userSchema.index({ role: 1, emailVerified: 1 }); // Admin/seller queries
userSchema.index({ emailVerificationToken: 1 }, { sparse: true }); // Verification lookups
userSchema.index({ passwordResetToken: 1 }, { sparse: true }); // Password reset lookups
userSchema.index({ referralCode: 1 }, { sparse: true }); // Referral code lookups

// Enforce unique phone for users who provided whatsapp (sparse/partial)
// Note: existing duplicates will cause index creation to fail; handle via migration if needed.
userSchema.index(
  { whatsapp: 1 },
  { unique: true, sparse: true, partialFilterExpression: { whatsapp: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);
