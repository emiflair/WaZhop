const express = require('express');

const router = express.Router();
const {
  getSettings,
  updateSettings,
  getPublicSettings
} = require('../controllers/settingsController');

// Public route
router.get('/public', getPublicSettings);

// Admin routes (no auth for now as per admin panel setup)
router.get('/admin', getSettings);
router.put('/admin', updateSettings);

module.exports = router;
