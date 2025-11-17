const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth');
const {
  initiatePayment,
  updatePaymentStatus,
  getPaymentHistory,
  getPaymentAnalytics,
  getTransactionDetails,
  markAbandonedPayments
} = require('../controllers/paymentController');

// Protect all routes
router.use(protect);

// User routes
router.post('/initiate', initiatePayment);
router.patch('/:transactionRef/status', updatePaymentStatus);
router.get('/history', getPaymentHistory);
router.get('/analytics', getPaymentAnalytics);
router.get('/:transactionRef', getTransactionDetails);

// Admin only
router.post('/abandoned/mark', restrictTo('admin'), markAbandonedPayments);

module.exports = router;
