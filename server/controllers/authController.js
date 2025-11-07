const { validationResult } = require('express-validator');
const User = require('../models/User');
const Shop = require('../models/Shop');
const { 
  sendTokenResponse, 
  asyncHandler, 
  formatValidationErrors,
  generateSlug 
} = require('../utils/helpers');
const crypto = require('crypto');
const { sendEmail, sendSMS } = require('../utils/notify');

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

  const { name, email, password, whatsapp, role: roleInput } = req.body;
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

  // Create user
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    whatsapp: role === 'seller' ? whatsapp : undefined,
    role,
    plan: 'free'
  });

  // Create default shop only for sellers
  if (role === 'seller') {
    const baseSlug = generateSlug(name);
    const uniqueSlug = await Shop.generateUniqueSlug(baseSlug);

    const shop = await Shop.create({
      owner: user._id,
      shopName: `${name}'s Shop`,
      slug: uniqueSlug,
      description: 'Welcome to my shop!',
      theme: {
        primaryColor: '#000000',
        accentColor: '#FFD700',
        layout: 'grid',
        font: 'inter'
      }
    });

    user.shop = shop._id;
  }
  
  // Prepare email verification token
  const emailToken = crypto.randomBytes(24).toString('hex');
  user.emailVerificationToken = emailToken;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await user.save();

  // Kick off email (fire-and-forget)
  try {
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${emailToken}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
        <h2>Verify your email</h2>
        <p>Hi ${name.split(' ')[0]}, thanks for joining WaZhop.</p>
        <p>Click the button below to verify your email address.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
        <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `;
    await sendEmail({ to: normalizedEmail, subject: 'Verify your email', html });
  } catch (e) {
    console.warn('Email verification send failed:', e.message);
  }

  // Send token response
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

  const { email, password } = req.body;

  // Normalize email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // Find user with password field
  const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('shop');

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

  // If email not verified, resend token and block login
  if (!user.emailVerified) {
    const token = require('crypto').randomBytes(24).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await user.save();
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
        <h2>Verify your email</h2>
        <p>Hi ${user.name.split(' ')[0]}, please verify your email to continue.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
      </div>
    `;
    try { await sendEmail({ to: user.email, subject: 'Verify your email', html }); } catch {}
    return res.status(403).json({ success: false, message: 'Please verify your email. We just sent you a new verification link.' });
  }

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('shop');

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
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

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
  const token = crypto.randomBytes(24).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
      <h2>Verify your email</h2>
      <p>Click below to verify your email for WaZhop.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
    </div>
  `;
  await sendEmail({ to: user.email, subject: 'Verify your email', html });

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

  const token = crypto.randomBytes(24).toString('hex');
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await user.save();

  const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
      <h2>Verify your email</h2>
      <p>Click below to verify your email for WaZhop.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#F97316;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify Email</a></p>
    </div>
  `;
  try { await sendEmail({ to: user.email, subject: 'Verify your email', html }); } catch {}

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
