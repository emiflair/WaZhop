const Review = require('../models/Review');
const Product = require('../models/Product');
const { asyncHandler } = require('../utils/helpers');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

  const reviews = await Review.find({ 
    product: productId,
    isApproved: true 
  })
    // Do not expose customerEmail publicly
    .select('-customerEmail -__v')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Review.countDocuments({ 
    product: productId,
    isApproved: true 
  });

  res.status(200).json({
    success: true,
    data: reviews,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, customerName, customerEmail, rating, comment } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already reviewed (if email provided)
  if (customerEmail) {
    const existingReview = await Review.findOne({
      product: productId,
      customerEmail: customerEmail
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
  }

  // Create review
  const review = await Review.create({
    product: productId,
    shop: product.shop,
    customerName,
    customerEmail: customerEmail || undefined,
    rating,
    comment
  });

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review submitted successfully'
  });
});

// @desc    Get shop reviews (for shop owner)
// @route   GET /api/reviews/shop/my
// @access  Private
exports.getMyShopReviews = asyncHandler(async (req, res) => {
  const { shopId } = req.query;
  const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

  // Get shop - use provided shopId or first active shop
  const Shop = require('../models/Shop');
  let shop;
  if (shopId) {
    shop = await Shop.findOne({ _id: shopId, owner: req.user.id });
  } else {
    shop = await Shop.findOne({ owner: req.user.id, isActive: true });
  }

  if (!shop) {
    return res.status(404).json({
      success: false,
      message: 'Shop not found'
    });
  }

  const reviews = await Review.find({ shop: shop._id })
    .populate('product', 'name images')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const count = await Review.countDocuments({ shop: shop._id });

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { shop: shop._id, isApproved: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const avgRating = await Review.aggregate([
    { $match: { shop: shop._id, isApproved: true } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        total: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count,
    stats: {
      averageRating: avgRating[0]?.average || 0,
      totalReviews: avgRating[0]?.total || 0,
      distribution: ratingStats
    }
  });
});

// @desc    Approve/reject review
// @route   PUT /api/reviews/:id/approve
// @access  Private
exports.approveReview = asyncHandler(async (req, res) => {
  const { isApproved } = req.body;
  
  const review = await Review.findById(req.params.id).populate('shop');
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the shop
  if (review.shop.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to moderate this review'
    });
  }

  review.isApproved = isApproved;
  await review.save();

  res.status(200).json({
    success: true,
    data: review,
    message: isApproved ? 'Review approved' : 'Review rejected'
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('shop');
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if user owns the shop
  if (review.shop.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Public
exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  review.helpful += 1;
  await review.save();

  res.status(200).json({
    success: true,
    data: review
  });
});
