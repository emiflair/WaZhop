import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopAPI, productAPI } from '../utils/api';
import { FiShoppingBag, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiPackage, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { IoLogoWhatsapp, IoLogoTiktok } from 'react-icons/io5';
import StarRating from '../components/StarRating';
import ProductDetailModal from '../components/ProductDetailModal';
import CartSidebar from '../components/CartSidebar';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';

const Storefront = () => {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Cart state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, getCartCount } = useCart();

  useEffect(() => {
    fetchShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const html = document.documentElement;
    let media;
    let apply;

    // Apply theme mode when shop data loads
    if (shop?.theme?.mode) {
      media = window.matchMedia('(prefers-color-scheme: dark)');

      apply = () => {
        if (shop.theme.mode === 'dark') {
          html.classList.add('dark');
        } else if (shop.theme.mode === 'light') {
          html.classList.remove('dark');
        } else if (shop.theme.mode === 'auto') {
          html.classList.toggle('dark', media.matches);
        }
      };

      // Initial apply
      apply();

      // Listen for system theme changes in auto mode
      if (shop.theme.mode === 'auto') {
        try {
          media.addEventListener('change', apply);
        } catch {
          // Safari fallback
          media.addListener(apply);
        }
      }
    }
    
    // Cleanup: restore original theme when leaving storefront
    return () => {
      if (media && apply && shop?.theme?.mode === 'auto') {
        try {
          media.removeEventListener('change', apply);
        } catch {
          media.removeListener(apply);
        }
      }
      // Revert to user's system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', systemDark);
    };
  }, [shop]);

  const fetchShop = async () => {
    try {
      const shopData = await shopAPI.getShopBySlug(slug);
      setShop(shopData.shop);
      setProducts(shopData.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Shop not found');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = async (product) => {
    try {
      // Check if WhatsApp number is available
      if (!shop?.owner?.whatsapp) {
        console.error('WhatsApp number not available:', shop);
        toast.error('WhatsApp contact not available for this shop');
        return;
      }

      await productAPI.trackClick(product._id);
      const message = encodeURIComponent(
        `Hello! I'm interested in your product: ${product.name}\nPrice: ₦${product.price.toLocaleString()}`
      );
      const whatsappNumber = shop.owner.whatsapp.replace(/\D/g, '');
      
      if (!whatsappNumber) {
        console.error('Invalid WhatsApp number:', shop.owner.whatsapp);
        toast.error('Invalid WhatsApp contact for this shop');
        return;
      }

      window.open(
        `https://wa.me/${whatsappNumber}?text=${message}`,
        '_blank'
      );
    } catch (err) {
      console.error('Error with WhatsApp click:', err);
      toast.error('Failed to open WhatsApp. Please try again.');
    }
  };

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe-bottom">
      {/* Header/Banner - Mobile Optimized */}
      <div
        className="relative h-40 sm:h-48 md:h-64"
        style={{
          background: shop.banner?.url
            ? `url(${shop.banner.url}) center/cover`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        }}
      >
        {shop.showWatermark && (
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm dark:text-gray-200">
            Powered by <span className="font-semibold">WaZhop</span>
          </div>
        )}
        
        {/* Floating Cart Button - Mobile Optimized with Touch Target */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed top-16 sm:top-20 right-3 sm:right-4 z-30 bg-white dark:bg-gray-800 shadow-lg rounded-full touch-target hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-all"
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

      {/* Shop Info - Mobile Optimized */}
      <div className="container-custom -mt-12 sm:-mt-16 relative z-10">
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

        {/* Search and Filter Bar - Mobile Optimized */}
        {products.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Search - Full width on mobile */}
              <div className="relative md:col-span-1">
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

              {/* Category Filter - Mobile optimized */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input text-base appearance-none cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-label="Filter by category"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>

              {/* Sort - Mobile optimized */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input text-base appearance-none cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-label="Sort products"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Results count */}
            {(searchQuery || selectedCategory !== 'all') && (
              <div className="mt-3 text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-6 sm:pb-12">
            {filteredProducts.map((product) => {
              // Calculate discount percentage
              const discountPercent = product.comparePrice && product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0;

              // Check stock status
              const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
              const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= (product.lowStockThreshold || 5);

              return (
                <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl active:shadow-lg transition-all duration-300 group">
                  {/* Product Image - Mobile Optimized */}
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
                        className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FiPackage size={40} className="sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    
                    {/* Badges - Mobile Optimized */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      {discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                          -{discountPercent}%
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded shadow-md">
                          Out of Stock
                        </span>
                      )}
                      {isLowStock && (
                        <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-md">
                          Only {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info - Mobile Optimized */}
                  <div className="p-3 sm:p-4">
                    <h3 
                      className="font-semibold text-base sm:text-lg mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem] cursor-pointer hover:text-blue-600 active:text-blue-700 dark:text-white dark:hover:text-blue-400 dark:active:text-blue-500 touch-manipulation"
                      onClick={() => setSelectedProduct(product)}
                      role="button"
                      tabIndex={0}
                    >
                      {product.name}
                    </h3>
                    
                    {/* Rating - Mobile Optimized */}
                    {product.numReviews > 0 ? (
                      <div className="mb-2">
                        <StarRating 
                          rating={product.averageRating || 0} 
                          count={product.numReviews} 
                          size={14}
                          showCount={true}
                        />
                      </div>
                    ) : (
                      <div className="mb-2 h-5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">No reviews yet</span>
                      </div>
                    )}

                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{product.description}</p>
                    
                    {/* Price - Mobile Optimized */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: primaryColor }}>
                          ₦{product.price.toLocaleString()}
                        </p>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <p className="text-xs sm:text-sm text-gray-400 line-through">
                            ₦{product.comparePrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      {/* Variants indicator */}
                      {product.variants && product.variants.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, shop, 1);
                        }}
                        disabled={isOutOfStock}
                        className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <FiShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="truncate">Add to Cart</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppClick(product);
                        }}
                        disabled={isOutOfStock}
                        className="btn btn-whatsapp w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-white text-sm sm:text-base touch-manipulation"
                        aria-label={isOutOfStock ? 'Out of stock' : `Order ${product.name} on WhatsApp`}
                      >
                        <IoLogoWhatsapp size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="truncate">{isOutOfStock ? 'Out of Stock' : 'Order on WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          shop={shop}
          onClose={() => setSelectedProduct(null)}
          onWhatsAppClick={handleWhatsAppClick}
        />
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} shop={shop} />
    </div>
  );
};

export default Storefront;
