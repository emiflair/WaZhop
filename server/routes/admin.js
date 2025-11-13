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

// System activity
router.get('/activity', adminController.getSystemActivity);

module.exports = router;
