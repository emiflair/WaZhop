const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Middleware to check if user can create more products
exports.checkProductLimit = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const productCount = await Product.countDocuments({ shop: shop._id });
    const planLimits = req.user.getPlanLimits();

    if (productCount >= planLimits.products) {
      return res.status(403).json({
        success: false,
        message: `Your ${req.user.plan} plan allows up to ${planLimits.products} products. Please upgrade to add more.`,
        limit: planLimits.products,
        current: productCount
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits'
    });
  }
};

// Middleware to check if user has access to analytics
exports.checkAnalyticsAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.analytics) {
      return res.status(403).json({
        success: false,
        message: `Analytics is only available on Pro and Premium plans. Please upgrade to access this feature.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits'
    });
  }
};

// Middleware to check custom domain access
exports.checkCustomDomainAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.customDomain) {
      return res.status(403).json({
        success: false,
        message: `Custom domain is only available on Premium plan. Please upgrade to access this feature.`
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking plan limits'
    });
  }
};
