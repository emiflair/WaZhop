const express = require('express');

const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getShopOrders,
  getOrderStats
} = require('../controllers/orderController');

// Customer routes
router.post('/', createOrder); // Can be guest or authenticated
router.get('/my-orders', protect, getOrders); // Get customer's orders
router.get('/:id', getOrderById); // Get single order (with validation)

// Seller routes
router.get('/shop/:shopId', protect, getShopOrders); // Get all orders for a shop
router.get('/shop/:shopId/stats', protect, getOrderStats); // Get order statistics
router.patch('/:id/status', protect, updateOrderStatus); // Update order status
router.patch('/:id/cancel', cancelOrder); // Cancel order

module.exports = router;
