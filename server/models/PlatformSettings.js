const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'WaZhop'
  },
  siteDescription: {
    type: String,
    default: 'Build and manage your online shop with ease'
  },
  contactEmail: {
    type: String,
    default: 'admin@wazhop.ng'
  },
  supportEmail: {
    type: String,
    default: 'support@wazhop.ng'
  },

  // Payment Gateway Settings
  paymentGateways: {
    paystack: {
      enabled: {
        type: Boolean,
        default: false
      },
      publicKey: {
        type: String,
        default: '',
        select: false
      },
      secretKey: {
        type: String,
        default: '',
        select: false
      }
    },
    flutterwave: {
      enabled: {
        type: Boolean,
        default: false
      },
      publicKey: {
        type: String,
        default: '',
        select: false
      },
      secretKey: {
        type: String,
        default: '',
        select: false
      }
    }
  },

  // Email Configuration
  emailConfig: {
    provider: {
      type: String,
      enum: ['brevo', 'smtp'],
      default: 'brevo'
    },
    brevo: {
      apiKey: {
        type: String,
        default: '',
        select: false
      }
    },
    smtp: {
      host: {
        type: String,
        default: ''
      },
      port: {
        type: Number,
        default: 587
      },
      user: {
        type: String,
        default: ''
      },
      password: {
        type: String,
        default: '',
        select: false
      }
    }
  },

  // Storage Configuration
  storageConfig: {
    provider: {
      type: String,
      enum: ['cloudinary', 'aws'],
      default: 'cloudinary'
    },
    cloudinary: {
      cloudName: {
        type: String,
        default: ''
      },
      apiKey: {
        type: String,
        default: '',
        select: false
      },
      apiSecret: {
        type: String,
        default: '',
        select: false
      }
    }
  },

  // Security Settings
  security: {
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    sessionTimeout: {
      type: Number,
      default: 24
    }
  },

  // Feature Flags
  features: {
    enableMarketplace: {
      type: Boolean,
      default: true
    },
    enableReviews: {
      type: Boolean,
      default: true
    },
    enableReferrals: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne().select('+paymentGateways.paystack.secretKey +paymentGateways.flutterwave.secretKey +emailConfig.brevo.apiKey +emailConfig.smtp.password +storageConfig.cloudinary.apiKey +storageConfig.cloudinary.apiSecret');
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to safely get public settings (without secrets)
platformSettingsSchema.methods.getPublicSettings = function () {
  return {
    siteName: this.siteName,
    siteDescription: this.siteDescription,
    contactEmail: this.contactEmail,
    supportEmail: this.supportEmail,
    paymentGateways: {
      paystack: {
        enabled: this.paymentGateways.paystack.enabled
      },
      flutterwave: {
        enabled: this.paymentGateways.flutterwave.enabled
      }
    },
    emailConfig: {
      provider: this.emailConfig.provider
    },
    storageConfig: {
      provider: this.storageConfig.provider
    },
    security: this.security,
    features: this.features
  };
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
