const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { asyncHandler, sendEmail } = require('../utils/helpers');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (can be guest or authenticated)
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    shopId,
    items,
    customer,
    shippingAddress,
    paymentMethod,
    customerNotes,
    total,
    subtotal,
    shippingFee,
    discount,
    couponCode,
    currency
  } = req.body;

  // Validation
  if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Shop and items are required' });
  }

  if (!customer || !customer.name || !customer.email || !customer.phone) {
    return res.status(400).json({ success: false, message: 'Customer information is required' });
  }

  // Verify shop exists
  const shop = await Shop.findById(shopId);
  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  // Verify products and calculate totals
  let calculatedSubtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
    }

    // Check stock availability
    if (product.inventory && product.inventory.trackQuantity) {
      if (product.inventory.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.inventory.quantity}`
        });
      }
    }

    const itemTotal = product.price * item.quantity;
    calculatedSubtotal += itemTotal;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productImage: product.images && product.images[0] ? product.images[0] : null,
      quantity: item.quantity,
      price: product.price,
      total: itemTotal
    });
  }

  // Create order
  const order = await Order.create({
    shop: shopId,
    customer: {
      user: req.user ? req.user._id : null,
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    },
    items: orderItems,
    subtotal: subtotal || calculatedSubtotal,
    shippingFee: shippingFee || 0,
    discount: discount || 0,
    couponCode: couponCode || null,
    total: total || (calculatedSubtotal + (shippingFee || 0)),
    currency: currency || shop.paymentSettings?.currency || 'NGN',
    shippingAddress,
    paymentMethod: paymentMethod || 'whatsapp',
    customerNotes,
    orderSource: 'web'
  });

  // Update product inventory
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product.inventory && product.inventory.trackQuantity) {
      product.inventory.quantity -= item.quantity;
      await product.save();
    }
  }

  // Send confirmation email
  try {
    const orderDetailsHtml = orderItems.map((item, idx) => `<li>${idx + 1}. ${item.productName} - Qty: ${item.quantity} - ${shop.paymentSettings?.currency || 'NGN'} ${item.total.toLocaleString()}</li>`).join('');

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;max-width:600px;margin:0 auto">
        <h2 style="color:#F97316">Order Confirmation</h2>
        <p>Hi ${customer.name},</p>
        <p>Thank you for your order from <strong>${shop.shopName}</strong>!</p>
        
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:20px 0">
          <h3 style="margin-top:0">Order #${order.orderNumber}</h3>
          <ul style="padding-left:20px">
            ${orderDetailsHtml}
          </ul>
          <p style="font-size:18px;font-weight:bold;margin:16px 0">
            Total: ${order.currency} ${order.total.toLocaleString()}
          </p>
        </div>
        
        <p>We'll send you another email once your order ships.</p>
        <p style="margin-top:24px">
          <a href="${process.env.APP_BASE_URL || 'http://localhost:3000'}/orders/${order._id}" 
             style="display:inline-block;background:#F97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
            Track Order
          </a>
        </p>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html
    });

    order.notificationsSent.orderConfirmation = true;
    await order.save();
  } catch (error) {
    console.error('Order confirmation email failed:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency
    }
  });
});

// @desc    Get customer's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'customer.user': req.user._id })
    .populate('shop', 'shopName slug branding')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    orders
  });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Public (with validation)
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('shop', 'shopName slug branding paymentSettings')
    .populate('items.product', 'name images');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Authorization: Only customer, shop owner, or admin can view
  if (req.user) {
    const shop = await Shop.findById(order.shop._id);
    const isOwner = shop && shop.owner.toString() === req.user._id.toString();
    const isCustomer = order.customer.user && order.customer.user.toString() === req.user._id.toString();

    if (!isOwner && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
  }

  res.json({ success: true, order });
});

// @desc    Get shop orders
// @route   GET /api/orders/shop/:shopId
// @access  Private (shop owner)
exports.getShopOrders = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  // Verify ownership
  if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { status, page = 1, limit = 20 } = req.query;
  const query = { shop: req.params.shopId };

  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('customer.user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    orders
  });
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (shop owner)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = await Order.findById(req.params.id).populate('shop');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Verify ownership
  const shop = await Shop.findById(order.shop._id);
  if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  order.status = status;

  // Set timestamps
  if (status === 'confirmed' && !order.confirmedAt) {
    order.confirmedAt = new Date();
  } else if (status === 'shipped' && !order.shippedAt) {
    order.shippedAt = new Date();
    // Send shipped notification
    // TODO: Implement email notification
  } else if (status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date();
    // Send delivered notification
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated',
    order
  });
});

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Public (customer or shop owner)
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Can only cancel if pending or confirmed
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();

  // Restore inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product && product.inventory && product.inventory.trackQuantity) {
      product.inventory.quantity += item.quantity;
      await product.save();
    }
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order
  });
});

// @desc    Get order statistics
// @route   GET /api/orders/shop/:shopId/stats
// @access  Private (shop owner)
exports.getOrderStats = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.shopId);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found' });
  }

  // Verify ownership
  if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const stats = await Order.aggregate([
    { $match: { shop: shop._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);

  const totalOrders = await Order.countDocuments({ shop: shop._id });
  const totalRevenue = await Order.aggregate([
    { $match: { shop: shop._id, paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      byStatus: stats
    }
  });
});
