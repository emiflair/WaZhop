const asyncHandler = require('express-async-handler');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const whatsappService = require('../utils/whatsapp');

// @desc    Send WhatsApp message to customer
// @route   POST /api/whatsapp/send-message
// @access  Private (Shop Owner - Premium Plan)
exports.sendMessage = asyncHandler(async (req, res) => {
  const { to, message, type = 'text' } = req.body;
  const shop = await Shop.findOne({ owner: req.user._id });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Check if user has premium plan
  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp Business API is only available for Premium users');
  }

  // Validate phone number format
  if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
    res.status(400);
    throw new Error('Invalid phone number format. Use international format (e.g., +2348012345678)');
  }

  const result = await whatsappService.sendMessage(to, message);

  if (result.success) {
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Message sent successfully'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to send WhatsApp message');
  }
});

// @desc    Send order confirmation via WhatsApp
// @route   POST /api/whatsapp/order-confirmation/:orderId
// @access  Private (Shop Owner)
exports.sendOrderConfirmation = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('shop');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Verify shop ownership
  if (order.shop.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Check premium plan
  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp Business API is only available for Premium users');
  }

  const orderDetails = {
    orderId: order._id,
    total: order.totalAmount,
    itemCount: order.items.length,
    trackingUrl: `${process.env.CLIENT_URL}/orders/${order._id}`
  };

  const result = await whatsappService.sendOrderConfirmation(
    order.customer.phone,
    orderDetails
  );

  if (result.success) {
    order.whatsappNotificationSent = true;
    await order.save();

    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Order confirmation sent via WhatsApp'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to send order confirmation');
  }
});

// @desc    Send order status update
// @route   POST /api/whatsapp/order-status/:orderId
// @access  Private (Shop Owner)
exports.sendOrderStatus = asyncHandler(async (req, res) => {
  const { status, additionalInfo } = req.body;
  const order = await Order.findById(req.params.orderId).populate('shop');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.shop.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp Business API is only available for Premium users');
  }

  const result = await whatsappService.sendOrderStatusUpdate(
    order.customer.phone,
    order._id,
    status,
    additionalInfo
  );

  if (result.success) {
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Status update sent via WhatsApp'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to send status update');
  }
});

// @desc    Create/Update WhatsApp Business Catalog
// @route   POST /api/whatsapp/catalog/sync
// @access  Private (Shop Owner - Premium Plan)
exports.syncCatalog = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp Business Catalog is only available for Premium users');
  }

  // Get all active products
  const products = await Product.find({ shop: shop._id, status: 'active' });

  if (products.length === 0) {
    res.status(400);
    throw new Error('No active products found to sync');
  }

  // Format products for WhatsApp catalog
  const catalogProducts = products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    currency: 'NGN',
    inStock: product.stock > 0,
    image: product.images[0],
    url: `${process.env.CLIENT_URL}/${shop.slug}/products/${product._id}`
  }));

  const result = await whatsappService.createCatalog(shop.shopName, catalogProducts);

  if (result.success) {
    // Save catalog ID to shop
    shop.whatsappCatalogId = result.catalogId;
    shop.whatsappCatalogSyncedAt = new Date();
    await shop.save();

    res.json({
      success: true,
      catalogId: result.catalogId,
      productsCount: products.length,
      message: 'WhatsApp catalog synced successfully'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to sync catalog');
  }
});

// @desc    Send catalog to customer
// @route   POST /api/whatsapp/send-catalog
// @access  Private (Shop Owner - Premium Plan)
exports.sendCatalog = asyncHandler(async (req, res) => {
  const { to, productIds } = req.body;
  const shop = await Shop.findOne({ owner: req.user._id });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp Business Catalog is only available for Premium users');
  }

  if (!shop.whatsappCatalogId) {
    res.status(400);
    throw new Error('Please sync your catalog first');
  }

  const result = await whatsappService.sendCatalogMessage(
    to,
    shop.whatsappCatalogId,
    productIds || []
  );

  if (result.success) {
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Catalog sent successfully'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to send catalog');
  }
});

// @desc    Generate WhatsApp Status share link for product
// @route   GET /api/whatsapp/share-status/:productId
// @access  Public
exports.generateStatusShareLink = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).populate('shop');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const productUrl = `${process.env.CLIENT_URL}/${product.shop.slug}/products/${product._id}`;
  const shareLink = whatsappService.generateStatusShareLink(
    productUrl,
    product.name,
    product.images[0]
  );

  res.json({
    success: true,
    shareLink,
    webShareLink: `https://wa.me/?text=${encodeURIComponent(
      `Check out ${product.name}! 🛍️\n${productUrl}`
    )}`
  });
});

// @desc    Generate WhatsApp inquiry link for product
// @route   GET /api/whatsapp/inquiry-link/:productId
// @access  Public
exports.generateInquiryLink = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).populate('shop');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (!product.shop.whatsappNumber) {
    res.status(400);
    throw new Error('Shop WhatsApp number not configured');
  }

  const productUrl = `${process.env.CLIENT_URL}/${product.shop.slug}/products/${product._id}`;
  const inquiryLink = whatsappService.generateProductInquiryLink(
    product.shop.whatsappNumber,
    product.name,
    productUrl
  );

  res.json({
    success: true,
    inquiryLink
  });
});

// @desc    Send promotional message
// @route   POST /api/whatsapp/send-promotion
// @access  Private (Shop Owner - Premium Plan)
exports.sendPromotion = asyncHandler(async (req, res) => {
  const { to, promoDetails } = req.body;
  const shop = await Shop.findOne({ owner: req.user._id });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  if (req.user.plan !== 'premium') {
    res.status(403);
    throw new Error('WhatsApp promotional messages are only available for Premium users');
  }

  const result = await whatsappService.sendPromotion(to, {
    ...promoDetails,
    shopUrl: `${process.env.CLIENT_URL}/${shop.slug}`
  });

  if (result.success) {
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Promotion sent successfully'
    });
  } else {
    res.status(500);
    throw new Error(result.error || 'Failed to send promotion');
  }
});

// @desc    WhatsApp webhook for receiving messages
// @route   POST /api/whatsapp/webhook
// @access  Public (verified by signature)
exports.webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!whatsappService.verifyWebhookSignature(signature, JSON.stringify(req.body))) {
    res.status(403);
    throw new Error('Invalid webhook signature');
  }

  // Handle incoming messages (for future chatbot integration)
  const { entry } = req.body;

  if (entry && entry[0].changes) {
    const change = entry[0].changes[0];
    if (change.value.messages) {
      // Process incoming messages here
      console.log('Received WhatsApp message:', change.value.messages[0]);
    }
  }

  res.status(200).json({ success: true });
});

// @desc    WhatsApp webhook verification
// @route   GET /api/whatsapp/webhook
// @access  Public
exports.webhookVerify = asyncHandler(async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
