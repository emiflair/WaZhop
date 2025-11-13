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
        message: 'Analytics is only available on Pro and Premium plans. Please upgrade to access this feature.'
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
        message: 'Custom domain is only available on Premium plan. Please upgrade to access this feature.'
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

// Middleware to check if user can create more shops
exports.checkShopLimit = async (req, res, next) => {
  try {
    const shops = await Shop.find({ owner: req.user.id });
    const planLimits = req.user.getPlanLimits();

    if (shops.length >= planLimits.maxShops) {
      return res.status(403).json({
        success: false,
        message: `Your ${req.user.plan} plan allows up to ${planLimits.maxShops} shop${planLimits.maxShops > 1 ? 's' : ''}. Please upgrade to create more shops.`,
        limit: planLimits.maxShops,
        current: shops.length,
        upgrade: true,
        requiredPlan: req.user.plan === 'free' ? 'pro' : 'premium'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking shop limits'
    });
  }
};

// Middleware to check storage access (free plan has no storage)
exports.checkStorageAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (planLimits.storage === 0) {
      return res.status(403).json({
        success: false,
        message: 'Image storage is not available on the Free plan. Please upgrade to Pro or Premium to upload images.',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking storage access'
    });
  }
};

// Middleware to check gradient access
exports.checkGradientAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.gradients) {
      return res.status(403).json({
        success: false,
        message: 'Gradient themes are only available on Pro and Premium plans. Please upgrade to access gradient customization.',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking gradient access'
    });
  }
};

// Middleware to check custom CSS access
exports.checkCustomCSSAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.customCSS) {
      return res.status(403).json({
        success: false,
        message: 'Custom CSS is only available on Premium plan. Please upgrade to access custom styling.',
        upgrade: true,
        requiredPlan: 'premium'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking custom CSS access'
    });
  }
};

// Middleware to check animations access
exports.checkAnimationsAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.animations) {
      return res.status(403).json({
        success: false,
        message: 'Animations are only available on Pro and Premium plans. Please upgrade to enable animations.',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking animations access'
    });
  }
};

// Middleware to check theme customization access
exports.checkThemeCustomizationAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    // Free plan cannot customize themes at all
    if (req.user.plan === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Theme customization is not available on the Free plan. Upgrade to Pro for preset themes or Premium for unlimited customization.',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    // Pro plan can only use presets, not custom colors (unless selecting from PRO_THEMES)
    if (req.user.plan === 'pro' && (req.body.primaryColor || req.body.accentColor || req.body.customCSS)) {
      return res.status(403).json({
        success: false,
        message: 'Custom colors and CSS are only available on Premium plan. Pro users can choose from 10 professional preset themes.',
        upgrade: true,
        requiredPlan: 'premium'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking theme customization access'
    });
  }
};

// Middleware to check premium template access
exports.checkPremiumTemplateAccess = async (req, res, next) => {
  try {
    const { templateId } = req.body;
    const premiumTemplates = ['luxury-motion', 'lifestyle-banner'];

    if (premiumTemplates.includes(templateId) && req.user.plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: `The ${templateId} template is only available on Premium plan. Please upgrade to access this exclusive template.`,
        upgrade: true,
        requiredPlan: 'premium'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking template access'
    });
  }
};

// Middleware to check inventory management access
exports.checkInventoryAccess = async (req, res, next) => {
  try {
    const planLimits = req.user.getPlanLimits();

    if (!planLimits.inventoryManagement) {
      return res.status(403).json({
        success: false,
        message: 'Inventory Management is only available on Pro and Premium plans. Upgrade to track stock levels, get low stock alerts, and automate inventory.',
        upgrade: true,
        requiredPlan: 'pro'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking inventory access'
    });
  }
};
