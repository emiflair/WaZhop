const PaymentTransaction = require('../models/PaymentTransaction');
const asyncHandler = require('../middlewares/asyncHandler');

// Track payment initiation
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { 
    transactionRef, 
    type, 
    amount, 
    currency = 'NGN',
    paymentProvider = 'flutterwave',
    metadata = {},
    redirectUrl,
    returnUrl 
  } = req.body;

  // Validate required fields
  if (!transactionRef || !type || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Transaction reference, type, and amount are required'
    });
  }

  // Check if transaction already exists
  const existing = await PaymentTransaction.findOne({ transactionRef });
  if (existing) {
    return res.json({
      success: true,
      message: 'Payment transaction already tracked',
      data: existing
    });
  }

  // Create payment transaction record
  const transaction = await PaymentTransaction.create({
    user: req.user._id,
    transactionRef,
    type,
    amount,
    currency,
    paymentProvider,
    metadata,
    redirectUrl,
    returnUrl,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.connection.remoteAddress,
    initiatedAt: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Payment initiated and tracked',
    data: transaction
  });
});

// Update payment status
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { transactionRef } = req.params;
  const { 
    status, 
    providerTransactionId, 
    providerResponse, 
    paymentMethod,
    errorMessage,
    errorCode 
  } = req.body;

  const transaction = await PaymentTransaction.findOne({ transactionRef });
  
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Payment transaction not found'
    });
  }

  // Update transaction
  transaction.status = status;
  
  if (providerTransactionId) {
    transaction.providerTransactionId = providerTransactionId;
  }
  
  if (providerResponse) {
    transaction.providerResponse = providerResponse;
  }
  
  if (paymentMethod) {
    transaction.paymentMethod = paymentMethod;
  }

  if (errorMessage) {
    transaction.errorMessage = errorMessage;
  }

  if (errorCode) {
    transaction.errorCode = errorCode;
  }

  // Set appropriate timestamp based on status
  const now = new Date();
  switch (status) {
    case 'successful':
      transaction.completedAt = now;
      break;
    case 'failed':
      transaction.failedAt = now;
      break;
    case 'cancelled':
      transaction.cancelledAt = now;
      break;
    case 'pending':
      transaction.redirectedAt = now;
      break;
  }

  await transaction.save();

  res.json({
    success: true,
    message: 'Payment status updated',
    data: transaction
  });
});

// Get user's payment history
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { status, type, limit = 50, page = 1 } = req.query;

  const query = { user: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    PaymentTransaction.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
});

// Get payment analytics
exports.getPaymentAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const userId = req.user.role === 'admin' ? null : req.user._id;
  const analytics = await PaymentTransaction.getAnalytics(userId, parseInt(days));

  // Get summary stats
  const match = {
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  };
  
  if (userId) {
    match.user = userId;
  }

  const [summary] = await PaymentTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulCount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        abandonedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
        },
        successfulAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'successful'] }, '$amount', 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: summary || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        abandonedCount: 0,
        successfulAmount: 0
      },
      breakdown: analytics
    }
  });
});

// Get specific transaction details
exports.getTransactionDetails = asyncHandler(async (req, res) => {
  const { transactionRef } = req.params;

  const transaction = await PaymentTransaction.findOne({ 
    transactionRef,
    ...(req.user.role !== 'admin' && { user: req.user._id })
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    data: transaction
  });
});

// Admin: Mark abandoned payments
exports.markAbandonedPayments = asyncHandler(async (req, res) => {
  const { minutesThreshold = 30 } = req.body;

  const result = await PaymentTransaction.markAbandonedPayments(minutesThreshold);

  res.json({
    success: true,
    message: `Marked ${result.modifiedCount} payments as abandoned`,
    data: result
  });
});
