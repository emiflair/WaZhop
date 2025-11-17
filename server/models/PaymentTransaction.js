const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // indexed via compound index below
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
    // unique creates its own index automatically
  },
  type: {
    type: String,
    enum: ['subscription', 'boost', 'renewal', 'upgrade'],
    required: true
    // indexed via compound index below
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'successful', 'failed', 'cancelled', 'abandoned'],
    default: 'initiated'
    // indexed via compound indexes below
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  paymentProvider: {
    type: String,
    enum: ['flutterwave', 'paystack', 'manual'],
    default: 'flutterwave'
  },
  // What was being purchased
  metadata: {
    plan: String,
    billingPeriod: String,
    productId: String,
    boostHours: Number,
    state: String,
    area: String,
    couponCode: String,
    discountApplied: Number,
    originalAmount: Number
  },
  // Payment flow tracking
  initiatedAt: {
    type: Date,
    default: Date.now
    // indexed via compound index below
  },
  redirectedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  // Provider response
  providerTransactionId: String,
  providerResponse: mongoose.Schema.Types.Mixed,
  paymentMethod: String, // card, bank_transfer, ussd, etc.
  // Error tracking
  errorMessage: String,
  errorCode: String,
  // Where user came from and should return to
  redirectUrl: String,
  returnUrl: String,
  // User agent and IP for fraud detection
  userAgent: String,
  ipAddress: String,
  // Verification attempts
  verificationAttempts: {
    type: Number,
    default: 0
  },
  lastVerificationAttempt: Date
}, {
  timestamps: true
});

// Indexes for common queries
paymentTransactionSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentTransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, initiatedAt: 1 }); // For finding abandoned payments

// Virtual for duration
paymentTransactionSchema.virtual('duration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.initiatedAt;
  }
  return null;
});

// Method to mark as abandoned if not completed within time limit
paymentTransactionSchema.statics.markAbandonedPayments = async function(minutesThreshold = 30) {
  const cutoffTime = new Date(Date.now() - minutesThreshold * 60 * 1000);
  
  const result = await this.updateMany(
    {
      status: 'initiated',
      initiatedAt: { $lt: cutoffTime }
    },
    {
      $set: { 
        status: 'abandoned',
        errorMessage: `Payment not completed within ${minutesThreshold} minutes`
      }
    }
  );
  
  return result;
};

// Get payment analytics
paymentTransactionSchema.statics.getAnalytics = async function(userId = null, days = 30) {
  const match = {
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (userId) {
    match.user = mongoose.Types.ObjectId(userId);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          status: '$status',
          type: '$type'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalAmount: '$totalAmount',
            avgAmount: '$avgAmount'
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
