const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const User = require('../models/User');
const Shop = require('../models/Shop');

// @desc    Fix user shop references (admin only)
// @route   POST /api/admin/migrations/fix-shop-references
// @access  Private/Admin
router.post('/fix-shop-references', protect, authorize('admin'), async (req, res) => {
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

module.exports = router;
