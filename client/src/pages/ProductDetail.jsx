import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { productAPI, shopAPI, reviewAPI } from '../utils/api';
import StarRating from '../components/StarRating';
import { FiChevronLeft, FiChevronRight, FiPackage, FiCreditCard, FiShare2 } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';
import SingleImageUpload from '../components/SingleImageUpload';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    comment: '',
    imageFile: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const p = await productAPI.getProduct(id);
        const prod = p?.data || p; // interceptor may return data directly
        setProduct(prod);
        // Fetch full shop details (logo/profile) by slug
        if (prod?.shop?.slug) {
          try {
            const s = await shopAPI.getShopBySlug(prod.shop.slug);
            setShop(s?.shop || s?.data?.shop || s);
          } catch (e) {
            // fallback to shop from product
            setShop(prod.shop);
          }
        }
      } catch (e) {
        setError(e.userMessage || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
    // reset image on id change
    setSelectedImage(0);
  }, [id]);

  // fetch related products and reviews when product changes
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category) return;
      try {
        setLoadingRelated(true);
        const list = await productAPI.getMarketplaceProducts({ category: product.category, limit: 12 });
        const items = Array.isArray(list) ? list : [];
        setRelatedProducts(items.filter((p) => p._id !== product._id).slice(0, 8));
      } catch {
        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    };
    const fetchReviews = async () => {
      if (!product?._id) return;
      try {
        const data = await reviewAPI.getProductReviews(product._id, { page: reviewPage, limit: 5 });
        const list = Array.isArray(data) ? data : (Array.isArray(data?.reviews) ? data.reviews : []);
        const total = Array.isArray(data) ? (typeof data.total === 'number' ? data.total : list.length) : (typeof data?.total === 'number' ? data.total : (typeof data?.totalReviews === 'number' ? data.totalReviews : list.length));
        setReviews(list);
        setTotalReviews(total);
      } catch (e) {
        // ignore
      }
    };
    fetchRelated();
    fetchReviews();
  }, [product?._id, product?.category, reviewPage]);

  const images = useMemo(() => (Array.isArray(product?.images) ? product.images : []), [product]);
  const currency = shop?.paymentSettings?.currency || 'NGN';
  const primaryColor = shop?.theme?.primaryColor || '#16a34a';

  const isOutOfStock = !product?.inStock || (product?.stock !== null && product?.stock === 0);
  const isLowStock = !isOutOfStock && product?.stock !== null && product?.stock <= (product?.lowStockThreshold || 5);

  const handleOrderOnWhatsApp = async () => {
    try {
      const number = shop?.owner?.whatsapp || product?.shop?.owner?.whatsapp;
      if (!number) {
        toast.error('Seller WhatsApp not available');
        return;
      }
      const msg = encodeURIComponent(`Hello! I'm interested in your product: ${product?.name}\nPrice: ${formatPrice(product?.price, currency)}`);
      const link = `https://wa.me/${String(number).replace(/\D/g, '')}?text=${msg}`;
      window.open(link, '_blank');
      try { await productAPI.trackClick(product._id); } catch (e) { /* no-op */ }
    } catch (e) { /* no-op */ }
  };

  const handleShareToWhatsApp = () => {
    const productUrl = window.location.href.split('?')[0];
    const desc = typeof product?.description === 'string' ? product.description : '';
    const shareMessage = encodeURIComponent(
      `Check out this product from ${shop?.shopName || 'this shop'}!\n\n` +
      `${product?.name || ''}\n` +
      `Price: ${formatPrice(product?.price, currency)}\n\n` +
      `${desc.substring(0,150)}${desc.length > 150 ? '...' : ''}\n\n` +
      `View here: ${productUrl}`
    );
    window.open(`https://wa.me/?text=${shareMessage}`, '_blank');
    toast.success('Opening WhatsApp to share product');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!product?._id) return;
    if (!reviewForm.customerName || !reviewForm.comment || !reviewForm.rating) {
      toast.error('Please fill name, rating and comment');
      return;
    }
    if (reviewForm.comment.length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewAPI.createReview({
        productId: product._id,
        customerName: reviewForm.customerName,
        customerEmail: reviewForm.customerEmail,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        imageFile: reviewForm.imageFile || undefined,
      });
      toast.success('Review submitted');
      setShowReviewForm(false);
      setReviewForm({ customerName: '', customerEmail: '', rating: 5, comment: '', imageFile: null });
      // refresh reviews
      try {
        const data = await reviewAPI.getProductReviews(product._id, { page: 1, limit: 5 });
        const list = Array.isArray(data) ? data : (Array.isArray(data?.reviews) ? data.reviews : []);
        const total = Array.isArray(data) ? (typeof data.total === 'number' ? data.total : list.length) : (typeof data?.total === 'number' ? data.total : (typeof data?.totalReviews === 'number' ? data.totalReviews : list.length));
        setReviews(list);
        setTotalReviews(total);
        setReviewPage(1);
  } catch (e) { /* no-op */ }
    } catch (err) {
      toast.error(err?.userMessage || err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container-custom py-16 text-center">
          <h1 className="text-2xl font-bold mb-3">Product not found</h1>
          <p className="text-gray-600 mb-6">{error || 'This product may have been removed or is inactive.'}</p>
          <Link to="/marketplace" className="btn btn-primary">Back to Marketplace</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO title={`${product.name} - ${shop?.shopName || 'WaZhop'}`} description={(product.description || '').slice(0, 150)} />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />

        {/* Shop Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container-custom py-4 flex items-center gap-3">
            <img src={shop?.logo?.url || shop?.profileImage?.url || '/placeholder.png'} alt="Shop logo" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
            <div className="flex-1">
              <Link to={`/${shop?.slug || ''}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600">{shop?.shopName || 'Shop'}</Link>
              {shop?.location && <div className="text-xs text-gray-500">{shop.location}</div>}
            </div>
            <Link to="/marketplace" className="text-sm text-primary-600 hover:underline">← Back to Marketplace</Link>
          </div>
        </div>

        {/* Product Content */}
        <div className="container-custom py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" style={{height: '480px'}}>
              {images.length > 0 ? (
                <>
                  <img src={(images[selectedImage]?.url || images[selectedImage]?.secure_url) || ''} alt={product.name} className="w-full h-full object-contain" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/60 rounded-full p-2 hover:bg-white shadow">
                        <FiChevronLeft size={22} />
                      </button>
                      <button onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/60 rounded-full p-2 hover:bg-white shadow">
                        <FiChevronRight size={22} />
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
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`border-2 rounded-lg overflow-hidden ${selectedImage === idx ? 'border-blue-500' : 'border-gray-200'}`}>
                    <img src={(img?.url || img?.secure_url) || ''} alt="" className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.numReviews > 0 && (
              <div className="mb-3">
                <StarRating rating={product.averageRating || 0} count={product.numReviews} size={20} showCount={true} />
              </div>
            )}

            {/* Price and stock */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-bold" style={{color: primaryColor}}>{formatPrice(product.price, currency)}</span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatPrice(product.comparePrice, currency)}</span>
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">-{Math.round(((product.comparePrice - product.price)/product.comparePrice)*100)}%</span>
                  </>
                )}
              </div>
              {isOutOfStock ? (
                <span className="inline-block bg-gray-800 text-white text-sm font-semibold px-3 py-1 rounded">Out of Stock</span>
              ) : isLowStock ? (
                <span className="inline-block bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded">Only {product.stock} left - Order soon!</span>
              ) : product.stock !== null ? (
                <span className="text-primary-600 text-sm font-medium">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-primary-600 text-sm font-medium">In Stock</span>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((t, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">#{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {shop?.paymentSettings?.provider && shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink && (
                <button onClick={() => {
                  const paymentLink = shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink;
                  if (paymentLink) {
                    const url = new URL(paymentLink);
                    url.searchParams.append('product', product.name);
                    url.searchParams.append('amount', product.price);
                    window.open(url.toString(), '_blank');
                  } else { toast.error('Payment link not configured'); }
                }} disabled={isOutOfStock} className="btn btn-primary w-full flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  <FiCreditCard size={22} /> {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                </button>
              )}
              {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
                <button onClick={handleOrderOnWhatsApp} disabled={isOutOfStock} className="btn btn-whatsapp w-full flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-white">
                  <IoLogoWhatsapp size={24} /> {isOutOfStock ? 'Out of Stock' : (shop?.paymentSettings?.provider ? 'Negotiate on WhatsApp' : 'Order on WhatsApp')}
                </button>
              )}
              <button onClick={handleShareToWhatsApp} className="btn w-full flex items-center justify-center gap-2 text-lg py-3 border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:bg-transparent dark:hover:bg-primary-900/20">
                <FiShare2 size={22} /> Share on WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="container-custom py-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Related Products</h3>
            {product?.category && <span className="text-sm text-gray-500 capitalize">in {product.category}</span>}
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
                <Link key={rp._id} to={`/product/${rp._id}`} className="text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <img src={rp.images?.[0]?.url ?? rp.images?.[0] ?? ''} alt={rp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2 mb-1">{rp.name}</p>
                    <p className="text-primary-600 dark:text-primary-400 font-semibold">{formatPrice(rp.price, 'NGN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="container-custom py-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Customer Reviews</h3>
            <button onClick={() => setShowReviewForm((v) => !v)} className="btn btn-secondary">
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Write Your Review</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={reviewForm.customerName} onChange={(e)=>setReviewForm({...reviewForm, customerName: e.target.value})} className="input" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  <input type="email" value={reviewForm.customerEmail} onChange={(e)=>setReviewForm({...reviewForm, customerEmail: e.target.value})} className="input" placeholder="john@example.com" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating <span className="text-red-500">*</span></label>
                <StarRating rating={reviewForm.rating} size={28} interactive showCount={false} onChange={(r)=>setReviewForm({...reviewForm, rating: r})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Review <span className="text-red-500">*</span></label>
                <textarea required minLength={10} maxLength={1000} value={reviewForm.comment} onChange={(e)=>setReviewForm({...reviewForm, comment: e.target.value})} className="input" rows="4" placeholder="Share your experience..." />
                <p className="text-xs text-gray-500 mt-1">{reviewForm.comment.length}/1000 characters</p>
              </div>
              <div className="mb-6">
                <SingleImageUpload label="Add a photo (optional, 1 only)" value={null} onChange={(file)=>setReviewForm({...reviewForm, imageFile: file})} onRemove={()=>setReviewForm({...reviewForm, imageFile: null})} />
              </div>
              <button type="submit" disabled={submittingReview} className="btn btn-primary">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No reviews yet. Be the first to review this product!</div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-lg">{review.customerName}</p>
                      <StarRating rating={review.rating} size={16} showCount={false} />
                    </div>
                    <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  {review.image?.url && (
                    <div className="mt-2">
                      <img src={review.image.url} alt="Review" className="w-40 h-40 object-cover rounded" />
                    </div>
                  )}
                  <p className="text-gray-700 dark:text-gray-200 mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
          {typeof totalReviews === 'number' && totalReviews > 5 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewPage === 1} className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50">Previous</button>
              <span className="px-4 py-2">Page {reviewPage} of {Math.ceil((typeof totalReviews === 'number' ? totalReviews : 0) / 5)}</span>
              <button onClick={() => setReviewPage((p) => p + 1)} disabled={reviewPage >= Math.ceil((typeof totalReviews === 'number' ? totalReviews : 0) / 5)} className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
