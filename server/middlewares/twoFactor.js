const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

/**
 * Setup 2FA for user
 * Generates secret and QR code
 */
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `WaZhop (${user.email})`,
      issuer: 'WaZhop'
    });

    // Store secret temporarily (user confirms it later)
    user.twoFactorTempSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntry: secret.otpauth_url
      },
      message: 'Scan this QR code with your authenticator app'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up 2FA'
    });
  }
};

/**
 * Verify and enable 2FA
 */
exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorEnabled = true;
    user.twoFactorTempSecret = undefined;
    
    // Generate backup codes
    const backupCodes = generateBackupCodes();
    user.twoFactorBackupCodes = backupCodes.map(code => ({
      code,
      used: false
    }));

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        backupCodes
      },
      message: '2FA enabled successfully. Save these backup codes in a safe place.'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA token
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA'
    });
  }
};

/**
 * Middleware to require 2FA verification
 */
exports.require2FA = async (req, res, next) => {
  try {
    const user = req.user;

    // Skip if 2FA is not enabled
    if (!user.twoFactorEnabled) {
      return next();
    }

    // Check if 2FA token is provided
    const token = req.headers['x-2fa-token'] || req.body.twoFactorToken;

    if (!token) {
      return res.status(403).json({
        success: false,
        message: '2FA code required',
        requires2FA: true
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      // Try backup codes
      const backupCodeValid = await verifyBackupCode(user, token);
      
      if (!backupCodeValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid 2FA code'
        });
      }
    }

    next();
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA'
    });
  }
};

/**
 * Require 2FA for admin operations
 */
exports.requireAdmin2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorEnabled');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Require 2FA for all admin operations
    if (user.role === 'admin' || user.isAdmin) {
      if (!user.twoFactorEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts must have 2FA enabled',
          setup2FARequired: true
        });
      }

      // Attach user with 2FA details
      req.user = user;
      return exports.require2FA(req, res, next);
    }

    next();
  } catch (error) {
    console.error('Admin 2FA check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking 2FA'
    });
  }
};

/**
 * Generate backup codes
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify backup code
 */
async function verifyBackupCode(user, code) {
  if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
    return false;
  }

  const backupCode = user.twoFactorBackupCodes.find(
    bc => bc.code === code && !bc.used
  );

  if (!backupCode) {
    return false;
  }

  // Mark code as used
  backupCode.used = true;
  await user.save();

  return true;
}

/**
 * Get 2FA status
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled');

    res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting 2FA status'
    });
  }
};
