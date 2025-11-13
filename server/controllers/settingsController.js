const PlatformSettings = require('../models/PlatformSettings');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get platform settings
// @route   GET /api/settings/admin
// @access  Admin
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings();

  // Return settings with sensitive fields included for admin
  const settingsObj = settings.toObject();

  // Mask sensitive keys (show only last 4 characters)
  const maskKey = (key) => {
    if (!key || key.length < 8) return '••••••••';
    return `••••${key.slice(-4)}`;
  };

  res.status(200).json({
    success: true,
    data: {
      siteName: settingsObj.siteName,
      siteDescription: settingsObj.siteDescription,
      contactEmail: settingsObj.contactEmail,
      supportEmail: settingsObj.supportEmail,
      paymentGateways: {
        paystack: {
          enabled: settingsObj.paymentGateways.paystack.enabled,
          publicKey: settingsObj.paymentGateways.paystack.publicKey || '',
          secretKey: maskKey(settingsObj.paymentGateways.paystack.secretKey)
        },
        flutterwave: {
          enabled: settingsObj.paymentGateways.flutterwave.enabled,
          publicKey: settingsObj.paymentGateways.flutterwave.publicKey || '',
          secretKey: maskKey(settingsObj.paymentGateways.flutterwave.secretKey)
        }
      },
      emailConfig: {
        provider: settingsObj.emailConfig.provider,
        brevo: {
          apiKey: maskKey(settingsObj.emailConfig.brevo.apiKey)
        },
        smtp: {
          host: settingsObj.emailConfig.smtp.host || '',
          port: settingsObj.emailConfig.smtp.port || 587,
          user: settingsObj.emailConfig.smtp.user || '',
          password: maskKey(settingsObj.emailConfig.smtp.password)
        }
      },
      storageConfig: {
        provider: settingsObj.storageConfig.provider,
        cloudinary: {
          cloudName: settingsObj.storageConfig.cloudinary.cloudName || '',
          apiKey: maskKey(settingsObj.storageConfig.cloudinary.apiKey),
          apiSecret: maskKey(settingsObj.storageConfig.cloudinary.apiSecret)
        }
      },
      security: settingsObj.security,
      features: settingsObj.features
    }
  });
});

// @desc    Update platform settings
// @route   PUT /api/settings/admin
// @access  Admin
exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings();

  // Update general settings
  if (req.body.siteName !== undefined) settings.siteName = req.body.siteName;
  if (req.body.siteDescription !== undefined) settings.siteDescription = req.body.siteDescription;
  if (req.body.contactEmail !== undefined) settings.contactEmail = req.body.contactEmail;
  if (req.body.supportEmail !== undefined) settings.supportEmail = req.body.supportEmail;

  // Update payment gateways
  if (req.body.paystackEnabled !== undefined) {
    settings.paymentGateways.paystack.enabled = req.body.paystackEnabled;
  }
  if (req.body.paystackPublicKey !== undefined && req.body.paystackPublicKey !== '••••••••') {
    settings.paymentGateways.paystack.publicKey = req.body.paystackPublicKey;
  }
  if (req.body.paystackSecretKey !== undefined && !req.body.paystackSecretKey.includes('••••')) {
    settings.paymentGateways.paystack.secretKey = req.body.paystackSecretKey;
  }

  if (req.body.flutterwaveEnabled !== undefined) {
    settings.paymentGateways.flutterwave.enabled = req.body.flutterwaveEnabled;
  }
  if (req.body.flutterwavePublicKey !== undefined && req.body.flutterwavePublicKey !== '••••••••') {
    settings.paymentGateways.flutterwave.publicKey = req.body.flutterwavePublicKey;
  }
  if (req.body.flutterwaveSecretKey !== undefined && !req.body.flutterwaveSecretKey.includes('••••')) {
    settings.paymentGateways.flutterwave.secretKey = req.body.flutterwaveSecretKey;
  }

  // Update email config
  if (req.body.emailProvider !== undefined) {
    settings.emailConfig.provider = req.body.emailProvider;
  }
  if (req.body.brevoApiKey !== undefined && !req.body.brevoApiKey.includes('••••')) {
    settings.emailConfig.brevo.apiKey = req.body.brevoApiKey;
  }
  if (req.body.smtpHost !== undefined) {
    settings.emailConfig.smtp.host = req.body.smtpHost;
  }
  if (req.body.smtpPort !== undefined) {
    settings.emailConfig.smtp.port = req.body.smtpPort;
  }
  if (req.body.smtpUser !== undefined) {
    settings.emailConfig.smtp.user = req.body.smtpUser;
  }
  if (req.body.smtpPassword !== undefined && !req.body.smtpPassword.includes('••••')) {
    settings.emailConfig.smtp.password = req.body.smtpPassword;
  }

  // Update storage config
  if (req.body.storageProvider !== undefined) {
    settings.storageConfig.provider = req.body.storageProvider;
  }
  if (req.body.cloudinaryCloudName !== undefined) {
    settings.storageConfig.cloudinary.cloudName = req.body.cloudinaryCloudName;
  }
  if (req.body.cloudinaryApiKey !== undefined && !req.body.cloudinaryApiKey.includes('••••')) {
    settings.storageConfig.cloudinary.apiKey = req.body.cloudinaryApiKey;
  }
  if (req.body.cloudinaryApiSecret !== undefined && !req.body.cloudinaryApiSecret.includes('••••')) {
    settings.storageConfig.cloudinary.apiSecret = req.body.cloudinaryApiSecret;
  }

  // Update security settings
  if (req.body.requireEmailVerification !== undefined) {
    settings.security.requireEmailVerification = req.body.requireEmailVerification;
  }
  if (req.body.enableTwoFactor !== undefined) {
    settings.security.enableTwoFactor = req.body.enableTwoFactor;
  }
  if (req.body.maxLoginAttempts !== undefined) {
    settings.security.maxLoginAttempts = req.body.maxLoginAttempts;
  }
  if (req.body.sessionTimeout !== undefined) {
    settings.security.sessionTimeout = req.body.sessionTimeout;
  }

  // Update feature flags
  if (req.body.enableMarketplace !== undefined) {
    settings.features.enableMarketplace = req.body.enableMarketplace;
  }
  if (req.body.enableReviews !== undefined) {
    settings.features.enableReviews = req.body.enableReviews;
  }
  if (req.body.enableReferrals !== undefined) {
    settings.features.enableReferrals = req.body.enableReferrals;
  }
  if (req.body.maintenanceMode !== undefined) {
    settings.features.maintenanceMode = req.body.maintenanceMode;
  }

  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings.getPublicSettings()
  });
});

// @desc    Get public platform settings (for client use)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings();

  res.status(200).json({
    success: true,
    data: settings.getPublicSettings()
  });
});
