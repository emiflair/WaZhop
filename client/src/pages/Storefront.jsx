import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shopAPI, productAPI } from '../utils/api';
import { FiShoppingBag, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiPackage, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { IoLogoWhatsapp, IoLogoTiktok } from 'react-icons/io5';
import StarRating from '../components/StarRating';
import ProductDetailModal from '../components/ProductDetailModal';
import CartSidebar from '../components/CartSidebar';
import { useCart } from '../hooks/useCart';

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
      await productAPI.trackClick(product._id);
      const message = encodeURIComponent(
        `Hello! I'm interested in your product: ${product.name}\nPrice: ₦${product.price.toLocaleString()}`
      );
      window.open(
        `https://wa.me/${shop.owner.whatsapp.replace(/\D/g, '')}?text=${message}`,
        '_blank'
      );
    } catch (err) {
      console.error('Error tracking click:', err);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header/Banner */}
      <div
        className="relative h-48 md:h-64"
        style={{
          background: shop.banner?.url
            ? `url(${shop.banner.url}) center/cover`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
        }}
      >
        {shop.showWatermark && (
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm">
            Powered by <span className="font-semibold">WaShop</span>
          </div>
        )}
        
        {/* Floating Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed top-20 right-4 z-30 bg-white shadow-lg rounded-full p-4 hover:bg-gray-50 transition"
        >
          <FiShoppingCart size={24} />
          {getCartCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {getCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Shop Info */}
      <div className="container-custom -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start gap-6">
            {shop.logo?.url && (
              <img
                src={shop.logo.url}
                alt={shop.shopName}
                className="w-24 h-24 rounded-lg object-cover shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.shopName}</h1>
              {shop.description && (
                <p className="text-gray-600 mb-3">{shop.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {shop.location && (
                  <div className="flex items-center gap-1">
                    <FiMapPin size={16} />
                    <span>{shop.location}</span>
                  </div>
                )}
                {shop.category && (
                  <div className="flex items-center gap-1">
                    <FiShoppingBag size={16} />
                    <span className="capitalize">{shop.category}</span>
                  </div>
                )}
              </div>
              
              {/* Social Links */}
              {(shop.socialLinks?.instagram || shop.socialLinks?.facebook || shop.socialLinks?.twitter || shop.socialLinks?.tiktok) && (
                <div className="flex gap-3 mt-4">
                  {shop.socialLinks.instagram && (
                    <a href={shop.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">
                      <FiInstagram size={20} />
                    </a>
                  )}
                  {shop.socialLinks.facebook && (
                    <a href={shop.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                      <FiFacebook size={20} />
                    </a>
                  )}
                  {shop.socialLinks.twitter && (
                    <a href={shop.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400">
                      <FiTwitter size={20} />
                    </a>
                  )}
                  {shop.socialLinks.tiktok && (
                    <a href={shop.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
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
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="mt-3 text-sm text-gray-600">
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
            <FiShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-600">Check back soon for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {filteredProducts.map((product) => {
              // Calculate discount percentage
              const discountPercent = product.comparePrice && product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0;

              // Check stock status
              const isOutOfStock = !product.inStock || (product.stock !== null && product.stock === 0);
              const isLowStock = !isOutOfStock && product.stock !== null && product.stock <= (product.lowStockThreshold || 5);

              return (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Product Image */}
                  <div 
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                        <FiPackage size={48} className="text-gray-300" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                      {discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discountPercent}%
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      )}
                      {isLowStock && (
                        <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Only {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      className="font-semibold text-lg mb-1 line-clamp-2 min-h-[3.5rem] cursor-pointer hover:text-blue-600"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </h3>
                    
                    {/* Rating */}
                    {product.numReviews > 0 ? (
                      <div className="mb-2">
                        <StarRating 
                          rating={product.averageRating || 0} 
                          count={product.numReviews} 
                          size={16}
                          showCount={true}
                        />
                      </div>
                    ) : (
                      <div className="mb-2 h-6">
                        <span className="text-xs text-gray-400">No reviews yet</span>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                          ₦{product.price.toLocaleString()}
                        </p>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <p className="text-sm text-gray-400 line-through">
                            ₦{product.comparePrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      {/* Variants indicator */}
                      {product.variants && product.variants.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>

                    {/* WhatsApp Button */}
                    <div className="space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, shop, 1);
                        }}
                        disabled={isOutOfStock}
                        className="btn btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiShoppingCart size={18} />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleWhatsAppClick(product)}
                        disabled={isOutOfStock}
                        className="btn btn-whatsapp w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        <IoLogoWhatsapp size={20} />
                        {isOutOfStock ? 'Out of Stock' : 'Order on WhatsApp'}
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
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Storefront;
