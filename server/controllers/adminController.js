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

// @desc    Get all shops with filters
// @route   GET /api/admin/shops
// @access  Admin only
exports.getAllShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { shopName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const shops = await Shop.find(query)
    .populate('owner', 'name email plan')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get product counts for each shop
  const shopsWithCounts = await Promise.all(
    shops.map(async (shop) => {
      const productsCount = await Product.countDocuments({ shop: shop._id });
      return {
        ...shop.toObject(),
        productsCount
      };
    })
  );

  const total = await Shop.countDocuments(query);
  const activeShops = await Shop.countDocuments({ ...query, isActive: true });

  res.json({
    success: true,
    count: shops.length,
    total,
    activeShops,
    page: Number(page),
    pages: Math.ceil(total / limit),
    shops: shopsWithCounts
  });
});

// @desc    Delete shop
// @route   DELETE /api/admin/shops/:id
// @access  Admin only
exports.deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  // Delete all products associated with this shop
  await Product.deleteMany({ shop: shop._id });

  // Delete all orders associated with this shop
  await Order.deleteMany({ shop: shop._id });

  await shop.deleteOne();

  res.json({
    success: true,
    message: 'Shop and associated data deleted successfully'
  });
});

// @desc    Get all products with filters
// @route   GET /api/admin/products
// @access  Admin only
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, search, category
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  const products = await Product.find(query)
    .populate('shop', 'shopName slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Product.countDocuments(query);
  const activeProducts = await Product.countDocuments({ ...query, inStock: true });

  // Calculate average price
  const allProducts = await Product.find(query).select('price');
  const avgPrice = allProducts.length > 0
    ? allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length
    : 0;

  res.json({
    success: true,
    count: products.length,
    total,
    activeProducts,
    avgPrice: Math.round(avgPrice),
    page: Number(page),
    pages: Math.ceil(total / limit),
    products
  });
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin only
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get all orders with filters
// @route   GET /api/admin/orders
// @access  Admin only
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, search, status
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } }
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('shop', 'shopName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  // Get status counts
  const [pending, processing, completed, cancelled] = await Promise.all([
    Order.countDocuments({ ...query, status: 'pending' }),
    Order.countDocuments({ ...query, status: 'processing' }),
    Order.countDocuments({ ...query, status: 'completed' }),
    Order.countDocuments({ ...query, status: 'cancelled' })
  ]);

  res.json({
    success: true,
    count: orders.length,
    total,
    statusCounts: {
      pending,
      processing,
      completed,
      cancelled
    },
    page: Number(page),
    pages: Math.ceil(total / limit),
    orders
  });
});

// @desc    Update order status
// @route   PATCH /api/admin/orders/:id/status
// @access  Admin only
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  order.status = status;
  await order.save();

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    order
  });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Admin only
exports.getAnalytics = asyncHandler(async (req, res) => {
  // Get user growth for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const users = await User.find({ createdAt: { $gte: sixMonthsAgo } });

  // Group users by month
  const userGrowth = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = users.filter((u) => u.createdAt >= monthStart && u.createdAt <= monthEnd).length;

    userGrowth.push({
      month: monthNames[date.getMonth()],
      users: count
    });
  }

  // Get plan distribution
  const [freePlan, proPlan, premiumPlan] = await Promise.all([
    User.countDocuments({ plan: 'free' }),
    User.countDocuments({ plan: 'pro' }),
    User.countDocuments({ plan: 'premium' })
  ]);

  // Get top shops by product count
  const shops = await Shop.find().populate('owner', 'name email');
  const topShops = await Promise.all(
    shops.map(async (shop) => {
      const productsCount = await Product.countDocuments({ shop: shop._id });
      const ordersCount = await Order.countDocuments({ shop: shop._id, status: 'completed' });
      const orders = await Order.find({ shop: shop._id, status: 'completed' });
      const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      return {
        _id: shop._id,
        name: shop.shopName,
        products: productsCount,
        orders: ordersCount,
        revenue
      };
    })
  );

  // Sort by revenue and take top 10
  topShops.sort((a, b) => b.revenue - a.revenue);
  const top10Shops = topShops.slice(0, 10);

  // Get current month stats vs last month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthUsers, lastMonthUsers] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    User.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
  ]);

  const [currentMonthShops, lastMonthShops] = await Promise.all([
    Shop.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    Shop.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
  ]);

  const [currentMonthProducts, lastMonthProducts] = await Promise.all([
    Product.countDocuments({ createdAt: { $gte: currentMonthStart } }),
    Product.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } })
  ]);

  const [currentMonthOrders, lastMonthOrders] = await Promise.all([
    Order.find({ createdAt: { $gte: currentMonthStart }, status: 'completed' }),
    Order.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'completed' })
  ]);

  const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Calculate percentage changes
  const userGrowthPercent = lastMonthUsers > 0
    ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
    : 0;
  const shopGrowthPercent = lastMonthShops > 0
    ? ((currentMonthShops - lastMonthShops) / lastMonthShops * 100).toFixed(1)
    : 0;
  const productGrowthPercent = lastMonthProducts > 0
    ? ((currentMonthProducts - lastMonthProducts) / lastMonthProducts * 100).toFixed(1)
    : 0;
  const revenueGrowthPercent = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0;

  res.json({
    success: true,
    analytics: {
      userGrowth,
      planDistribution: {
        free: freePlan,
        pro: proPlan,
        premium: premiumPlan
      },
      topShops: top10Shops,
      growth: {
        users: userGrowthPercent,
        shops: shopGrowthPercent,
        products: productGrowthPercent,
        revenue: revenueGrowthPercent
      }
    }
  });
});

// @desc    Get revenue data
// @route   GET /api/admin/revenue
// @access  Admin only
exports.getRevenue = asyncHandler(async (req, res) => {
  // Get all completed orders
  const orders = await Order.find({ status: 'completed' }).populate('shop', 'shopName');
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Get current month revenue
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentMonthOrders, lastMonthOrders] = await Promise.all([
    Order.find({ createdAt: { $gte: currentMonthStart }, status: 'completed' }),
    Order.find({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }, status: 'completed' })
  ]);

  const thisMonth = currentMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const lastMonth = lastMonthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Get monthly revenue for last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthOrders = await Order.find({
      createdAt: { $gte: monthStart, $lte: monthEnd },
      status: 'completed'
    });

    const amount = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    monthlyRevenue.push({
      month: monthNames[date.getMonth()],
      amount
    });
  }

  // Get recent subscription payments (paid plans)
  const paidUsers = await User.find({
    plan: { $in: ['pro', 'premium'] },
    lastBillingDate: { $exists: true }
  })
    .select('name email plan billingPeriod lastBillingDate')
    .sort({ lastBillingDate: -1 })
    .limit(20);

  const subscriptions = paidUsers.map((user) => {
    // Calculate amount based on plan and billing period
    const prices = {
      'pro-monthly': 9000,
      'pro-yearly': 75600,
      'premium-monthly': 18000,
      'premium-yearly': 151200
    };
    const priceKey = `${user.plan}-${user.billingPeriod || 'monthly'}`;

    return {
      _id: user._id,
      user: {
        name: user.name,
        email: user.email
      },
      plan: user.plan,
      billingPeriod: user.billingPeriod || 'monthly',
      amount: prices[priceKey] || 0,
      date: user.lastBillingDate,
      status: 'paid'
    };
  });

  res.json({
    success: true,
    revenue: {
      total: totalRevenue,
      thisMonth,
      lastMonth,
      monthlyRevenue,
      subscriptions
    }
  });
});

// @desc    Debug user shop status
// @route   GET /api/admin/debug/user-shop/:email
// @access  Admin only
exports.debugUserShop = asyncHandler(async (req, res) => {
  const { email } = req.params;

  // Find user
  const user = await User.findOne({ email }).lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find all shops owned by this user
  const shops = await Shop.find({ owner: user._id }).lean();

  const shopDetails = shops.map((shop, index) => ({
    index: index + 1,
    isPrimary: index === 0,
    name: shop.shopName,
    slug: shop.slug,
    url: `https://wazhop.ng/${shop.slug}`,
    isActive: shop.isActive,
    created: shop.createdAt,
    productsCount: 0 // Can add product count if needed
  }));

  const primaryShopInactive = shops.length > 0 && !shops[0].isActive;

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        shopReference: user.shop || null
      },
      shops: shopDetails,
      totalShops: shops.length,
      primaryShopInactive,
      issue: primaryShopInactive ? 'Primary shop is inactive - this causes "Shop Not Found" error' : null,
      fix: primaryShopInactive ? 'Run POST /api/admin/migrations/reactivate-primary-shops to fix' : null
    }
  });
});
