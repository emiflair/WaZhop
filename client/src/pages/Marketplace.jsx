import { useState, useEffect, useCallback, useRef } from 'react'
import { FiSearch, FiFilter, FiX, FiShoppingBag, FiStar, FiTrendingUp, FiEye, FiHeart, FiZap, FiSmartphone, FiMonitor } from 'react-icons/fi'
import { FaBaby, FaSpa, FaPaw, FaTools, FaTshirt, FaCouch, FaLeaf, FaDumbbell, FaCar, FaBriefcase } from 'react-icons/fa'
import { productAPI } from '../utils/api'
import { CATEGORY_SUGGESTIONS, CATEGORIES_WITH_SUBCATEGORIES, getCategoryLabel } from '../utils/categories'
import { prefetchProducts, prefetchProductDetail } from '../utils/prefetch'
import { useDebounce } from '../hooks/useDebounce'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import SEO from '../components/SEO'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
// Product details now open on a dedicated page, not a modal
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Marketplace() {
  // Marketplace respects user's theme preference (from ThemeContext/Navbar toggle)
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState('') // Immediate UI update
  const debouncedSearch = useDebounce(searchInput, 300) // Debounced for API calls
  const [category, setCategory] = useState('all')
  // Empty sort means backend default (featured: boosted first)
  const [sortBy, setSortBy] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [ngState, setNgState] = useState('')
  const [area, setArea] = useState('')
  const [trendingCategories] = useState([
    { name: 'Fashion', category: 'fashion', icon: FaTshirt },
    { name: 'Electronics', category: 'electronics', icon: FiMonitor },
    { name: 'Phones & Tablets', category: 'phones-and-tablets', icon: FiSmartphone },
    { name: 'Beauty', category: 'beauty-and-personal-care', icon: FaSpa },
    { name: 'Home & Furniture', category: 'home-furniture-and-appliances', icon: FaCouch },
    { name: 'Babies & Kids', category: 'babies-and-kids', icon: FaBaby },
    { name: 'Vehicles', category: 'vehicles', icon: FaCar },
    { name: 'Sporting Goods', category: 'sporting-goods', icon: FaDumbbell },
    { name: 'Pets', category: 'pets', icon: FaPaw },
    { name: 'Food & Agriculture', category: 'food-agriculture-and-farming', icon: FaLeaf },
    { name: 'Services', category: 'services', icon: FaBriefcase },
    { name: 'Tools & Equipment', category: 'commercial-equipment-and-tools', icon: FaTools }
  ])
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches')
    return saved ? JSON.parse(saved) : []
  })
  const navigate = useNavigate()

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      const params = {
        page: reset ? 1 : page,
        limit: 24,
        ...(sortBy ? { sort: sortBy } : {}),
        ...(category !== 'all' && { category }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(ngState && { state: ngState }),
        ...(area && { area }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max })
      }
      const response = await productAPI.getMarketplaceProducts(params)
      console.log('📦 Marketplace API response:', response)
      // Handle response format: response.data or direct array
      const items = response?.data || (Array.isArray(response) ? response : [])
      if (reset) {
        setProducts(items)
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...items])
      }
      // Infer hasMore from page size
      setHasMore(items.length === (params.limit || 24))
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, category, debouncedSearch, sortBy, priceRange, ngState, area])

  useEffect(() => {
    fetchProducts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, debouncedSearch])

  // When page changes (and not a reset), load more
  useEffect(() => {
    if (page > 1) {
      fetchProducts(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // On-scroll prefetching: Only load next page when user scrolls near bottom
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Prefetch when user is 80% down the page
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8 && products.length >= 12) {
        const nextPageParams = {
          page: page + 1,
          limit: 24,
          ...(sortBy ? { sort: sortBy } : {}),
          ...(category !== 'all' && { category }),
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(ngState && { state: ngState }),
          ...(area && { area }),
          ...(priceRange.min && { minPrice: priceRange.min }),
          ...(priceRange.max && { maxPrice: priceRange.max })
        };
        
        prefetchProducts(nextPageParams).catch(() => {});
      }
    };

    // Throttle scroll event to once per 2 seconds
    let scrollTimeout;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 2000);
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [products, loading, page, sortBy, category, debouncedSearch, ngState, area, priceRange, hasMore]);

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      // Add to recent searches
      const updated = [searchInput, ...recentSearches.filter(s => s !== searchInput)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }
    // fetchProducts will be called automatically by debouncedSearch effect
  }

  const quickSearch = (term) => {
    setSearchInput(term)
    // Debounce will handle the API call automatically
  }

  const selectCategory = (categoryValue) => {
    setCategory(categoryValue)
    setSearchInput('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setCategory('all')
    setSortBy('')
    setSearchInput('')
    setPriceRange({ min: '', max: '' })
    setNgState('')
    setArea('')
    setPage(1)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1)
    }
  }

  return (
    <>
      <SEO
        title="Marketplace - Discover Products from Top Sellers"
        description="Browse thousands of products from verified sellers. Best prices, trusted reviews, instant WhatsApp orders."
      />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />

        {/* Discover Amazing Products Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-orange-600 dark:from-primary-700 dark:to-orange-800 py-2 sm:py-3 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight px-4 select-none">
            <span className="inline">Discover</span>{' '}
            <span className="inline text-white/70">Amazing</span>{' '}
            <span className="inline">Products</span>
          </h2>
        </div>

        {/* Hero Section - Compact */}
        <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-orange-600 dark:from-primary-700 dark:via-primary-800 dark:to-orange-800 text-white overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0VjI2aDhWMThoLTh2LThoOHYtOGgtOHYtOGgtOHY4SDEwdjhIOHY4aDJ2OEg4djhoMnY4aC04djhoOHY4aDh2LThoOHY4aDh2LThoOHYtOGgtOHYtOGg4di04ek0zNCAxOHY4aC04di04aDh6bTAgMTZ2OGgtOHYtOGg4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
          
          <div className="app-container relative z-10 py-2 sm:py-3 md:py-4">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1.5 sm:mb-2">
                Shop from <span className="text-white/90">Verified</span> Sellers
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-2xl mx-auto mb-2 sm:mb-3">
                Thousands of products. Best deals. Instant WhatsApp checkout.
              </p>

              {/* Get Started CTA for guests */}
              {!isAuthenticated && (
                <div className="mb-2 sm:mb-3">
                  <Link
                    to="/register?role=seller"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-white text-primary-600 hover:bg-gray-50 active:bg-gray-100 shadow-lg transition-all duration-200"
                  >
                    Start Selling
                  </Link>
                </div>
              )}



              {/* Search */}
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Search products, categories..."
                    className="w-full pl-10 pr-24 py-2 sm:py-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 shadow-lg focus:ring-2 focus:ring-white/30 text-base font-medium placeholder:text-gray-400"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && searchInput !== debouncedSearch && (
                    <span className="absolute right-32 sm:right-36 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                      searching...
                    </span>
                  )}
                  <button 
                    type="submit" 
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-primary-600 to-orange-600 text-white font-semibold rounded-md hover:from-primary-700 hover:to-orange-700 transition-all duration-200 shadow-md text-xs sm:text-sm"
                  >
                    Search
                  </button>
                </div>
              </form>
              {/* Filters */}
              <div className="mt-1.5 sm:mt-2 max-w-3xl mx-auto">
                {/* Row 1: Category and State */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-1.5 sm:mb-3">
                  <select 
                    value={category} 
                    onChange={(e)=>setCategory(e.target.value)} 
                    className="px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 text-gray-700 dark:text-gray-200 font-medium shadow-lg focus:ring-4 focus:ring-white/30"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(CATEGORIES_WITH_SUBCATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                  </select>
                  <select 
                    value={ngState} 
                    onChange={(e)=>setNgState(e.target.value)} 
                    className="px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 text-gray-700 dark:text-gray-200 font-medium shadow-lg focus:ring-4 focus:ring-white/30"
                  >
                    <option value="">All States</option>
                    {['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'].map(s=> (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Row 2: Area and Apply */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <input 
                    className="col-span-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 text-gray-700 dark:text-gray-200 font-medium shadow-lg focus:ring-4 focus:ring-white/30 placeholder:text-gray-400" 
                    type="text" 
                    value={area} 
                    placeholder="Area (e.g., V.I.)" 
                    onChange={(e)=>setArea(e.target.value)} 
                  />
                  <button 
                    onClick={()=>fetchProducts(true)} 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-primary-600 dark:text-primary-400 font-semibold rounded-lg sm:rounded-xl hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 touch-target"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Trending Categories */}
              {!searchInput && (
                <div className="mt-1.5 sm:mt-2">
                  {/* Desktop - Centered flex wrap */}
                  <div className="hidden sm:flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                    <span className="text-xs text-white/80 font-bold uppercase tracking-wider self-center">Trending:</span>
                    {trendingCategories.map((item, i) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={i}
                          onClick={() => selectCategory(item.category)}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-full transition-all duration-200 border border-white/30 flex items-center gap-1.5 touch-target hover:scale-105 transform"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {item.name}
                        </button>
                      )
                    })}
                  </div>

                  {/* Mobile - Horizontal scroll with icons and text */}
                  <div className="sm:hidden">
                    <div className="text-xs text-white/90 font-bold uppercase tracking-wider mb-2 text-center">Trending Categories</div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
                      {trendingCategories.map((item, i) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={i}
                            onClick={() => selectCategory(item.category)}
                            className="flex-shrink-0 px-3 py-2 bg-white/20 active:bg-white/30 backdrop-blur-sm text-white text-xs font-medium rounded-full transition-all duration-200 border border-white/30 flex items-center gap-1.5 touch-target shadow-sm"
                            aria-label={item.name}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">{item.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Sort Bar - Native App Style */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="app-container py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-target"
              >
                <FiFilter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>

              {/* Category Pills - Native Style */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap flex-1 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setCategory('all')}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 whitespace-nowrap touch-target ${
                    category === 'all'
                      ? 'bg-gradient-to-r from-primary-600 to-orange-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                  }`}
                >
                  All
                </button>
                {CATEGORY_SUGGESTIONS.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 whitespace-nowrap touch-target ${
                      category === cat
                        ? 'bg-gradient-to-r from-primary-600 to-orange-600 text-white shadow-lg shadow-primary-500/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                    }`}
                  >
                    {cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown - Native Style */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium border-0 focus:ring-2 focus:ring-primary-500 text-sm shadow-md touch-target"
              >
                <option value="">Featured (Boosted first)</option>
                <option value="-createdAt">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-views">Most Popular</option>
                <option value="-clicks">Trending</option>
              </select>

              {/* Clear Filters */}
              {(category !== 'all' || searchInput || priceRange.min || priceRange.max || ngState || area) && (
                <button onClick={clearFilters} className="btn btn-outline text-sm flex items-center gap-2">
                  <FiX /> Clear
                </button>
              )}
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && (
              <div className="sm:hidden mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                <div>
                  <label className="label text-sm mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input text-sm">
                    <option value="all">All Categories</option>
                    {CATEGORY_SUGGESTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">State</label>
                    <select value={ngState} onChange={(e)=>setNgState(e.target.value)} className="input text-sm">
                      <option value="">All States</option>
                      {['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'].map(s=> (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Area</label>
                    <input className="input text-sm" type="text" value={area} placeholder="e.g., VI" onChange={(e)=>setArea(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Min Price</label>
                    <input
                      type="number"
                      placeholder="₦0"
                      className="input text-sm"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Max Price</label>
                    <input
                      type="number"
                      placeholder="₦999999"
                      className="input text-sm"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
                    />
                  </div>
                </div>
                <button onClick={() => { fetchProducts(true); setShowFilters(false); }} className="btn btn-primary w-full text-sm">
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 py-8 pb-24 md:pb-8">
          <div className="container-custom">
            {loading && page === 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {Array(10).fill(0).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <FiShoppingBag className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                  {products.map((product, index) => (
                    <ProductCard 
                      key={product._id} 
                      product={product}
                      index={index}
                      onOpen={() => navigate(`/product/${product._id}`, { 
                        state: { fromMarketplace: true }
                      })}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-12 mb-8">
                    <button onClick={loadMore} disabled={loading} className="btn btn-primary px-8">
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Product detail opens on a separate page now */}
    </>
  )
}

function ProductCard({ product, onOpen, index = 0 }) {
  const image = product.images?.[0]?.url || '/placeholder.png'
  const rating = product.reviewStats?.avgRating || 0
  const [isHovered, setIsHovered] = useState(false)
  
  // Eager load first 10 products (above the fold), lazy load the rest
  const shouldEagerLoad = index < 10
  
  // Trending logic: high views/clicks in last 24h
  const isTrending = product.views > 50 || product.clicks > 20
  const isHot = product.clicks > 50 // Very popular

  // Smart prefetch: Only on long hover (user showing clear interest)
  const hoverTimerRef = useRef(null);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    // Only prefetch if user hovers for 500ms+ (shows real interest)
    hoverTimerRef.current = setTimeout(() => {
      prefetchProductDetail(product._id).catch(() => {});
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return (
    <div
      onClick={() => onOpen()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="product-card-border group bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 dark:hover:shadow-gray-900 transition-all duration-300 border-2"
    >
      {/* Image */}
      <div 
        className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900"
      >
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading={shouldEagerLoad ? "eager" : "lazy"}
          fetchPriority={shouldEagerLoad ? "high" : "auto"}
        />
        
        {/* WaZhop Watermark for Free Users Only */}
        {(product.shop?.owner?.plan === 'free' || (!product.shop?.owner?.plan && product.shop?.owner?._id)) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
              <svg className="w-6 h-6 text-primary-600" viewBox="0 0 100 100" fill="currentColor">
                <text x="50" y="70" fontSize="80" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">W</text>
              </svg>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">WaZhop</span>
            </div>
          </div>
        )}
        
        {/* Multiple Images Indicator */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            +{product.images.length - 1} photos
          </div>
        )}

        {/* Boosted Badge */}
        {product.isBoosted && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <FiZap className="w-3 h-3" />
            <span>Boosted</span>
          </div>
        )}

        {/* Trending/Hot Badge */}
        {!product.isBoosted && isHot && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <FiZap className="w-3 h-3" />
            <span>Hot</span>
          </div>
        )}
        {!product.isBoosted && !isHot && isTrending && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <FiTrendingUp className="w-3 h-3" />
            <span>Trending</span>
          </div>
        )}

        {/* Discount Badge */}
        {product.comparePrice && product.comparePrice > product.price && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-lg">
          <FiStar className="text-yellow-500 w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-100 font-semibold">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
          {product.reviewStats?.count > 0 && (
            <span className="text-gray-500 dark:text-gray-400">({product.reviewStats.count})</span>
          )}
        </div>

        {/* Hover Quick Actions */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toast.success('Added to favorites!')
            }}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-full hover:bg-primary-500 hover:text-white transition-colors shadow-lg"
          >
            <FiHeart className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-700 transition-colors shadow-lg font-semibold text-sm"
          >
            Quick View
          </button>
        </div>

        {/* Live Activity Indicator */}
        {product.views > 10 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 shadow-lg">
            <FiEye className="w-3 h-3 text-primary-500" />
            <span className="font-medium">{product.views}</span>
            <span className="text-gray-500">viewing</span>
          </div>
        )}
      </div>

      {/* Content - compact */}
      <div className="p-3 sm:p-3">
        <h3 className="font-semibold text-sm sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[2.25rem]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex-1">
            <div className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
              ₦{product.price?.toLocaleString()}
            </div>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                ₦{product.comparePrice.toLocaleString()}
              </div>
            )}
          </div>
          {product.inStock ? (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              In Stock
            </span>
          ) : (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        {/* Shop Info - tighter */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-1.5 mt-1.5">
          <FiShoppingBag className="shrink-0 w-3.5 h-3.5" />
          <span className="truncate font-medium">{product.shop?.shopName || 'Shop'}</span>
          {(product.shop?.owner?.plan === 'pro' || product.shop?.owner?.plan === 'premium') && (
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Price am Button - compact */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="mt-2 w-full btn btn-primary text-sm py-2 font-semibold hover:shadow-lg transition-shadow"
        >
          Price am
        </button>
      </div>
    </div>
  )
}

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 sm:p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  )
}
