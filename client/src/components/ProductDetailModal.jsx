import { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiPackage, FiShoppingCart } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { FaThumbsUp } from 'react-icons/fa';
import StarRating from './StarRating';
import { reviewAPI } from '../utils/api';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';

const ProductDetailModal = ({ product, shop, onClose, onWhatsAppClick }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Cart functionality
  const { addToCart } = useCart();
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    comment: ''
  });

  const primaryColor = shop.theme?.primaryColor || '#000000';
  const images = product.images || [];
  
  // Calculate stock status
  const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
  const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= (product.lowStockThreshold || 5);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPage]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await reviewAPI.getProductReviews(product._id, { page: reviewPage, limit: 5 });
      setReviews(data.reviews);
      setTotalReviews(data.totalReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (reviewForm.comment.length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewAPI.createReview({
        product: product._id,
        shop: shop._id,
        ...reviewForm
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewForm({ customerName: '', customerEmail: '', rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await reviewAPI.markHelpful(reviewId);
      toast.success('Thank you for your feedback!');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to mark review as helpful');
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
        >
          <FiX size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Left side - Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImage].url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100"
                      >
                        <FiChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100"
                      >
                        <FiChevronRight size={24} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiPackage size={64} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Product Info */}
          <div>
            <h2 className="text-3xl font-bold mb-3">{product.name}</h2>

            {/* Rating */}
            {product.numReviews > 0 && (
              <div className="mb-4">
                <StarRating 
                  rating={product.averageRating || 0} 
                  count={product.numReviews} 
                  size={20}
                  showCount={true}
                />
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                  ₦{product.price.toLocaleString()}
                </p>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <p className="text-xl text-gray-400 line-through">
                      ₦{product.comparePrice.toLocaleString()}
                    </p>
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                      -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              {isOutOfStock ? (
                <span className="inline-block bg-gray-800 text-white text-sm font-semibold px-3 py-1 rounded">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-block bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded">
                  Only {product.stock} left - Order soon!
                </span>
              ) : product.stock !== null ? (
                <span className="text-green-600 text-sm font-medium">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-green-600 text-sm font-medium">In Stock</span>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Available Options</h3>
                {product.variants.map((variant, idx) => (
                  <div key={idx} className="mb-3">
                    <p className="font-medium text-sm text-gray-700 mb-2">{variant.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option, optIdx) => (
                        <div key={optIdx} className="border border-gray-300 rounded px-3 py-2 text-sm">
                          <span className="font-medium">{option.value}</span>
                          {option.price && option.price !== product.price && (
                            <span className="ml-2 text-gray-600">₦{option.price.toLocaleString()}</span>
                          )}
                          {option.stock !== undefined && option.stock === 0 && (
                            <span className="ml-2 text-red-500 text-xs">(Out of stock)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  addToCart(product, shop, 1);
                  toast.success('Added to cart!');
                }}
                disabled={isOutOfStock}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShoppingCart size={22} />
                Add to Cart
              </button>
              
              <button
                onClick={() => onWhatsAppClick(product)}
                disabled={isOutOfStock}
                className="btn btn-whatsapp w-full flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <IoLogoWhatsapp size={24} />
                {isOutOfStock ? 'Out of Stock' : 'Order on WhatsApp'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Customer Reviews</h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn btn-secondary"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Write Your Review</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={reviewForm.customerEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <StarRating
                  rating={reviewForm.rating}
                  size={28}
                  interactive={true}
                  showCount={false}
                  onChange={(rating) => setReviewForm({ ...reviewForm, rating })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Share your experience with this product... (minimum 10 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewForm.comment.length}/1000 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="btn btn-primary disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-lg">{review.customerName}</p>
                      <StarRating rating={review.rating} size={16} showCount={false} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-line">{review.comment}</p>
                  <button
                    onClick={() => handleMarkHelpful(review._id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                  >
                    <FaThumbsUp size={14} />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalReviews > 5 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                disabled={reviewPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {reviewPage} of {Math.ceil(totalReviews / 5)}
              </span>
              <button
                onClick={() => setReviewPage(p => p + 1)}
                disabled={reviewPage >= Math.ceil(totalReviews / 5)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
