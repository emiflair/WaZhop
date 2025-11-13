const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Check if user is admin (supports legacy isAdmin flag and new role field)
exports.isAdmin = async (req, res, next) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Require specific role(s) to access a route
// Usage: requireRole('seller') or requireRole('seller', 'admin')
exports.requireRole = (...roles) => (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    const userRole = req.user.role || (req.user.isAdmin ? 'admin' : undefined);

    // Admins are allowed unless explicitly excluded
    const isAllowed = roles.includes(userRole) || userRole === 'admin';
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  } catch (err) {
    console.error('requireRole middleware error:', err);
    return res.status(500).json({ success: false, message: 'Server error during authorization' });
  }
};

// Check plan limits
exports.checkPlanLimit = (resource) => async (req, res, next) => {
  try {
    const { user } = req;
    const limits = user.getPlanLimits();

    // Check if plan is expired
    if (user.isPlanExpired()) {
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.'
      });
    }

    // For product creation, check product count
    if (resource === 'products') {
      const Shop = require('../models/Shop');
      const Product = require('../models/Product');

      const shop = await Shop.findOne({ owner: user._id });
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      const productCount = await Product.countDocuments({ shop: shop._id });

      if (productCount >= limits.products) {
        return res.status(403).json({
          success: false,
          message: `Your ${user.plan} plan allows up to ${limits.products} products. Please upgrade to add more.`,
          upgrade: true
        });
      }
    }

    next();
  } catch (error) {
    console.error('Plan limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits'
    });
  }
};

// Optional auth - attach user if token exists, but don't require it
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Invalid token, but that's okay for optional auth
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
