const Coupon = require('../models/Coupon');
const User = require('../models/User');

// Create new coupon (admin only)
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      applicablePlans,
      maxUses,
      validFrom,
      validUntil,
      description
    } = req.body;

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        message: 'Discount value must be greater than 0'
      });
    }

    // Generate code if not provided
    const couponCode = code || Coupon.generateCode();

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: couponCode.toUpperCase(),
      discountType,
      discountValue,
      applicablePlans: applicablePlans || ['pro', 'premium'],
      maxUses,
      validFrom: validFrom || Date.now(),
      validUntil,
      description,
      createdBy: req.user.id
    });

    await coupon.save();

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicablePlans: coupon.applicablePlans,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive
      }
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

// Get all coupons (admin only)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      coupons: coupons.map((coupon) => ({
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicablePlans: coupon.applicablePlans,
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive,
        createdBy: coupon.createdBy,
        description: coupon.description,
        createdAt: coupon.createdAt
      }))
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, plan } = req.body;

    if (!code || !plan) {
      return res.status(400).json({ message: 'Coupon code and plan are required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check if coupon is valid
    const validation = coupon.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Check if applicable to the plan
    if (!coupon.applicablePlans.includes(plan)) {
      return res.status(400).json({
        message: `This coupon is not applicable to ${plan} plan`
      });
    }

    // Check if user already used this coupon
    const alreadyUsed = coupon.usedBy.some(
      (usage) => usage.user.toString() === req.user.id
    );

    if (alreadyUsed) {
      return res.status(400).json({ message: 'You have already used this coupon' });
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
};

// Apply coupon to purchase
exports.applyCoupon = async (req, res) => {
  try {
    const { code, plan, originalAmount } = req.body;

    if (!code || !plan || !originalAmount) {
      return res.status(400).json({
        message: 'Coupon code, plan, and amount are required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Validate coupon
    const validation = coupon.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Check if applicable to the plan
    if (!coupon.applicablePlans.includes(plan)) {
      return res.status(400).json({
        message: `This coupon is not applicable to ${plan} plan`
      });
    }

    // Check if user already used this coupon
    const alreadyUsed = coupon.usedBy.some(
      (usage) => usage.user.toString() === req.user.id
    );

    if (alreadyUsed) {
      return res.status(400).json({ message: 'You have already used this coupon' });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(originalAmount);

    // Record usage
    coupon.usedBy.push({
      user: req.user.id,
      usedAt: new Date(),
      plan,
      originalAmount: discount.originalAmount,
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount
    });

    coupon.usedCount += 1;
    await coupon.save();

    res.json({
      message: 'Coupon applied successfully',
      discount: {
        ...discount,
        code: coupon.code
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
};

// Toggle coupon active status
exports.toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.isActive = isActive;
    await coupon.save();

    res.json({
      message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        isActive: coupon.isActive
      }
    });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({ message: 'Error toggling coupon', error: error.message });
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};

// Get coupon statistics
exports.getCouponStats = async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const expiredCoupons = await Coupon.countDocuments({
      validUntil: { $lt: new Date() }
    });

    const coupons = await Coupon.find();
    const totalUsage = coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);
    const totalDiscountGiven = coupons.reduce((sum, coupon) => {
      const couponTotal = coupon.usedBy.reduce(
        (subSum, usage) => subSum + usage.discountAmount,
        0
      );
      return sum + couponTotal;
    }, 0);

    res.json({
      stats: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsage,
        totalDiscountGiven: Math.round(totalDiscountGiven)
      }
    });
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};
