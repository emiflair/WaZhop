const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Shop = require('../models/Shop');
const {
  sendTokenResponse,
  asyncHandler,
  formatValidationErrors,
  generateSlug,
  formatWhatsAppNumber,
  normalizePhoneNumber
} = require('../utils/helpers');
const { sendEmail, sendSMS } = require('../utils/notify');
const PlatformSettings = require('../models/PlatformSettings');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: formatValidationErrors(errors)
    });
  }

  const {
    name, email, password, whatsapp, role: roleInput, referralCode
  } = req.body;
  const role = (roleInput === 'seller' ? 'seller' : 'buyer');

  // Normalize email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Normalize/validate whatsapp for sellers and ensure uniqueness
  let normalizedWhatsApp;
  if (role === 'seller') {
    if (!whatsapp || !String(whatsapp).trim()) {
      return res.status(400).json({ success: false, message: 'WhatsApp number is required for sellers' });
    }
    normalizedWhatsApp = formatWhatsAppNumber(String(whatsapp));
    const existingPhone = await User.findOne({ whatsapp: normalizedWhatsApp });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'WhatsApp number is already in use' });
    }
  }

  // Handle referral code if provided
  let referrerId = null;
  if (referralCode && referralCode.trim()) {
    try {
      const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (referrer) {
        referrerId = referrer._id;
      }
    } catch (err) {
      console.warn('Failed to process referral code during registration:', err);
    }
  }

  // Create user - NO automatic shop creation
  // Shop will be created automatically when user adds their first product
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    whatsapp: role === 'seller' ? normalizedWhatsApp : undefined,
    role,
    plan: 'free',
    referredBy: referrerId,
    shop: undefined // Shop will be created on first product addition
  });

  // Respect platform security setting for email verification
  const settings = await PlatformSettings.getSettings();
  const requireVerify = !!settings?.security?.requireEmailVerification;

  if (requireVerify) {
    // Generate a 6-digit code and send email, but do not auto-login
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await user.save();

    const verifyUrl = `https://wazhop.ng/verify-email?token=${token}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;background:#ffffff">
        <div style="text-align:center;margin-bottom:30px">
          <h1 style="color:#F97316;margin:0">WaZhop</h1>
        </div>
        
        <h2 style="color:#1f2937;margin-bottom:20px">Verify Your WaZhop Account</h2>
        
        <p style="color:#4b5563;margin-bottom:16px">Hi <strong>${user.name}</strong>,</p>
        
        <p style="color:#4b5563;margin-bottom:16px">Welcome to <strong>WaZhop</strong> — your trusted platform for buying and selling goods with ease and security.</p>
        
        <p style="color:#4b5563;margin-bottom:16px">To complete your registration and activate your account, please use the verification code below:</p>
        
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Your Verification Code:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0;color:#F97316">${token}</p>
        </div>
        
        <p style="color:#4b5563;margin-bottom:16px">This code will expire in <strong>10 minutes</strong>, so please verify your account as soon as possible.</p>
        
        <div style="text-align:center;margin:30px 0">
          <a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email</a>
        </div>
        
        <p style="color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb">If you didn't create a WaZhop account, please ignore this message.</p>
        
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb">
          <p style="color:#4b5563;margin-bottom:8px">Thank you for joining the WaZhop community.<br/>We're excited to have you buy, sell, and grow with us!</p>
          <p style="color:#4b5563;margin:16px 0 0">Warm regards,<br/><strong>The WaZhop Team</strong><br/><a href="mailto:support@wazhop.ng" style="color:#F97316;text-decoration:none">support@wazhop.ng</a></p>
        </div>
      </div>
    `;
    try {
      const resp = await sendEmail({ to: user.email, subject: 'Verify Your WaZhop Account', html });
      if (!resp?.ok) {
        console.log(`[dev] Email verification code for ${user.email}: ${token}`);
      }
    } catch (e) {
      console.warn('Email verification send failed:', e.message);
      console.log(`[dev] Email verification code for ${user.email}: ${token}`);
    }

    return res.status(201).json({
      success: true,
      pendingVerification: true,
      message: 'Account created. Check your email for a 6-digit code to verify.'
    });
  }

  // If verification not required, auto-login the user after registration
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: formatValidationErrors(errors)
    });
  }

  const { email, password, twoFactorToken } = req.body;

  // Normalize email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // Find user with password field and 2FA fields
  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +twoFactorEnabled +twoFactorSecret')
    .populate({
      path: 'shop',
      match: { owner: { $exists: true } } // Only populate if shop has an owner
    });

  // Security check after population
  if (user && user.shop && user.shop.owner && user.shop.owner.toString() !== user._id.toString()) {
    console.error(`🚨 SECURITY ALERT during login: User ${user._id} had shop ${user.shop._id} which belongs to ${user.shop.owner}`);
    user.shop = null;
    // Fix the database
    await User.findByIdAndUpdate(user._id, { $unset: { shop: 1 } });
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // Check if email is verified - REQUIRED
  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
      requiresVerification: true,
      email: user.email
    });
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // If 2FA token not provided, ask for it
    if (!twoFactorToken) {
      return res.status(200).json({
        success: false,
        requires2FA: true,
        message: 'Please enter your 2FA code'
      });
    }

    // Verify 2FA token
    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }
  }

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('+twoFactorEnabled')
    .populate({
      path: 'shop',
      match: { owner: req.user.id } // CRITICAL FIX: Only populate shop if user owns it
    });

  // Additional safety check: If shop is populated but doesn't belong to user, remove it
  if (user.shop && user.shop.owner && user.shop.owner.toString() !== req.user.id.toString()) {
    console.error(`🚨 SECURITY ALERT: User ${req.user.id} had shop ${user.shop._id} which belongs to ${user.shop.owner}`);
    user.shop = null;
    // Fix the database
    await User.findByIdAndUpdate(req.user.id, { $unset: { shop: 1 } });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    whatsapp: req.body.whatsapp
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach((key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

  // If updating whatsapp, normalize and check uniqueness
  if (fieldsToUpdate.whatsapp) {
    const normalized = normalizePhoneNumber(fieldsToUpdate.whatsapp);
    const existingPhone = await User.findOne({
      whatsapp: normalized,
      _id: { $ne: req.user.id }
    });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'WhatsApp number is already in use' });
    }
    fieldsToUpdate.whatsapp = normalized;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
});

// @desc    Upgrade buyer to seller
// @route   PUT /api/auth/upgrade-to-seller
// @access  Private
exports.upgradeToSeller = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('shop');

  if (user.role === 'seller') {
    return res.status(400).json({ success: false, message: 'You are already a seller' });
  }

  const { whatsapp, referralCode } = req.body;

  if (!whatsapp || !String(whatsapp).trim()) {
    return res.status(400).json({ success: false, message: 'WhatsApp number is required' });
  }

  // Normalize and check uniqueness
  const normalized = normalizePhoneNumber(String(whatsapp));
  const existingPhone = await User.findOne({ whatsapp: normalized });
  if (existingPhone) {
    return res.status(400).json({ success: false, message: 'WhatsApp number is already in use' });
  }

  // Update user to seller - NO automatic shop creation
  // Shop will be created when they add their first product
  user.role = 'seller';
  user.whatsapp = normalized;
  await user.save();

  // Handle referral if provided
  if (referralCode && referralCode.trim()) {
    try {
      const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        user.referredBy = referrer._id;
        await user.save();
      }
    } catch (err) {
      console.warn('Failed to apply referral code during upgrade:', err);
    }
  }

  const updatedUser = await User.findById(user._id).populate('shop');

  res.status(200).json({
    success: true,
    user: updatedUser,
    message: 'Successfully upgraded to seller account'
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Request email verification (resend)
// @route   POST /api/auth/request-email-verification
// @access  Private
exports.requestEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const verifyUrl = `https://wazhop.ng/verify-email?token=${token}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;background:#ffffff">
      <div style="text-align:center;margin-bottom:30px">
        <h1 style="color:#F97316;margin:0">WaZhop</h1>
      </div>
      
      <h2 style="color:#1f2937;margin-bottom:20px">Verify Your WaZhop Account</h2>
      
      <p style="color:#4b5563;margin-bottom:16px">Hi <strong>${user.name}</strong>,</p>
      
      <p style="color:#4b5563;margin-bottom:16px">Welcome to <strong>WaZhop</strong> — your trusted platform for buying and selling goods with ease and security.</p>
      
      <p style="color:#4b5563;margin-bottom:16px">To complete your registration and activate your account, please use the verification code below:</p>
      
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Your Verification Code:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0;color:#F97316">${token}</p>
      </div>
      
      <p style="color:#4b5563;margin-bottom:16px">This code will expire in <strong>10 minutes</strong>, so please verify your account as soon as possible.</p>
      
      <div style="text-align:center;margin:30px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email</a>
      </div>
      
      <p style="color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb">If you didn't create a WaZhop account, please ignore this message.</p>
      
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb">
        <p style="color:#4b5563;margin-bottom:8px">Thank you for joining the WaZhop community.<br/>We're excited to have you buy, sell, and grow with us!</p>
        <p style="color:#4b5563;margin:16px 0 0">Warm regards,<br/><strong>The WaZhop Team</strong><br/><a href="mailto:support@wazhop.ng" style="color:#F97316;text-decoration:none">support@wazhop.ng</a></p>
      </div>
    </div>
  `;
  try {
    const resp = await sendEmail({ to: user.email, subject: 'Verify Your WaZhop Account', html });
    if (!resp?.ok) {
      console.log(`[dev] Email verification code for ${user.email}: ${token}`);
    }
  } catch (e) {
    console.warn('Email verification send failed:', e.message);
    console.log(`[dev] Email verification code for ${user.email}: ${token}`);
  }

  res.json({ success: true, message: 'Verification email sent' });
});

// @desc    Request email verification (public, by email)
// @route   POST /api/auth/request-email-verification-public
// @access  Public
exports.requestEmailVerificationPublic = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Always respond with success to avoid account enumeration
  const genericResponse = () => res.json({ success: true, message: 'If an account exists, a verification email has been sent.' });

  if (!normalizedEmail) return genericResponse();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return genericResponse();
  if (user.emailVerified) return genericResponse();

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const verifyUrl = `https://wazhop.ng/verify-email?token=${token}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;background:#ffffff">
      <div style="text-align:center;margin-bottom:30px">
        <h1 style="color:#F97316;margin:0">WaZhop</h1>
      </div>
      
      <h2 style="color:#1f2937;margin-bottom:20px">Verify Your WaZhop Account</h2>
      
      <p style="color:#4b5563;margin-bottom:16px">Hi <strong>${user.name}</strong>,</p>
      
      <p style="color:#4b5563;margin-bottom:16px">Welcome to <strong>WaZhop</strong> — your trusted platform for buying and selling goods with ease and security.</p>
      
      <p style="color:#4b5563;margin-bottom:16px">To complete your registration and activate your account, please use the verification code below:</p>
      
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Your Verification Code:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0;color:#F97316">${token}</p>
      </div>
      
      <p style="color:#4b5563;margin-bottom:16px">This code will expire in <strong>10 minutes</strong>, so please verify your account as soon as possible.</p>
      
      <div style="text-align:center;margin:30px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email</a>
      </div>
      
      <p style="color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb">If you didn't create a WaZhop account, please ignore this message.</p>
      
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb">
        <p style="color:#4b5563;margin-bottom:8px">Thank you for joining the WaZhop community.<br/>We're excited to have you buy, sell, and grow with us!</p>
        <p style="color:#4b5563;margin:16px 0 0">Warm regards,<br/><strong>The WaZhop Team</strong><br/><a href="mailto:support@wazhop.ng" style="color:#F97316;text-decoration:none">support@wazhop.ng</a></p>
      </div>
    </div>
  `;
  try {
    const resp = await sendEmail({ to: user.email, subject: 'Verify Your WaZhop Account', html });
    if (!resp?.ok) {
      console.log(`[dev] Email verification code for ${user.email}: ${token}`);
    }
  } catch (e) {
    console.warn('Email verification send failed:', e.message);
    console.log(`[dev] Email verification code for ${user.email}: ${token}`);
  }

  return genericResponse();
});

// @desc    Verify email token
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'Token expired' });
  }
  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();
  // Auto-login support: if client requested autoLogin=1, issue JWT like normal login
  if (req.query.autoLogin === '1') {
    // populate shop for redirect logic if needed
    await user.populate('shop');
    return sendTokenResponse(user, 200, res);
  }
  res.json({ success: true, message: 'Email verified successfully' });
});

// @desc    Request SMS code
// @route   POST /api/auth/request-sms-code
// @access  Private
exports.requestSmsCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.phoneVerificationCode = code;
  user.phoneVerificationExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 min
  await user.save();

  const text = `Your WaZhop verification code is ${code}. It expires in 10 minutes.`;
  await sendSMS({ to: user.whatsapp, text });
  res.json({ success: true, message: 'Verification code sent' });
});

// @desc    Verify SMS code
// @route   POST /api/auth/verify-sms
// @access  Private
exports.verifySmsCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user.id);
  if (!code || !user.phoneVerificationCode) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }
  if (user.phoneVerificationExpires && user.phoneVerificationExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'Code expired' });
  }
  if (user.phoneVerificationCode !== code) {
    return res.status(400).json({ success: false, message: 'Incorrect code' });
  }
  user.phoneVerified = true;
  user.phoneVerificationCode = null;
  user.phoneVerificationExpires = null;
  await user.save();
  res.json({ success: true, message: 'Phone verified successfully' });
});

// @desc    Forgot password (public)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();
  const generic = () => res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  if (!normalizedEmail) return generic();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return generic();

  // If email is not verified, do not send reset link. Instead, (re)send verification code.
  if (!user.emailVerified) {
    try {
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationToken = token;
      user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await user.save();

      const verifyUrl = `https://wazhop.ng/verify-email?token=${token}`;
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;background:#ffffff">
          <div style="text-align:center;margin-bottom:30px">
            <h1 style="color:#F97316;margin:0">WaZhop</h1>
          </div>
          
          <h2 style="color:#1f2937;margin-bottom:20px">Verify Your Email</h2>
          
          <p style="color:#4b5563;margin-bottom:16px">Hi <strong>${user.name}</strong>,</p>
          
          <p style="color:#4b5563;margin-bottom:16px">To reset your password, please verify your email first using the verification code below:</p>
          
          <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin:24px 0">
            <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Your Verification Code:</p>
            <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0;color:#F97316">${token}</p>
          </div>
          
          <p style="color:#4b5563;margin-bottom:16px">This code will expire in <strong>10 minutes</strong>, so please verify your account as soon as possible.</p>
          
          <div style="text-align:center;margin:30px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email</a>
          </div>
          
          <p style="color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb">If you didn't request this, please ignore this message.</p>
          
          <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb">
            <p style="color:#4b5563;margin:16px 0 0">Warm regards,<br/><strong>The WaZhop Team</strong><br/><a href="mailto:support@wazhop.ng" style="color:#F97316;text-decoration:none">support@wazhop.ng</a></p>
          </div>
        </div>
      `;
      try {
        const resp = await sendEmail({ to: user.email, subject: 'Verify Your Email to Reset Password', html });
        if (!resp?.ok) {
          console.log(`[dev] Email verification code for ${user.email}: ${token}`);
        }
      } catch (e) {
        console.warn('Email verification (forgot-password) send failed:', e.message);
        console.log(`[dev] Email verification code for ${user.email}: ${token}`);
      }
    } catch {}
    return generic();
  }

  const token = crypto.randomBytes(24).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
  await user.save();

  const resetUrl = `https://wazhop.ng/reset-password/${token}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;background:#ffffff">
      <div style="text-align:center;margin-bottom:30px">
        <h1 style="color:#F97316;margin:0">WaZhop</h1>
      </div>
      
      <h2 style="color:#1f2937;margin-bottom:20px">Reset Your WaZhop Password</h2>
      
      <p style="color:#4b5563;margin-bottom:16px">Hi <strong>${user.name}</strong>,</p>
      
      <p style="color:#4b5563;margin-bottom:16px">We received a request to reset the password for your WaZhop account.</p>
      
      <p style="color:#4b5563;margin-bottom:16px">To continue, please use the secure link below:</p>
      
      <div style="text-align:center;margin:30px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Reset Password</a>
      </div>
      
      <p style="color:#4b5563;margin-bottom:16px">This link will expire in <strong>10 minutes</strong> for your security.</p>
      
      <p style="color:#6b7280;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb">If you did not request a password reset, you can safely ignore this email—your account is still secure.</p>
      
      <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb">
        <p style="color:#4b5563;margin-bottom:8px">For any help, feel free to contact us at <a href="mailto:support@wazhop.ng" style="color:#F97316;text-decoration:none">support@wazhop.ng</a>.</p>
        <p style="color:#4b5563;margin:16px 0 0">Stay safe,<br/><strong>The WaZhop Team</strong><br/><a href="https://wazhop.ng" style="color:#F97316;text-decoration:none">www.wazhop.ng</a></p>
      </div>
    </div>
  `;
  try { await sendEmail({ to: user.email, subject: 'Reset Your WaZhop Password', html }); } catch {}

  // In development, include token to ease testing (never in production)
  if ((process.env.NODE_ENV || 'development') !== 'production') {
    return res.json({ success: true, message: 'Reset email simulated (dev).', token });
  }
  return generic();
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }
  const user = await User.findOne({ passwordResetToken: token });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid reset token' });
  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'Reset token expired' });
  }
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  res.json({ success: true, message: 'Password reset successful. You can now log in.' });
});
