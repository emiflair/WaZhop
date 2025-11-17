const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Shop and Customer
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },

  customer: {
    // Can be registered user or guest
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },

  // Order Items
  items: [orderItemSchema],

  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },

  // Shipping Information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    fullAddress: String // Combined address for WhatsApp orders
  },

  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['whatsapp', 'flutterwave', 'paystack', 'bank_transfer', 'cash_on_delivery'],
    default: 'whatsapp'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentReference: String,
  paidAt: Date,

  // Order Source
  orderSource: {
    type: String,
    enum: ['web', 'whatsapp', 'api'],
    default: 'web'
  },

  // Notes
  customerNotes: String,
  sellerNotes: String,

  // Timestamps for tracking
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,

  // Notifications
  notificationsSent: {
    orderConfirmation: { type: Boolean, default: false },
    orderShipped: { type: Boolean, default: false },
    orderDelivered: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Generate unique order number
orderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `WZ${year}${month}${random}`;

    // Check if order number exists (very unlikely collision)
    const exists = await mongoose.model('Order').findOne({ orderNumber: this.orderNumber });
    if (exists) {
      this.orderNumber = `WZ${year}${month}${Math.floor(Math.random() * 100000)}`;
    }
  }
  next();
});

// Indexes for faster queries
orderSchema.index({ shop: 1, createdAt: -1 });
orderSchema.index({ 'customer.user': 1, createdAt: -1 });
// orderNumber already has unique index from schema definition
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
