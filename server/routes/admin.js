const express = require('express');

const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/auth');

// All routes require authentication and admin privileges
router.use(protect, isAdmin);

// Platform statistics
router.get('/stats', adminController.getPlatformStats);

// User management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.patch('/users/:id/plan', adminController.updateUserPlan);
router.delete('/users/:id', adminController.deleteUser);

// Shop management
router.get('/shops', adminController.getAllShops);
router.delete('/shops/:id', adminController.deleteShop);

// Product management
router.get('/products', adminController.getAllProducts);
router.delete('/products/:id', adminController.deleteProduct);

// Order management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Revenue
router.get('/revenue', adminController.getRevenue);

// System activity
router.get('/activity', adminController.getSystemActivity);

module.exports = router;
