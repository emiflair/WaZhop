import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FiSearch, FiFilter, FiX, FiShoppingBag, FiStar, FiTrendingUp, FiEye, FiHeart, FiZap, FiSmartphone, FiMonitor, FiGrid } from 'react-icons/fi'
import { FaBaby, FaSpa, FaPaw, FaTools, FaTshirt, FaCouch, FaLeaf, FaDumbbell, FaCar, FaBriefcase } from 'react-icons/fa'
import { productAPI } from '../utils/api'
import { CATEGORY_SUGGESTIONS, CATEGORIES_WITH_SUBCATEGORIES, getCategoryLabel } from '../utils/categories'
import { useDebounce } from '../hooks/useDebounce'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import MobileBottomNav from '../components/MobileBottomNav'
import SEO from '../components/SEO'
import toast from 'react-hot-toast'
// Product details now open on a dedicated page, not a modal
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDetectedCountry from '../hooks/useDetectedCountry'
import { COUNTRY_REGION_MAP, getCountryMeta } from '../utils/location'

// Marketplace hero slider configuration. Replace the background values or provide an `image`
// property when marketing banners are ready. Each slide supports either a background gradient
// or a hosted image URL.
const HERO_SLIDES = [
  {
    id: 'marketplace-banner-1',
    image: '/wazhopbanner/Banner1.PNG'
  },
  {
    id: 'marketplace-banner-2',
    image: '/wazhopbanner/Banner2.PNG'
  },
  {
    id: 'marketplace-banner-3',
    image: '/wazhopbanner/Banner3.PNG'
  },
  {
    id: 'marketplace-banner-4',
    image: '/wazhopbanner/Banner4.PNG'
  },
  {
    id: 'marketplace-banner-5',
    image: '/wazhopbanner/Banner5.PNG'
  },
  {
    id: 'marketplace-banner-6',
    image: '/wazhopbanner/Banner6.PNG'
  }
]

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
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [trendingCategories] = useState([
    { name: 'All Categories', category: 'all', icon: FiGrid },
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

  const {
    countryCode: detectedCountryCode,
    countryName: detectedCountryName
  } = useDetectedCountry()

  const [countryCode, setCountryCode] = useState(detectedCountryCode || '')
  const manualCountrySelection = useRef(false)
  const manualRegionSelection = useRef(false)

  useEffect(() => {
    if (!detectedCountryCode || manualCountrySelection.current) return
    manualRegionSelection.current = false
    setCountryCode(detectedCountryCode)
  }, [detectedCountryCode])

  useEffect(() => {
    if (!detectedCountryCode || manualCountrySelection.current) return
    fetchProducts(true, { country: detectedCountryCode })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCountryCode])

  const selectedCountryMeta = useMemo(() => {
    if (!countryCode) {
      return {
        code: '',
        name: '',
        regionLabel: 'State/Region',
        regions: [],
        defaultRegion: ''
      }
    }
    return getCountryMeta(countryCode)
  }, [countryCode])

  const supportedCountries = useMemo(() => {
    const entries = Object.values(COUNTRY_REGION_MAP).map(({ code, name }) => ({ code, name }))
    if (countryCode && !entries.some((entry) => entry.code === countryCode)) {
      entries.push({ code: countryCode, name: detectedCountryName || countryCode })
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name))
  }, [countryCode, detectedCountryName])

  const regionLabel = selectedCountryMeta.regionLabel || 'State/Region'
  const regionOptions = selectedCountryMeta.regions || []
  const selectedCountryName = selectedCountryMeta.name || ''
  const defaultRegion = selectedCountryMeta.defaultRegion || ''

  const fetchProducts = useCallback(async (reset = false, overrides = {}) => {
    try {
      setLoading(true)
      const {
        search: searchOverride,
        category: categoryOverride,
        state: stateOverride,
        area: areaOverride,
        sort: sortOverride,
        minPrice: minPriceOverride,
        maxPrice: maxPriceOverride,
        country: countryOverride
      } = overrides

      const effectiveCategory = categoryOverride ?? category
      const effectiveSort = sortOverride ?? sortBy
      const effectiveSearch = searchOverride !== undefined
        ? searchOverride.trim()
        : (debouncedSearch ? debouncedSearch.trim() : '')
      const effectiveState = stateOverride ?? ngState
      const effectiveArea = areaOverride ?? area
      const effectiveMinPrice = minPriceOverride ?? priceRange.min
      const effectiveMaxPrice = maxPriceOverride ?? priceRange.max
      const effectiveCountry = countryOverride ?? countryCode
      const params = {
        page: reset ? 1 : page,
        limit: 48,
        ...(effectiveSort ? { sort: effectiveSort } : {}),
        ...(effectiveCategory !== 'all' && { category: effectiveCategory }),
        ...(effectiveSearch && { search: effectiveSearch }),
        ...(effectiveCountry && { country: effectiveCountry }),
        ...(effectiveState && { state: effectiveState }),
        ...(effectiveArea && { area: effectiveArea }),
        ...(effectiveMinPrice && { minPrice: effectiveMinPrice }),
        ...(effectiveMaxPrice && { maxPrice: effectiveMaxPrice })
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
  }, [page, category, debouncedSearch, sortBy, priceRange, ngState, area, countryCode])

  useEffect(() => {
    fetchProducts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, debouncedSearch])

  useEffect(() => {
    if (!regionOptions.length) {
      setNgState('')
      return
    }
    setNgState((prev) => {
      if (prev && regionOptions.includes(prev)) return prev
      if (manualRegionSelection.current && !prev) return prev
      const fallback = defaultRegion || regionOptions[0]
      return fallback
    })
  }, [regionOptions, defaultRegion])

  // When page changes (and not a reset), load more
  useEffect(() => {
    if (page > 1) {
      fetchProducts(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Infinite scroll: Auto-load more items when user scrolls near bottom
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Load more when user is 70% down the page for smoother experience
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.7) {
        setPage(prev => prev + 1);
      }
    };

    // Throttle scroll event to once every 500ms for better performance
    let scrollTimeout;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 500);
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
    fetchProducts(true, { search: searchInput, country: countryCode, state: ngState, area, minPrice: priceRange.min, maxPrice: priceRange.max, sort: sortBy, category })
    setShowDiscoveryPanel(false)
  }

  const selectCategory = (categoryValue) => {
    setCategory(categoryValue)
    setSearchInput('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCountryChange = (value) => {
    manualCountrySelection.current = true
    manualRegionSelection.current = false
    setCountryCode(value)
    setNgState('')
    setArea('')
  }

  const handleRegionChange = (value) => {
    manualRegionSelection.current = true
    setNgState(value)
  }

  const clearFilters = () => {
    setCategory('all')
    setSortBy('')
    setSearchInput('')
    setPriceRange({ min: '', max: '' })
    manualCountrySelection.current = false
    manualRegionSelection.current = false
    setCountryCode(detectedCountryCode || '')
    setNgState('')
    setArea('')
    setPage(1)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1)
    }
  }

  const openDiscoveryPanel = () => setShowDiscoveryPanel(true)
  const openDiscoveryPanelForSort = () => {
    setShowDiscoveryPanel(true)
    // Ensure sort dropdown is visible when panel opens
    setTimeout(() => {
      const sortElement = document.getElementById('marketplace-sort-select')
      if (sortElement) {
        sortElement.focus()
      }
    }, 200)
  }

  const handleClearAll = () => {
    clearFilters()
    fetchProducts(true, { search: '', category: 'all', country: '', state: '', area: '', sort: '', minPrice: '', maxPrice: '' })
    setShowDiscoveryPanel(false)
  }

  const handleRecentSearchClick = (term) => {
    setSearchInput(term)
    setRecentSearches((prev) => {
      const trimmed = term.trim()
      const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
    fetchProducts(true, { search: term })
    setShowDiscoveryPanel(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOpenFilters = () => setShowDiscoveryPanel(true)
    const handleOpenSort = () => openDiscoveryPanelForSort()
    window.addEventListener('openMarketplaceFilters', handleOpenFilters)
    window.addEventListener('openMarketplaceSort', handleOpenSort)
    return () => {
      window.removeEventListener('openMarketplaceFilters', handleOpenFilters)
      window.removeEventListener('openMarketplaceSort', handleOpenSort)
    }
  }, [])

  useEffect(() => {
    if (!showDiscoveryPanel || typeof window === 'undefined') return
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setShowDiscoveryPanel(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showDiscoveryPanel])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const previousOverflow = document.body.style.overflow
    if (showDiscoveryPanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = previousOverflow || ''
    }
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showDiscoveryPanel])

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <SEO
        title="Marketplace"
        description="Browse thousands of products from verified sellers. Best prices, trusted reviews, instant WhatsApp orders."
      />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />

        {/* Hero Slider Section */}
        <section className="relative text-white overflow-hidden bg-gradient-to-r from-primary-500 to-orange-600 dark:from-primary-700 dark:to-orange-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0VjI2aDhWMThoLTh2LThoOHYtOGgtOHY4SDEwdjhIOHY4aDJ2OEg4djhoMnY4aC04djhoOHY4aDh2LThoOHY4aDh2LThoOHYtOGgtOHYtOGg4di04ek0zNCAxOHY4aC04di04aDh6bTAgMTZ2OGgtOHYtOGg4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10 pointer-events-none"></div>
          <div className="relative z-10 pt-4 md:pt-6 pb-0 px-0">
            <div className="max-w-6xl mx-auto flex flex-col gap-1 md:gap-2 px-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white tracking-tight text-center select-none">
                Discover Amazing Products
              </h2>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-center">
                Shop from <span className="text-white/80">Verified</span> Sellers
              </h1>
            </div>

            {/* Full-width banner - mobile simple, desktop full-bleed */}
            <div className="relative mt-3 sm:mt-4 md:mt-6 h-56 sm:h-64 md:h-[500px] lg:h-[600px] xl:h-[650px]">
              {/* Mobile: Simple centered banner */}
              <div className="md:hidden relative h-full w-full rounded-none overflow-hidden bg-transparent">
                {HERO_SLIDES.map((slide, index) => {
                  const isActive = index === currentSlide
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      style={{
                        backgroundImage: slide.image ? `url(${slide.image})` : slide.background || '#111827',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/5" />
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Full-width banner covering both sides */}
              <div className="hidden md:block relative h-full w-full overflow-hidden">
                {HERO_SLIDES.map((slide, index) => {
                  const isActive = index === currentSlide
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      style={{
                        backgroundImage: slide.image ? `url(${slide.image})` : slide.background || '#111827',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/5" />
                    </div>
                  )
                })}

                {/* Autoplay handles slide changes; no manual controls to keep layout clean */}
              </div>

              {!isAuthenticated && (
                <Link
                  to="/register?role=seller"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full bg-white/95 text-primary-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  Start Selling
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Trending Categories Section */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="app-container py-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300">Trending Categories</h3>
            </div>

            {/* Desktop: Grid layout with 2 rows */}
            <div className="hidden sm:grid grid-cols-6 gap-4">
              {trendingCategories.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={i}
                    onClick={() => selectCategory(item.category)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        category === item.category
                          ? 'bg-gradient-to-br from-primary-500 to-orange-500 shadow-lg shadow-primary-500/30 scale-105'
                          : 'bg-gradient-to-br from-primary-500/10 to-orange-500/10 dark:from-primary-500/20 dark:to-orange-500/20 hover:from-primary-500 hover:to-orange-500 hover:shadow-lg hover:shadow-primary-500/20 hover:scale-105'
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 md:w-8 md:h-8 transition-colors duration-300 ${
                          category === item.category
                            ? 'text-white'
                            : 'text-primary-600 dark:text-primary-400 group-hover:text-white'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs md:text-sm font-medium text-center leading-tight transition-colors duration-300 ${
                        category === item.category
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Mobile: Horizontal scroll with circular icons */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-2 px-2">
              <div className="flex gap-4 pb-2">
                {trendingCategories.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={i}
                      onClick={() => selectCategory(item.category)}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                          category === item.category
                            ? 'bg-gradient-to-br from-primary-500 to-orange-500 shadow-lg shadow-primary-500/30 scale-105'
                            : 'bg-gradient-to-br from-primary-500/10 to-orange-500/10 dark:from-primary-500/20 dark:to-orange-500/20'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 transition-colors duration-300 ${
                            category === item.category
                              ? 'text-white'
                              : 'text-primary-600 dark:text-primary-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-medium text-center leading-tight max-w-[60px] transition-colors duration-300 ${
                          category === item.category
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Sort Bar removed – combined into top search icon & full-screen panel */}

        {/* Products Grid */}
        <div className="flex-1 py-5 pb-24 md:pb-8">
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

                {/* Auto-loading indicator */}
                {loading && page > 1 && (
                  <div className="text-center mt-8 mb-8">
                    <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="text-sm font-medium">Loading more products...</span>
                    </div>
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

      {showDiscoveryPanel && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center px-4 sm:px-6 py-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDiscoveryPanel(false)}
          />
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Marketplace Search</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Filter by category, location or keywords in one place.</p>
              </div>
              <button
                onClick={() => setShowDiscoveryPanel(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Close filters"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search products, categories..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    style={{ fontSize: '16px' }}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && searchInput !== debouncedSearch && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide animate-pulse">
                      updating…
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="all">All Categories</option>
                      {Object.keys(CATEGORIES_WITH_SUBCATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Country</label>
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="">All Countries</option>
                      {supportedCountries.map(({ code, name }) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">{`${regionLabel}${selectedCountryName ? ` (${selectedCountryName})` : ''}`}</label>
                    {regionOptions.length > 0 ? (
                      <select
                        value={ngState}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      >
                        <option value="">All Locations</option>
                        {regionOptions.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={ngState}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        placeholder={`State or region${selectedCountryName ? ` in ${selectedCountryName}` : ''}`}
                        className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        style={{ fontSize: '16px' }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Sort</label>
                  <select
                    id="marketplace-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <option value="">Featured (Boosted first)</option>
                    <option value="-createdAt">Newest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="-views">Most Popular</option>
                    <option value="-clicks">Trending</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Area</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                        placeholder={selectedCountryName ? `Area in ${selectedCountryName}` : 'City or area'}
                      className="input text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                  >
                    Clear all
                  </button>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Powered by WaZhop Marketplace</span>
                </div>
              </form>

              {recentSearches.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Recent searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleRecentSearchClick(term)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              e.stopPropagation();
              toast.success('Added to favorites!');
            }}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded-full hover:bg-primary-500 hover:text-white transition-colors shadow-lg"
          >
            <FiHeart className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
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
