const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const User = require('../models/User');
const Shop = require('../models/Shop');

// @desc    Diagnose shop ownership issues (admin only)
// @route   GET /api/admin/migrations/diagnose-shops
// @access  Private/Admin
router.get('/diagnose-shops', protect, isAdmin, async (req, res) => {
  try {
    const shops = await Shop.find().lean();
    const usersWithShops = await User.find({ shop: { $exists: true, $ne: null } }).lean();

    const issues = [];
    const shopToUsersMap = new Map();

    // Build shop-to-users map
    for (const user of usersWithShops) {
      const shopId = user.shop.toString();
      if (!shopToUsersMap.has(shopId)) {
        shopToUsersMap.set(shopId, []);
      }
      shopToUsersMap.get(shopId).push(user);
    }

    // Check for shops referenced by multiple users
    for (const [shopId, users] of shopToUsersMap.entries()) {
      if (users.length > 1) {
        const shop = shops.find(s => s._id.toString() === shopId);
        issues.push({
          type: 'MULTIPLE_REFERENCES',
          shopId,
          shopName: shop?.shopName,
          actualOwner: shop?.owner.toString(),
          users: users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email }))
        });
      }
    }

    // Check for mismatched ownership
    for (const user of usersWithShops) {
      const shop = shops.find(s => s._id.toString() === user.shop.toString());
      if (shop && shop.owner.toString() !== user._id.toString()) {
        issues.push({
          type: 'OWNERSHIP_MISMATCH',
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          shopId: shop._id.toString(),
          shopName: shop.shopName,
          actualOwner: shop.owner.toString()
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalShops: shops.length,
        usersWithShops: usersWithShops.length,
        issuesFound: issues.length
      },
      issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Diagnosis failed',
      error: error.message
    });
  }
});

// @desc    Fix user shop references (admin only)
// @route   POST /api/admin/migrations/fix-shop-references
// @access  Private/Admin
router.post('/fix-shop-references', protect, isAdmin, async (req, res) => {
  try {
    const usersWithShops = await User.find({ shop: { $exists: true, $ne: null } });
    
    let fixed = 0;
    let correct = 0;
    let errors = [];

    for (const user of usersWithShops) {
      try {
        const shop = await Shop.findById(user.shop);

        if (!shop) {
          user.shop = undefined;
          await user.save();
          fixed++;
          errors.push({ email: user.email, issue: 'Non-existent shop reference' });
          continue;
        }

        if (shop.owner.toString() !== user._id.toString()) {
          errors.push({
            email: user.email,
            userId: user._id.toString(),
            wrongShop: shop.shopName,
            wrongShopId: shop._id.toString(),
            actualOwner: shop.owner.toString()
          });
          user.shop = undefined;
          await user.save();
          fixed++;
        } else {
          correct++;
        }
      } catch (error) {
        errors.push({ email: user.email, error: error.message });
      }
    }

    res.json({
      success: true,
      summary: {
        total: usersWithShops.length,
        correct,
        fixed,
        errors: errors.length
      },
      details: errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// @desc    Reactivate primary shops for all users (admin only)
// @route   POST /api/admin/migrations/reactivate-primary-shops
// @access  Private/Admin
router.post('/reactivate-primary-shops', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    let reactivatedCount = 0;
    let skippedCount = 0;
    const details = [];

    // Process all users
    await Promise.all(users.map(async (user) => {
      // Get user's shops sorted by creation date (oldest first = primary)
      const shops = await Shop.find({ owner: user._id }).sort({ createdAt: 1 });

      if (shops.length === 0) {
        skippedCount++;
        return;
      }

      const [primaryShop] = shops;

      // Check if primary shop is inactive
      if (!primaryShop.isActive) {
        primaryShop.isActive = true;
        primaryShop.showBranding = user.plan === 'free';
        primaryShop.showWatermark = user.plan === 'free';
        await primaryShop.save();
        
        reactivatedCount++;
        details.push({
          userEmail: user.email,
          shopName: primaryShop.shopName,
          shopSlug: primaryShop.slug,
          action: 'reactivated'
        });
      } else {
        skippedCount++;
      }
    }));

    res.json({
      success: true,
      summary: {
        totalUsers: users.length,
        reactivated: reactivatedCount,
        alreadyActive: skippedCount
      },
      details: details.slice(0, 50) // Limit details to first 50 for response size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

module.exports = router;
