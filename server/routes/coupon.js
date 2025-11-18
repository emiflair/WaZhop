const express = require('express');

const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, isAdmin } = require('../middlewares/auth');

// Admin-only routes
router.post('/', protect, isAdmin, couponController.createCoupon);
router.get('/', protect, isAdmin, couponController.getAllCoupons);
router.get('/stats', protect, isAdmin, couponController.getCouponStats);
router.patch('/:id/toggle', protect, isAdmin, couponController.toggleCoupon);
router.delete('/:id', protect, isAdmin, couponController.deleteCoupon);

// User routes (any authenticated user can validate/apply coupons during purchase)
router.post('/validate', protect, couponController.validateCoupon);
router.post('/apply', protect, couponController.applyCoupon);

// Product order coupon validation (no auth required for guest checkout)
router.post('/validate-product', couponController.validateProductCoupon);

module.exports = router;
