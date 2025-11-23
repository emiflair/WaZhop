import { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiPackage, FiShoppingCart, FiCreditCard, FiShare2 } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { FaThumbsUp } from 'react-icons/fa';
import StarRating from './StarRating';
import { reviewAPI, productAPI } from '../utils/api';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

const ProductDetailModal = ({ product, shop, shopProducts, onClose, onWhatsAppClick, onSelectProduct, showImageModal, setShowImageModal, modalImageIndex, setModalImageIndex }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Cart functionality
  const { addToCart } = useCart();
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    comment: ''
  });

  const primaryColor = shop?.theme?.primaryColor || '#000000';
  const images = Array.isArray(product?.images) ? product.images : [];

  // Reset selected image whenever the product changes to avoid index issues
  useEffect(() => {
    setSelectedImage(0);
    // Scroll to top when product changes or modal opens
    window.scrollTo(0, 0);
  }, [product?._id]);
  
  // Calculate stock status
  const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
  const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= (product.lowStockThreshold || 5);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPage, product?._id]);

  // Fetch related products by category (exclude current)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category) {
        setRelatedProducts([]);
        return;
      }
      try {
        setLoadingRelated(true);
        
        // For storefront: if shopProducts array provided, filter from there
        // For marketplace: fetch from marketplace API
        if (shopProducts && Array.isArray(shopProducts)) {
          // Storefront mode: filter products from the same shop
          const filtered = shopProducts
            .filter((p) => p._id !== product._id && p.category === product.category)
            .slice(0, 8);
          setRelatedProducts(filtered);
        } else {
          // Marketplace mode: fetch from API
          const list = await productAPI.getMarketplaceProducts({ category: product.category, limit: 12 });
          const items = Array.isArray(list) ? list : [];
          const filtered = items.filter((p) => p._id !== product._id);
          setRelatedProducts(filtered.slice(0, 8));
        }
      } catch (e) {
        console.error('Failed to load related products', e);
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product?._id, product?.category, shopProducts]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      if (!product?._id) return;
      const data = await reviewAPI.getProductReviews(product._id, { page: reviewPage, limit: 5 });
      // API interceptor returns just the array (data) for reviews endpoint.
      // Fallback if a future change returns an object.
      const list = Array.isArray(data) ? data : (Array.isArray(data?.reviews) ? data.reviews : []);
      const total = Array.isArray(data)
        ? (typeof data.total === 'number' ? data.total : list.length)
        : (typeof data?.total === 'number' ? data.total : (typeof data?.totalReviews === 'number' ? data.totalReviews : list.length));
      setReviews(list);
      setTotalReviews(total);
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
        productId: product._id,
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

  const handleShareToWhatsApp = () => {
    const currency = shop?.paymentSettings?.currency || 'NGN';
    const formattedPrice = formatPrice(product?.price, currency);
    const productUrl = window.location.href.split('?')[0]; // Get clean URL without query params
    const desc = typeof product?.description === 'string' ? product.description : '';

    const shareMessage = encodeURIComponent(
      `Check out this product from ${shop?.shopName || 'this shop'}!\n\n` +
      `${product?.name || ''}\n` +
      `Price: ${formattedPrice}\n\n` +
      `${desc.substring(0, 150)}${desc.length > 150 ? '...' : ''}\n\n` +
      `View here: ${productUrl}`
    );

    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
    toast.success('Opening WhatsApp to share product');
  };

  // Fallback for WhatsApp order if parent did not provide a handler
  const handleOrderOnWhatsApp = async () => {
    if (typeof onWhatsAppClick === 'function') {
      onWhatsAppClick(product);
      return;
    }
    try {
      const number = shop?.owner?.whatsapp || product?.shop?.owner?.whatsapp;
      if (!number) {
        toast.error('Seller WhatsApp not available');
        return;
      }
      const currency = shop?.paymentSettings?.currency || 'NGN';
      const formattedPrice = formatPrice(product?.price, currency);
      const message = encodeURIComponent(
        `Hello! I'm interested in your product: ${product?.name}\nPrice: ${formattedPrice}`
      );
      const link = `https://wa.me/${String(number).replace(/\D/g, '')}?text=${message}`;
      window.open(link, '_blank');
      // Track click (non-blocking)
  try { await productAPI.trackClick(product._id); } catch (e) { /* no-op */ }
    } catch (err) {
      console.error('WhatsApp order failed', err);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="product-detail-modal-content bg-white dark:bg-gray-900 dark:text-gray-100 rounded-none sm:rounded-lg max-w-6xl w-full sm:my-8 relative sm:max-h-[90vh] sm:overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky sm:absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiX size={20} className="sm:w-6 sm:h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 p-3 sm:p-6">
          {/* Left side - Image Gallery */}
          <div>
            {/* Main Image */}
            <div 
              className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3 sm:mb-4 h-64 sm:h-80 md:h-96 cursor-pointer"
              onClick={() => {
                if (images.length > 0 && setShowImageModal && setModalImageIndex) {
                  setModalImageIndex(selectedImage);
                  setShowImageModal(true);
                }
              }}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={(images[selectedImage] && (images[selectedImage].url || images[selectedImage].secure_url)) || ''}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-90 rounded-full p-1.5 sm:p-2 hover:bg-opacity-100 dark:hover:bg-opacity-100"
                      >
                        <FiChevronLeft size={20} className="sm:w-6 sm:h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-90 rounded-full p-1.5 sm:p-2 hover:bg-opacity-100 dark:hover:bg-opacity-100"
                      >
                        <FiChevronRight size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiPackage size={48} className="sm:w-16 sm:h-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img src={(img && (img.url || img.secure_url)) || ''} alt="" className="w-full h-16 sm:h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Product Info */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 pr-8">{product.name}</h2>

            {/* Rating */}
            {product.numReviews > 0 && (
              <div className="mb-3 sm:mb-4">
                <StarRating 
                  rating={product.averageRating || 0} 
                  count={product.numReviews} 
                  size={16}
                  showCount={true}
                />
              </div>
            )}

            {/* Price */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-baseline gap-2 sm:gap-3 mb-2 flex-wrap">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(product.price, shop?.paymentSettings?.currency || 'NGN')}
                </p>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <p className="text-base sm:text-xl text-gray-400 line-through">
                      {formatPrice(product.comparePrice, shop?.paymentSettings?.currency || 'NGN')}
                    </p>
                    <span className="bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded">
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
                <span className="text-primary-600 text-sm font-medium">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-primary-600 text-sm font-medium">In Stock</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <button
                onClick={() => {
                  addToCart(product, shop, 1);
                  toast.success('Added to cart!');
                }}
                disabled={isOutOfStock}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiShoppingCart size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                Add to Cart
              </button>
              
              {/* Payment Button - Show if payment provider is configured */}
              {shop?.paymentSettings?.provider && shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink && (
                <button
                  onClick={() => {
                    const paymentLink = shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink;
                    if (paymentLink) {
                      // Append product details to payment link
                      const urlWithParams = new URL(paymentLink);
                      urlWithParams.searchParams.append('product', product.name);
                      urlWithParams.searchParams.append('amount', product.price);
                      window.open(urlWithParams.toString(), '_blank');
                    } else {
                      toast.error('Payment link not configured');
                    }
                  }}
                  disabled={isOutOfStock}
                  className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCreditCard size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  {isOutOfStock ? 'Out of Stock' : 'Pay Now'}
                </button>
              )}
              
              {/* WhatsApp Button - Show if payment not configured or if negotiation is allowed */}
              {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
                <button
                  onClick={handleOrderOnWhatsApp}
                  disabled={isOutOfStock}
                  className="btn btn-whatsapp w-full flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-white"
                >
                  <IoLogoWhatsapp size={20} className="sm:w-6 sm:h-6" />
                  <span className="truncate">{isOutOfStock ? 'Out of Stock' : (shop?.paymentSettings?.provider ? 'Negotiate on WhatsApp' : 'Order on WhatsApp')}</span>
                </button>
              )}
              
              {/* Share to WhatsApp Button */}
              <button
                onClick={handleShareToWhatsApp}
                className="btn w-full flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:bg-transparent dark:hover:bg-primary-900/20"
              >
                <FiShare2 size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                Share on WhatsApp
              </button>
            </div>

            {/* Description */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Description</h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Variants */}
            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Available Options</h3>
                {product.variants.map((variant, idx) => (
                  <div key={idx} className="mb-3">
                    <p className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{variant.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(variant.options) && variant.options.map((option, optIdx) => (
                        <div key={optIdx} className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm">
                          <span className="font-medium">{option.value}</span>
                          {option.price && option.price !== product.price && (
                            <span className="ml-2 text-gray-600 dark:text-gray-400">{formatPrice(option.price, shop?.paymentSettings?.currency || 'NGN')}</span>
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
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Related Products</h3>
            {product?.category && (
              <span className="text-sm text-gray-500 capitalize">in {product.category}</span>
            )}
          </div>
          {loadingRelated ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : !Array.isArray(relatedProducts) || relatedProducts.length === 0 ? (
            <p className="text-gray-500">No related products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <button
                  key={rp._id}
                  onClick={() => {
                    if (typeof onSelectProduct === 'function') {
                      onSelectProduct(rp);
                    }
                  }}
                  className="text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <img src={rp.images?.[0]?.url ?? rp.images?.[0] ?? ''} alt={rp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2 mb-1">{rp.name}</p>
                    <p className="text-primary-600 dark:text-primary-400 font-semibold">{formatPrice(rp.price, 'NGN')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image Lightbox Modal */}
        {showImageModal && images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[2000] flex items-center justify-center" onClick={() => setShowImageModal(false)}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <FiX size={32} />
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute left-4 text-white hover:text-gray-300 z-10"
                >
                  <FiChevronLeft size={48} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImageIndex((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-4 text-white hover:text-gray-300 z-10"
                >
                  <FiChevronRight size={48} />
                </button>
              </>
            )}
            
            <img
              src={(images[modalImageIndex] && (images[modalImageIndex].url || images[modalImageIndex].secure_url)) || ''}
              alt={product.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {modalImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        )}

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
            <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Write Your Review</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={reviewForm.customerEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                  rows="4"
                  placeholder="Share your experience with this product... (minimum 10 characters)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          ) : !Array.isArray(reviews) || reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.isArray(reviews) && reviews.map((review) => (
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
          {typeof totalReviews === 'number' && totalReviews > 5 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                disabled={reviewPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {reviewPage} of {Math.ceil((typeof totalReviews === 'number' ? totalReviews : 0) / 5)}
              </span>
              <button
                onClick={() => setReviewPage(p => p + 1)}
                disabled={reviewPage >= Math.ceil((typeof totalReviews === 'number' ? totalReviews : 0) / 5)}
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
