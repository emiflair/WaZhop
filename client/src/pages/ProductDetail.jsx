import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import SEO from '../components/SEO';
import { productAPI, shopAPI, reviewAPI } from '../utils/api';
import StarRating from '../components/StarRating';
import { getCachedData } from '../utils/prefetch';
import { FiChevronLeft, FiChevronRight, FiPackage, FiCreditCard, FiShare2 } from 'react-icons/fi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/currency';
import SingleImageUpload from '../components/SingleImageUpload';

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopInactive, setShopInactive] = useState(false);
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

  const fetchRelatedProducts = useCallback(async (productId) => {
    try {
      setLoadingRelated(true);
      const relatedRes = await productAPI.getRelatedProducts(productId, 8);
      const related = relatedRes?.data || relatedRes || [];
      setRelatedProducts(Array.isArray(related) ? related : []);
    } catch {
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if product is already cached from prefetching
        const cachedProduct = getCachedData(`product_${id}`);
        if (cachedProduct) {
          setProduct(cachedProduct);
          setLoading(false);
          
          // Load shop and related products in background
          if (cachedProduct?.shop?.slug) {
            shopAPI.getShopBySlug(cachedProduct.shop.slug)
              .then(s => setShop(s?.shop || s?.data?.shop || s))
              .catch(() => setShop(cachedProduct.shop));
          } else if (cachedProduct?.shop) {
            setShop(cachedProduct.shop);
          }
          
          fetchRelatedProducts(id).catch(() => {});
          
          return;
        }
        
        // Load product details first so UI can render immediately
        const response = await productAPI.getProduct(id);
        const prod = response?.data || response;
        setProduct(prod);
        setLoading(false);
        
        // Check if shop is inactive
        if (response?.shopInactive) {
          setShopInactive(true);
          toast.error(response.message || 'This shop is temporarily unavailable');
        }
        
        // Fetch full shop details (logo/profile) by slug
        if (prod?.shop?.slug) {
          try {
            const s = await shopAPI.getShopBySlug(prod.shop.slug);
            setShop(s?.shop || s?.data?.shop || s);
          } catch (e) {
            setShop(prod.shop);
          }
        } else if (prod?.shop) {
          setShop(prod.shop);
        }

        // Fetch related products without blocking main content
        fetchRelatedProducts(id).catch(() => {});
      } catch (e) {
        console.error('Product load error:', e);
        // Provide more specific error messages
        const errorMsg = e.response?.data?.message || e.userMessage || e.message || 'Failed to load product';
        setError(errorMsg);
        
        // If it's a network error, suggest checking connection
        if (!e.response && (e.message?.includes('network') || e.message?.includes('fetch'))) {
          setError('Network error. Please check your internet connection and try again.');
        }
        setLoading(false);
        setLoadingRelated(false);
      }
    };
    load();
    setSelectedImage(0);
  }, [fetchRelatedProducts, id]);

  // Theme handling: Respect marketplace theme when coming from marketplace
  // Apply shop theme only when coming from shop's storefront
  useEffect(() => {
    if (!shop) return;

    const html = document.documentElement;
    const previousThemeWasDark = html.classList.contains('dark');

    // Check if user came from marketplace (public browsing)
    const cameFromMarketplace = location.state?.fromMarketplace === true;

    // If coming from marketplace, keep the marketplace's theme (user's preference)
    // Only apply shop's custom theme if coming from shop's storefront or direct link
    if (cameFromMarketplace) {
      // Coming from marketplace - keep current theme (don't change anything)
      // User's marketplace theme preference is already applied
    } else {
      // Coming from shop storefront or direct link - apply shop's custom theme
      const themeMode = shop.theme?.mode || 'light';
      
      if (themeMode === 'dark') {
        html.classList.add('dark');
      } else if (themeMode === 'light') {
        html.classList.remove('dark');
      } else if (themeMode === 'auto') {
        // Auto mode: follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }
    }

    // Cleanup: restore previous theme when leaving product page
    return () => {
      if (previousThemeWasDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };
  }, [shop, location]);

  // fetch reviews when product changes (related products already loaded in parallel)
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category) return;
      
      // Skip fetching related products if already loaded from initial parallel request
      if (relatedProducts.length > 0) {
        return;
      }
      
      try {
        setLoadingRelated(true);
        
        // First, try to get products from same subcategory (most relevant)
        let items = [];
        if (product.subcategory) {
          const subcatList = await productAPI.getMarketplaceProducts({ 
            category: product.category, 
            subcategory: product.subcategory,
            limit: 12 
          });
          items = Array.isArray(subcatList) ? subcatList : [];
        }
        
        // If not enough from subcategory, fill with same category products
        if (items.length < 8) {
          const catList = await productAPI.getMarketplaceProducts({ 
            category: product.category, 
            limit: 12 
          });
          const catItems = Array.isArray(catList) ? catList : [];
          // Merge without duplicates
          const existingIds = new Set(items.map(p => p._id));
          const additionalItems = catItems.filter(p => !existingIds.has(p._id));
          items = [...items, ...additionalItems];
        }
        
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
  const isUnavailable = shopInactive || isOutOfStock;

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
          <h1 className="text-2xl font-bold mb-3">{error?.includes('Network') ? 'Connection Error' : 'Product not found'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This product may have been removed or is inactive.'}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/marketplace" className="btn btn-primary">Browse Marketplace</Link>
            {error?.includes('Network') && (
              <button onClick={() => window.location.reload()} className="btn btn-secondary">Try Again</button>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Preload first image for faster display
  const firstImage = images[0]?.url || images[0]?.secure_url;
  
  return (
    <>
      <SEO title={`${product.name} - ${shop?.shopName || 'WaZhop'}`} description={(product.description || '').slice(0, 150)} />
      {firstImage && (
        <link rel="preload" as="image" href={firstImage} fetchPriority="high" />
      )}
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />

        {/* Shop Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container-custom py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
            <img src={shop?.logo?.url || shop?.profileImage?.url || '/placeholder.png'} alt="Shop logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {shop?.slug ? (
                  <Link to={`/${shop.slug}`} className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-primary-600 truncate">{shop?.shopName || 'Shop'}</Link>
                ) : (
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{shop?.shopName || 'Shop'}</span>
                )}
                {(shop?.owner?.plan === 'pro' || shop?.owner?.plan === 'premium') && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {shop?.location && <div className="text-xs text-gray-500 truncate">{shop.location}</div>}
            </div>
            <Link to="/" className="text-xs sm:text-sm text-primary-600 hover:underline whitespace-nowrap shrink-0">← Back</Link>
          </div>
        </div>

        {/* Product Content */}
        <div className="container-custom py-4 sm:py-6 md:py-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Gallery */}
          <div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-64 sm:h-80 md:h-96 lg:h-[480px]">
              {images.length > 0 ? (
                <>
                  <img 
                    src={(images[selectedImage]?.url || images[selectedImage]?.secure_url) || ''} 
                    alt={product.name} 
                    className="w-full h-full object-contain"
                    fetchPriority={selectedImage === 0 ? "high" : "auto"}
                  />
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
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 mt-3">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)} className={`border-2 rounded-lg overflow-hidden ${selectedImage === idx ? 'border-blue-500' : 'border-gray-200'}`}>
                    <img src={(img?.url || img?.secure_url) || ''} alt="" className="w-full h-16 sm:h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Category Breadcrumb - Hidden for cleaner product page */}
            {/* {(product.category || product.subcategory) && (
              <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Link 
                  to="/marketplace" 
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Marketplace
                </Link>
                {product.category && (
                  <>
                    <span>/</span>
                    <Link 
                      to={`/marketplace?category=${product.category}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                    >
                      {getCategoryLabel(product.category)}
                    </Link>
                  </>
                )}
                {product.subcategory && (
                  <>
                    <span>/</span>
                    <Link 
                      to={`/marketplace?category=${product.category}&subcategory=${product.subcategory}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {toLabel(product.subcategory)}
                    </Link>
                  </>
                )}
              </nav>
            )} */}

            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{product.name}</h1>
            {product.numReviews > 0 && (
              <div className="mb-3">
                <StarRating rating={product.averageRating || 0} count={product.numReviews} size={20} showCount={true} />
              </div>
            )}

            {/* Price and stock */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{color: primaryColor}}>{formatPrice(product.price, currency)}</span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <>
                    <span className="text-lg sm:text-xl text-gray-400 line-through">{formatPrice(product.comparePrice, currency)}</span>
                    <span className="bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded whitespace-nowrap">-{Math.round(((product.comparePrice - product.price)/product.comparePrice)*100)}%</span>
                  </>
                )}
              </div>
              {shopInactive ? (
                <div className="space-y-2">
                  <span className="inline-block bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded">Shop Temporarily Unavailable</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This shop has exceeded its plan limits. Products cannot be purchased until the shop owner upgrades their plan.</p>
                </div>
              ) : isOutOfStock ? (
                <span className="inline-block bg-gray-800 text-white text-sm font-semibold px-3 py-1 rounded">Out of Stock</span>
              ) : isLowStock ? (
                <span className="inline-block bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded">Only {product.stock} left - Order soon!</span>
              ) : product.stock !== null ? (
                <span className="text-primary-600 text-sm font-medium">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-primary-600 text-sm font-medium">In Stock</span>
              )}
            </div>

            {/* Actions - Moved right after price */}
            <div className="space-y-2.5 sm:space-y-3 mb-6">
              {shop?.paymentSettings?.provider && shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink && (
                <button onClick={() => {
                  const paymentLink = shop?.paymentSettings?.[shop?.paymentSettings?.provider]?.paymentLink;
                  if (paymentLink) {
                    const url = new URL(paymentLink);
                    url.searchParams.append('product', product.name);
                    url.searchParams.append('amount', product.price);
                    window.open(url.toString(), '_blank');
                  } else { toast.error('Payment link not configured'); }
                }} disabled={isUnavailable} className="btn btn-primary w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  <FiCreditCard size={18} className="sm:w-5 sm:h-5" /> {shopInactive ? 'Shop Unavailable' : (isOutOfStock ? 'Out of Stock' : 'Buy Now')}
                </button>
              )}
              {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
                <button onClick={handleOrderOnWhatsApp} disabled={isUnavailable} className="btn btn-whatsapp w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-white">
                  <IoLogoWhatsapp size={20} className="sm:w-6 sm:h-6" /> <span className="truncate">{shopInactive ? 'Shop Unavailable' : (isOutOfStock ? 'Out of Stock' : (shop?.paymentSettings?.provider ? 'Negotiate on WhatsApp' : 'Order on WhatsApp'))}</span>
                </button>
              )}
              <button onClick={handleShareToWhatsApp} className="btn w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg py-2.5 sm:py-3 border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:bg-transparent dark:hover:bg-primary-900/20">
                <FiShare2 size={18} className="sm:w-5 sm:h-5" /> Share on WhatsApp
              </button>
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
          </div>
        </div>

        {/* Related Products */}
        <div className="container-custom py-6 sm:py-8 px-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Related Products</h3>
            {product?.category && <span className="text-xs sm:text-sm text-gray-500 capitalize truncate ml-2">in {product.category}</span>}
          </div>
          {loadingRelated ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : !Array.isArray(relatedProducts) || relatedProducts.length === 0 ? (
            <p className="text-gray-500">No related products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((rp) => (
                <Link 
                  key={rp._id} 
                  to={`/product/${rp._id}`}
                  state={{ fromMarketplace: location.state?.fromMarketplace || true }}
                  className="text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <img 
                      src={rp.images?.[0]?.url ?? rp.images?.[0] ?? ''} 
                      alt={rp.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
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
                      <img 
                        src={review.image.url} 
                        alt="Review" 
                        className="w-40 h-40 object-cover rounded"
                        loading="lazy"
                        decoding="async"
                      />
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

        <MobileBottomNav />
        <Footer />
      </div>
    </>
  );
}
