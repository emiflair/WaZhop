const express = require('express');
const router = express.Router();
const {
  verifyActivationToken,
  activateStore
} = require('../controllers/storeActivationController');

// Verify activation token (public)
router.get('/verify/:shopId/:token', verifyActivationToken);

// Activate store (public)
router.post('/:shopId/:token', activateStore);

module.exports = router;
