const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  // Optional single image attached by the reviewer
  image: {
    url: { type: String },
    publicId: { type: String }
  },
  isVerified: {
    type: Boolean,
    default: false // Could be set to true if they purchased through a future order system
  },
  isApproved: {
    type: Boolean,
    default: true // Shop owner can moderate reviews
  },
  helpful: {
    type: Number,
    default: 0 // Number of people who found this review helpful
  }
}, {
  timestamps: true
});

// Calculate average rating for a product
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const result = await this.aggregate([
    {
      $match: { 
        product: productId,
        isApproved: true 
      }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: Math.round(result[0].avgRating * 10) / 10,
      numReviews: result[0].numReviews
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: 0,
      numReviews: 0
    });
  }
};

// Update average rating after save
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.product);
});

// Update average rating after remove
reviewSchema.post('deleteOne', { document: true, query: false }, function() {
  this.constructor.calculateAverageRating(this.product);
});

// Compound index to prevent duplicate reviews from same email/product (optional)
reviewSchema.index({ product: 1, customerEmail: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { customerEmail: { $exists: true, $ne: '' } }
});

module.exports = mongoose.model('Review', reviewSchema);
