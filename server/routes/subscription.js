const express = require('express');

const router = express.Router();
const {
  upgradePlan,
  renewPlan,
  toggleAutoRenew,
  cancelSubscription,
  getSubscriptionStatus
} = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// Subscription routes
router.post('/upgrade', upgradePlan);
router.post('/verify-payment', require('../controllers/subscriptionController').verifyPaymentAndUpgrade);

router.post('/renew', renewPlan);
router.patch('/auto-renew', toggleAutoRenew);
router.post('/cancel', cancelSubscription);
router.get('/status', getSubscriptionStatus);

module.exports = router;
