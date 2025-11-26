const User = require('../models/User');
const Shop = require('../models/Shop');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../utils/helpers');

// @desc    Verify activation token
// @route   GET /api/activate-store/verify/:shopId/:token
// @access  Public
exports.verifyActivationToken = asyncHandler(async (req, res) => {
  const { shopId, token } = req.params;

  const shop = await Shop.findOne({
    _id: shopId,
    activationToken: token,
    isTemporary: true,
    activationTokenExpires: { $gt: Date.now() }
  }).populate('owner', 'name email');

  if (!shop) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired activation link'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      shopName: shop.shopName,
      slug: shop.slug,
      previewUrl: `${process.env.CLIENT_URL}/s/${shop.slug}?preview=true`
    }
  });
});

// @desc    Activate store and create seller account
// @route   POST /api/activate-store/:shopId/:token
// @access  Public
exports.activateStore = asyncHandler(async (req, res) => {
  const { shopId, token } = req.params;
  const { email, phone, password } = req.body;

  // Validation
  if (!email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email, phone number, and password are required'
    });
  }

  // Verify activation token
  const shop = await Shop.findOne({
    _id: shopId,
    activationToken: token,
    isTemporary: true,
    activationTokenExpires: { $gt: Date.now() }
  });

  if (!shop) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired activation link'
    });
  }

  // Check if email already exists (excluding temp emails)
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    email: { $not: /@wazhop\.ng$/ }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please use a different email.'
    });
  }

  // Check if phone already exists
  const existingPhone = await User.findOne({ whatsapp: phone });
  if (existingPhone && !existingPhone.isTemporary) {
    return res.status(400).json({
      success: false,
      message: 'Phone number already registered'
    });
  }

  // Get the temporary user
  const tempUser = await User.findById(shop.owner).select('+password');

  if (!tempUser) {
    return res.status(404).json({
      success: false,
      message: 'User account not found'
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update user to real account
  tempUser.email = email.toLowerCase();
  tempUser.whatsapp = phone;
  tempUser.password = hashedPassword;
  tempUser.isTemporary = false;
  tempUser.accountStatus = 'active';
  tempUser.emailVerified = false; // Will send verification email
  tempUser.phoneVerified = false;

  await tempUser.save();

  // Update shop
  shop.isTemporary = false;
  shop.activationToken = null;
  shop.activationTokenExpires = null;
  shop.activatedAt = new Date();

  await shop.save();

  // Generate JWT token for auto-login
  const jwtToken = jwt.sign(
    { id: tempUser._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    token: jwtToken,
    data: {
      user: {
        id: tempUser._id,
        name: tempUser.name,
        email: tempUser.email,
        role: tempUser.role,
        plan: tempUser.plan
      },
      shop: {
        id: shop._id,
        name: shop.shopName,
        slug: shop.slug
      }
    },
    message: 'Store activated successfully! Welcome to WaZhop.'
  });
});

module.exports = {
  verifyActivationToken,
  activateStore
};
