const express = require('express');
const {
  sendMessage,
  sendOrderConfirmation,
  sendOrderStatus,
  syncCatalog,
  sendCatalog,
  generateStatusShareLink,
  generateInquiryLink,
  sendPromotion,
  webhook,
  webhookVerify
} = require('../controllers/whatsappController');
const { protect } = require('../middlewares/auth');
const { checkPlanLimit } = require('../middlewares/planLimits');

const router = express.Router();

// Public routes
router.get('/share-status/:productId', generateStatusShareLink);
router.get('/inquiry-link/:productId', generateInquiryLink);

// Webhook routes (no auth, verified by signature)
router.get('/webhook', webhookVerify);
router.post('/webhook', webhook);

// Protected routes - Premium plan required
router.post('/send-message', protect, checkPlanLimit('whatsappApi'), sendMessage);
router.post('/order-confirmation/:orderId', protect, sendOrderConfirmation);
router.post('/order-status/:orderId', protect, sendOrderStatus);
router.post('/catalog/sync', protect, checkPlanLimit('whatsappApi'), syncCatalog);
router.post('/send-catalog', protect, checkPlanLimit('whatsappApi'), sendCatalog);
router.post('/send-promotion', protect, checkPlanLimit('whatsappApi'), sendPromotion);

module.exports = router;
