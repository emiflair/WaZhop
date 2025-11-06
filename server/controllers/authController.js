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

  const { name, email, password, whatsapp, role = 'buyer' } = req.body;

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
    plan: 'free',
    role
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
    await user.save();
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

// @desc    Upgrade a buyer account to seller and create default shop
// @route   PUT /api/auth/upgrade-to-seller
// @access  Private
exports.upgradeToSeller = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id);

  if (!currentUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // If already seller/admin, nothing to do
  if (currentUser.role === 'seller' || currentUser.role === 'admin') {
    return res.status(200).json({ success: true, data: currentUser, message: 'Account already has seller access' });
  }

  const { whatsapp } = req.body || {};
  if (!whatsapp) {
    return res.status(400).json({ success: false, message: 'WhatsApp number is required to become a seller' });
  }

  currentUser.whatsapp = whatsapp;
  currentUser.role = 'seller';
  await currentUser.save();

  // Create a default shop if none exists
  if (!currentUser.shop) {
    const baseSlug = generateSlug(currentUser.name || 'my-shop');
    const uniqueSlug = await Shop.generateUniqueSlug(baseSlug);

    const shop = await Shop.create({
      owner: currentUser._id,
      shopName: `${currentUser.name || 'My'}'s Shop`,
      slug: uniqueSlug,
      description: 'Welcome to my shop!',
      theme: {
        primaryColor: '#000000',
        accentColor: '#FFD700',
        layout: 'grid',
        font: 'inter'
      }
    });

    currentUser.shop = shop._id;
    await currentUser.save();
  }

  // Return fresh token containing updated role
  return sendTokenResponse(currentUser, 200, res);
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

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Always respond with success message to avoid user enumeration
  if (!user) {
    return res.status(200).json({ success: true, message: 'If an account exists, a reset link has been generated.' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  user.passwordResetToken = hashed;
  user.passwordResetExpires = expires;
  await user.save({ validateBeforeSave: false });

  const baseUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password/${resetToken}`;

  // In production, you would send email via a provider. For development, return link.
  const response = { success: true, message: 'If an account exists, a reset link has been generated.' };
  if (process.env.NODE_ENV !== 'production') {
    response.resetLink = resetLink;
    response.expiresAt = expires;
  }

  res.status(200).json(response);
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ 
    passwordResetToken: hashed, 
    passwordResetExpires: { $gt: new Date() }
  }).select('+password');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.status(200).json({ success: true, message: 'Password has been reset. You can now log in.' });
});
