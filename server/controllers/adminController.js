const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Admin only
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalSellers,
    totalBuyers,
    totalShops,
    totalProducts,
    totalOrders,
    activeSubscriptions,
    recentUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'buyer' }),
    Shop.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({
      plan: { $in: ['pro', 'premium'] },
      planExpiry: { $gt: new Date() }
    }),
    User.find()
      .select('name email role plan createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Calculate revenue (simplified - assumes all orders are completed)
  const orders = await Order.find({ status: 'completed' });
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        sellers: totalSellers,
        buyers: totalBuyers
      },
      shops: totalShops,
      products: totalProducts,
      orders: {
        total: totalOrders,
        revenue: totalRevenue
      },
      subscriptions: {
        active: activeSubscriptions
      },
      recentUsers
    }
  });
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Admin only
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    role, plan, verified, page = 1, limit = 20, search
  } = req.query;

  const query = {};

  if (role) query.role = role;
  if (plan) query.plan = plan;
  if (verified === 'true') query.emailVerified = true;
  if (verified === 'false') query.emailVerified = false;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .populate('shop', 'shopName slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: users.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    users
  });
});

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin only
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['buyer', 'seller', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be buyer, seller, or admin.'
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/status
// @access  Admin only
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin only
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent self-deletion
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  // Delete associated shop if seller
  if (user.shop) {
    await Shop.findByIdAndDelete(user.shop);
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Update user plan (manually grant subscription)
// @route   PATCH /api/admin/users/:id/plan
// @access  Admin only
exports.updateUserPlan = asyncHandler(async (req, res) => {
  const { plan, duration } = req.body;

  if (!['free', 'pro', 'premium'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan'
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.plan = plan;

  if (plan !== 'free' && duration) {
    const durationDays = parseInt(duration);
    user.planExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    user.subscriptionStatus = 'active';
  } else if (plan === 'free') {
    user.planExpiry = null;
    user.subscriptionStatus = 'none';
  }

  await user.save();

  res.json({
    success: true,
    message: `User plan updated to ${plan}`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      planExpiry: user.planExpiry
    }
  });
});

// @desc    Get system activity logs (recent orders, new users, etc)
// @route   GET /api/admin/activity
// @access  Admin only
exports.getSystemActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const [recentOrders, recentUsers, recentProducts] = await Promise.all([
    Order.find()
      .populate('shop', 'shopName')
      .populate('customer.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit),
    User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(limit),
    Product.find()
      .populate('shop', 'shopName')
      .sort({ createdAt: -1 })
      .limit(limit)
  ]);

  res.json({
    success: true,
    activity: {
      recentOrders,
      recentUsers,
      recentProducts
    }
  });
});
