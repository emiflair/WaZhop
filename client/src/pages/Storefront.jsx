import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { shopAPI, productAPI } from '../utils/api';
import { FiShoppingBag, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiPackage, FiSearch, FiShoppingCart, FiFilter, FiSliders, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { IoLogoWhatsapp, IoLogoTiktok } from 'react-icons/io5';
import StarRating from '../components/StarRating';
import ProductDetailModal from '../components/ProductDetailModal';
import CartSidebar from '../components/CartSidebar';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';
import { convertProductPrice, formatPrice } from '../utils/currency';
import { CATEGORY_SUGGESTIONS, toLabel } from '../utils/categories';

const Storefront = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('random');
  // Mobile popovers for category/sort
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  
  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // Cart state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, getCartCount } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!slug) return;

        await fetchShopBySlug(slug);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Apply shop's theme mode (independent of dashboard theme)
  useEffect(() => {
    if (!shop?.theme?.mode) return;

    const html = document.documentElement;
    const previousThemeWasDark = html.classList.contains('dark');
    const themeMode = shop.theme.mode; // 'light' | 'dark' | 'auto'

    const applyShopTheme = () => {
      if (themeMode === 'dark') {
        html.classList.add('dark');
      } else if (themeMode === 'light') {
        html.classList.remove('dark');
      } else if (themeMode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }
    };

    applyShopTheme();

    return () => {
      if (previousThemeWasDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };
  }, [shop?.theme?.mode]);

  const applyShopPayload = (shopData) => {
    // Handle both response structures: direct {shop, products} or nested {data: {shop, products}}
    const actualData = shopData.data || shopData;
    const shop = actualData.shop || actualData;
    const products = actualData.products || [];

    if (!shop) {
      console.error('❌ No shop data in response:', shopData);
      setError('Shop data is invalid');
      return;
    }

    if (!Array.isArray(products)) {
      console.error('❌ Products is not an array:', products);
      setError('Shop data is invalid');
      return;
    }

    const shopCurrency = shop.paymentSettings?.currency || 'NGN';
    const convertedProducts = products.map((product) =>
      convertProductPrice(product, shopCurrency)
    );

    setShop(shop);
    setProducts(convertedProducts);
  };

  const fetchShopBySlug = async (slugParam) => {
    try {
      console.log('🔍 Fetching shop with slug:', slugParam);
      const response = await shopAPI.getShopBySlug(slugParam);
      console.log('✅ Full API response:', response);
      
      applyShopPayload(response);
    } catch (err) {
      console.error('❌ Error fetching shop:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Shop not found');
    }
  };
  const handleWhatsAppClick = async (product) => {
    try {
      // Check if WhatsApp number is available
      const rawNumber = shop?.owner?.whatsapp || '';
      const whatsappNumber = String(rawNumber).replace(/\D/g, '');
      if (!whatsappNumber) {
        console.error('Invalid or missing WhatsApp number:', rawNumber);
        toast.error('WhatsApp contact not available for this shop');
        return;
      }

      // Prepare message first (match cart-style formatting)
      const currency = shop.paymentSettings?.currency || 'NGN';
      const formattedPrice = formatPrice(product.price, currency);
      const message = `Hello! I'd like to order the following item from ${shop.shopName}:\n\n1. ${product.name} - Qty: 1 - ${formattedPrice}\n\nTotal: ${formattedPrice}`;
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      // IMPORTANT: Open WhatsApp immediately on user gesture to avoid popup blockers
      window.open(url, '_blank');

      // Fire-and-forget click tracking (do not await to keep popup allowed)
      try {
        productAPI.trackClick(product._id);
      } catch (e) {
        // Non-blocking
        console.warn('trackClick failed (non-blocking):', e);
      }
    } catch (err) {
      console.error('Error with WhatsApp click:', err);
      toast.error('Failed to open WhatsApp. Please try again.');
    }
  };

  // Provide comprehensive catalog of categories for user selection
  const categoryOptions = ['all', ...CATEGORY_SUGGESTIONS];

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query)));
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'random':
          return 0; // Don't sort, keep backend's random order
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'popular':
          return (b.numReviews || 0) - (a.numReviews || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = shop.theme?.primaryColor || '#000000';
  const accentColor = shop.theme?.accentColor || '#FFD700';
  const layout = shop.theme?.layout || 'grid';
  // Enforce font selection from theme
  const fontStacks = {
    inter: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    roboto: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    poppins: "'Poppins', 'Inter', system-ui, sans-serif",
    montserrat: "'Montserrat', 'Inter', system-ui, sans-serif",
  };
  const fontFamily = shop.theme?.font ? fontStacks[shop.theme.font] : undefined;

  const renderGridCard = (product) => {
    const discountPercent = product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;
    const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
    const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= (product.lowStockThreshold || 5);


    return (
      <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl active:shadow-lg transition-all duration-300 group">
        <div 
          className="relative overflow-hidden cursor-pointer touch-manipulation active:opacity-90"
          onClick={() => setSelectedProduct(product)}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${product.name}`}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
              alt={product.name}
              className="w-full h-36 sm:h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-36 sm:h-48 md:h-56 lg:h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <FiPackage size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
            {discountPercent > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md">
                -{discountPercent}%
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-800 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md">
                Out of Stock
              </span>
            )}
            {isLowStock && (
              <span className="bg-orange-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md">
                Only {product.stock} left
              </span>
            )}
          </div>
        </div>

        <div className="p-2 sm:p-3 md:p-4">
          {/* Condition Badge */}
          {condition && (
            <div className="mb-2">
              <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                condition === 'used'
                  ? 'bg-gray-600 text-white'
                  : 'bg-green-500 text-white'
              }`}>
                {condition === 'used' ? 'Used' : 'Brand New'}
              </span>
            </div>
          )}

          <h3 
            className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] cursor-pointer hover:text-blue-600 active:text-blue-700 dark:text-white dark:hover:text-blue-400 dark:active:text-blue-500 touch-manipulation"
            onClick={() => setSelectedProduct(product)}
            role="button"
            tabIndex={0}
          >
            {product.name}
          </h3>

          {product.numReviews > 0 ? (
            <div className="mb-1.5 sm:mb-2">
              <StarRating 
                rating={product.averageRating || 0} 
                count={product.numReviews} 
                size={12}
                showCount={true}
              />
            </div>
          ) : (
            <div className="mb-1.5 sm:mb-2 h-4 sm:h-5">
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">No reviews yet</span>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[1.5rem] sm:min-h-[2rem] md:min-h-[2.5rem] hidden sm:block">{product.description}</p>

          <div className="mb-2 sm:mb-3 md:mb-4">
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(product.price, shop.paymentSettings?.currency || 'NGN')}
              </p>
              {product.comparePrice && product.comparePrice > product.price && (
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-through">
                  {formatPrice(product.comparePrice, shop.paymentSettings?.currency || 'NGN')}
                </p>
              )}
            </div>
            {product.variants && product.variants.length > 0 && (
              <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, shop, 1);
              }}
              disabled={isOutOfStock}
              className="btn btn-secondary w-full flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm md:text-base py-1.5 sm:py-2 touch-manipulation"
              aria-label={`Add ${product.name} to cart`}
            >
              <FiShoppingCart size={14} className="sm:w-4 sm:h-4" />
              <span className="truncate hidden sm:inline">Add to Cart</span>
              <span className="truncate sm:hidden">Add</span>
            </button>
            {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsAppClick(product);
              }}
              disabled={isOutOfStock}
              className="btn btn-whatsapp w-full flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-white text-[10px] sm:text-sm md:text-base py-1.5 sm:py-2 touch-manipulation"
              aria-label={isOutOfStock ? 'Out of stock' : `Order ${product.name} on WhatsApp`}
            >
              <IoLogoWhatsapp size={14} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate hidden sm:inline">{isOutOfStock ? 'Out of Stock' : 'Order on WhatsApp'}</span>
              <span className="truncate sm:hidden">{isOutOfStock ? 'Out' : 'WhatsApp'}</span>
            </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderListItem = (product) => {
    const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
    return (
      <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 flex gap-3 sm:gap-4">
        <div
          className="w-28 sm:w-36 h-24 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={() => setSelectedProduct(product)}
        >
          {product.images?.length ? (
            <img
              src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <FiPackage className="text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg dark:text-white truncate">{product.name}</h3>
            <p className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: primaryColor }}>
              {formatPrice(product.price, shop.paymentSettings?.currency || 'NGN')}
            </p>
          </div>
          {product.numReviews > 0 && (
            <div className="mt-1">
              <StarRating rating={product.averageRating || 0} count={product.numReviews} size={12} showCount />
            </div>
          )}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => addToCart(product, shop, 1)}
              disabled={isOutOfStock}
              className="btn btn-secondary text-xs sm:text-sm"
            >
              Add to Cart
            </button>
            {(!shop?.paymentSettings?.provider || shop?.paymentSettings?.allowWhatsAppNegotiation) && (
            <button
              onClick={() => handleWhatsAppClick(product)}
              disabled={isOutOfStock}
              className="btn btn-whatsapp text-xs sm:text-sm"
            >
              WhatsApp
            </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMinimalCard = (product) => (
    <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="cursor-pointer" onClick={() => setSelectedProduct(product)}>
        {product.images?.length ? (
          <img
            src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
            alt={product.name}
            className="w-full h-40 sm:h-44 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 sm:h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <FiPackage className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <p className="font-medium text-xs sm:text-sm dark:text-white line-clamp-2">{product.name}</p>
        <p className="text-sm sm:text-base font-semibold mt-1" style={{ color: primaryColor }}>
          {formatPrice(product.price, shop.paymentSettings?.currency || 'NGN')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-bottom" style={fontFamily ? { fontFamily } : undefined}>
      {/* Header/Banner - Mobile Optimized */}
      <div
        className="relative h-40 sm:h-48 md:h-64 pt-safe"
        style={{
          background: shop.banner?.url
            ? `url(${shop.banner.url}) center/cover`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        }}
      >
        {/* Back Button - Top Left */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 sm:left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all touch-target"
          style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
          aria-label="Go back"
        >
          <FiArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>

        {/* Top Right Watermark - Free Plan Only */}
        {shop.showWatermark && (
          <div 
            className="absolute right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm dark:text-gray-200 shadow-md"
            style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
          >
            Powered by <span className="font-semibold text-primary-600 dark:text-primary-400">WaZhop</span>
          </div>
        )}
        
        {/* Floating Cart Button - Mobile Optimized with Touch Target */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed right-3 sm:right-4 z-30 bg-white dark:bg-gray-800 shadow-lg rounded-full touch-target hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-all"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
          aria-label="View cart"
        >
          <FiShoppingCart size={22} className="sm:w-6 sm:h-6 dark:text-gray-200" />
          {getCartCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5 shadow-md">
              {getCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Activation Banner - Shows for temporary stores */}
      {shop.isTemporary && shop.activationToken && (
        <div className="container-custom -mt-12 sm:-mt-16 relative z-10 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-xl p-6 sm:p-8 text-white">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                🎉 This Store Was Created For You!
              </h2>
              <p className="text-lg sm:text-xl mb-6 text-green-50">
                Click below to activate and claim this store with all its products
              </p>
              <Link
                to={`/activate-store/${shop._id}/${shop.activationToken}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-lg hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl"
              >
                <FiCheck className="h-6 w-6" />
                Activate Store Now
              </Link>
              <p className="text-sm text-green-100 mt-4">
                Browse the products below and activate when ready
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shop Info - Mobile Optimized */}
      <div className={`container-custom ${shop.isTemporary ? '' : '-mt-12 sm:-mt-16'} relative z-10`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {shop.logo?.url && (
              <img
                src={shop.logo.url}
                alt={shop.shopName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-md flex-shrink-0 mx-auto sm:mx-0"
              />
            )}
            <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{shop.shopName}</h1>
                {(shop.owner?.plan === 'pro' || shop.owner?.plan === 'premium') && (
                  <div className="flex-shrink-0" title="Verified Shop">
                    <svg 
                      className="w-7 h-7 sm:w-8 sm:h-8" 
                      viewBox="0 0 120 120" 
                      fill="none"
                    >
                      {/* Scalloped seal badge with wavy edges */}
                      <g>
                        <circle cx="60" cy="60" r="50" fill="#5CB85C"/>
                        {/* Create scalloped/wavy edge effect with multiple small circles */}
                        <circle cx="60" cy="10" r="8" fill="#5CB85C"/>
                        <circle cx="78" cy="14" r="8" fill="#5CB85C"/>
                        <circle cx="93" cy="25" r="8" fill="#5CB85C"/>
                        <circle cx="103" cy="42" r="8" fill="#5CB85C"/>
                        <circle cx="107" cy="60" r="8" fill="#5CB85C"/>
                        <circle cx="103" cy="78" r="8" fill="#5CB85C"/>
                        <circle cx="93" cy="95" r="8" fill="#5CB85C"/>
                        <circle cx="78" cy="106" r="8" fill="#5CB85C"/>
                        <circle cx="60" cy="110" r="8" fill="#5CB85C"/>
                        <circle cx="42" cy="106" r="8" fill="#5CB85C"/>
                        <circle cx="27" cy="95" r="8" fill="#5CB85C"/>
                        <circle cx="17" cy="78" r="8" fill="#5CB85C"/>
                        <circle cx="13" cy="60" r="8" fill="#5CB85C"/>
                        <circle cx="17" cy="42" r="8" fill="#5CB85C"/>
                        <circle cx="27" cy="25" r="8" fill="#5CB85C"/>
                        <circle cx="42" cy="14" r="8" fill="#5CB85C"/>
                      </g>
                      {/* White checkmark */}
                      <path 
                        d="M 40 60 L 52 72 L 80 44" 
                        stroke="white" 
                        strokeWidth="10" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {shop.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base">{shop.description}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {shop.location && (
                  <div className="flex items-center gap-1">
                    <FiMapPin size={16} className="flex-shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-none">{shop.location}</span>
                  </div>
                )}
                {shop.category && (
                  <div className="flex items-center gap-1">
                    <FiShoppingBag size={16} className="flex-shrink-0" />
                    <span className="capitalize">{shop.category}</span>
                  </div>
                )}
              </div>
              
              {/* Social Links - Mobile Optimized with Touch Targets */}
              {(shop.socialLinks?.instagram || shop.socialLinks?.facebook || shop.socialLinks?.twitter || shop.socialLinks?.tiktok) && (
                <div className="flex justify-center sm:justify-start gap-2 sm:gap-3 mt-4">
                  {shop.socialLinks.instagram && (
                    <a 
                      href={shop.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="touch-target text-gray-600 hover:text-pink-600 active:scale-95 transition-all"
                      aria-label="Instagram"
                    >
                      <FiInstagram size={20} />
                    </a>
                  )}
                  {shop.socialLinks.facebook && (
                    <a 
                      href={shop.socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="touch-target text-gray-600 hover:text-blue-600 active:scale-95 transition-all"
                      aria-label="Facebook"
                    >
                      <FiFacebook size={20} />
                    </a>
                  )}
                  {shop.socialLinks.twitter && (
                    <a 
                      href={shop.socialLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="touch-target text-gray-600 hover:text-blue-400 active:scale-95 transition-all"
                      aria-label="Twitter"
                    >
                      <FiTwitter size={20} />
                    </a>
                  )}
                  {shop.socialLinks.tiktok && (
                    <a 
                      href={shop.socialLinks.tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="touch-target text-gray-600 hover:text-black active:scale-95 transition-all"
                      aria-label="TikTok"
                    >
                      <IoLogoTiktok size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {products.length > 0 && (
          <>
            {/* Mobile toolbar: icons + search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4 md:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCatSheet(true)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  aria-label="Filter by category"
                >
                  <FiFilter size={18} />
                </button>
                <button
                  onClick={() => setShowSortSheet(true)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  aria-label="Sort products"
                >
                  <FiSliders size={18} />
                </button>
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={18} />
                  <input
                    type="search"
                    inputMode="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    aria-label="Search products"
                  />
                </div>
              </div>
              {(searchQuery || selectedCategory !== 'all') && (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              )}
            </div>

            {/* Desktop filters: three-column layout */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={18} />
                  <input
                    type="search"
                    inputMode="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    aria-label="Search products"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input text-base appearance-none cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Filter by category"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : toLabel(cat)}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-base appearance-none cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Sort products"
                >
                  <option value="random">Random</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
              {(searchQuery || selectedCategory !== 'all') && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Showing {filteredProducts.length} of {products.length} products
                </div>
              )}
            </div>

            {/* Mobile Category Sheet */}
            {showCatSheet && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCatSheet(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-2xl safe-bottom">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Categories</h4>
                    <button className="text-sm text-blue-600" onClick={() => setShowCatSheet(false)}>Done</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {categoryOptions.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setShowCatSheet(false); }}
                        className={`px-3 py-2 rounded-lg border text-sm ${selectedCategory === cat ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 dark:text-gray-200'}`}
                      >
                        {cat === 'all' ? 'All Categories' : toLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Sort Sheet */}
            {showSortSheet && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowSortSheet(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-2xl safe-bottom">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Sort</h4>
                    <button className="text-sm text-blue-600" onClick={() => setShowSortSheet(false)}>Done</button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'random', label: 'Random' },
                      { value: 'newest', label: 'Newest First' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'rating', label: 'Highest Rated' },
                      { value: 'popular', label: 'Most Popular' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortSheet(false); }}
                        className={`px-3 py-2 rounded-lg border text-sm text-left ${sortBy === opt.value ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-gray-200 dark:border-gray-600 dark:text-gray-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 && products.length > 0 ? (
          <div className="text-center py-16">
            <FiShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingBag size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Products Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Check back soon for new items!</p>
          </div>
        ) : (
          <>
            {layout === 'list' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-6 sm:pb-12">
                {filteredProducts.map(renderListItem)}
              </div>
            )}
            {layout === 'minimal' && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-6 sm:pb-12">
                {filteredProducts.map(renderMinimalCard)}
              </div>
            )}
            {layout === 'masonry' && (
              <div className="pb-6 sm:pb-12">
                <div className="columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
                  {filteredProducts.map((p) => (
                    <div key={p._id} style={{ breakInside: 'avoid' }} className="mb-3 sm:mb-4">
                      {renderMinimalCard(p)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(layout === 'grid' || !['list','minimal','masonry'].includes(layout)) && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pb-6 sm:pb-12">
                {filteredProducts.map(renderGridCard)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Powered by WaZhop - Free Plan Only */}
      {shop.showWatermark && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
          <div className="container-custom text-center">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Powered by{' '}
              <a 
                href="https://wazhop.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                WaZhop
              </a>
              {' '}– Build your online shop in minutes
            </p>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          shop={shop}
          shopProducts={products}
          onClose={() => setSelectedProduct(null)}
          onWhatsAppClick={handleWhatsAppClick}
          onSelectProduct={setSelectedProduct}
          showImageModal={showImageModal}
          setShowImageModal={setShowImageModal}
          modalImageIndex={modalImageIndex}
          setModalImageIndex={setModalImageIndex}
        />
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} shop={shop} />
    </div>
  );
};

export default Storefront;
