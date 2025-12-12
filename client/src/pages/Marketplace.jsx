import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { FiShoppingBag, FiStar, FiTrendingUp, FiEye, FiHeart, FiZap, FiSmartphone, FiMonitor, FiGrid, FiMapPin, FiChevronDown, FiSearch, FiCamera, FiMenu } from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import { FaBaby, FaSpa, FaPaw, FaTools, FaTshirt, FaCouch, FaLeaf, FaDumbbell, FaCar, FaBriefcase } from 'react-icons/fa'
import { Capacitor } from '@capacitor/core'
import { productAPI, userAPI } from '../utils/api'
import { CATEGORY_SUGGESTIONS, CATEGORIES_WITH_SUBCATEGORIES, getCategoryLabel } from '../utils/categories'
import { useDebounce } from '../hooks/useDebounce'
import Navbar from '../components/Navbar'
import MobileBottomNav from '../components/MobileBottomNav'
import SEO from '../components/SEO'
import toast from 'react-hot-toast'
// Product details now open on a dedicated page, not a modal
import { useNavigate } from 'react-router-dom'
import useDetectedCountry from '../hooks/useDetectedCountry'
import { COUNTRY_REGION_MAP, getCountryMeta } from '../utils/location'
import MarketplaceSearchScreen from '../components/mobile/MarketplaceSearchScreen'
import { useAuth } from '../context/AuthContext'
import { useImageSearch } from '../hooks/useImageSearch'
import PriceTag from '../components/PriceTag'
import { formatPrice } from '../utils/currency'

const CATEGORY_OPTIONS = Object.keys(CATEGORIES_WITH_SUBCATEGORIES).map((key) => ({
  key,
  label: getCategoryLabel(key)
}))

export default function Marketplace() {
  // Marketplace respects user's theme preference (from ThemeContext/Navbar toggle)
  const isNativeApp = Capacitor.isNativePlatform();
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState('') // Immediate UI update
  const debouncedSearch = useDebounce(searchInput, 300) // Debounced for API calls
  const [category, setCategory] = useState('all')
  // Empty sort means backend default (featured: boosted first)
  const [sortBy, setSortBy] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [ngState, setNgState] = useState('')
  const [area, setArea] = useState('')
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false)
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const scrollTimeout = useRef(null)
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
  const cameraInputRef = useRef(null)
  const { isAuthenticated, user, updateUser } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const { classifyImage, isClassifying } = useImageSearch()

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

  const locationParts = useMemo(() => {
    const parts = []
    const trimmedArea = area?.trim()
    const trimmedState = ngState?.trim()
    const trimmedCountry = (selectedCountryName || detectedCountryName || '').trim()

    if (trimmedArea) parts.push(trimmedArea)
    if (trimmedState && trimmedState !== trimmedArea) parts.push(trimmedState)
    if (trimmedCountry && !parts.includes(trimmedCountry)) parts.push(trimmedCountry)

    return parts
  }, [area, ngState, selectedCountryName, detectedCountryName])

  useEffect(() => {
    if (!user?.favorites) {
      setFavoriteIds(new Set())
      return
    }

    const normalized = user.favorites.map((fav) => {
      if (!fav) return null
      if (typeof fav === 'string') return fav
      return fav._id || fav.id
    }).filter(Boolean)

    setFavoriteIds(new Set(normalized))
  }, [user?.favorites])

  const syncFavorites = useCallback((favorites = []) => {
    const normalized = favorites.map((fav) => (typeof fav === 'string' ? fav : fav?._id || fav?.id)).filter(Boolean)
    setFavoriteIds(new Set(normalized))
    updateUser({ favorites })
  }, [updateUser])

  const handleToggleFavorite = useCallback(async (product, isFavorited) => {
    if (!isAuthenticated) {
      toast.error('Create a free account to save favorites')
      navigate('/login', { state: { from: `/product/${product._id}`, message: 'Please login or create an account to save favorites' } })
      return
    }

    try {
      const response = isFavorited
        ? await userAPI.removeFavorite(product._id)
        : await userAPI.addFavorite(product._id)

      const favorites = response?.data?.favorites || []
      syncFavorites(favorites)
      toast.success(isFavorited ? 'Removed from favorites' : 'Saved to favorites')
    } catch (error) {
      console.error('Failed to toggle favorite', error)
      const message = error?.response?.data?.message || 'Unable to update favorites right now'
      toast.error(message)
    }
  }, [isAuthenticated, navigate, syncFavorites])

  const deliveryAddress = locationParts.join(', ')
  const hasDeliveryAddress = deliveryAddress.length > 0
  const deliverySubtitle = hasDeliveryAddress ? 'Tap to update your delivery location' : 'Tap to set your delivery location'

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
      console.log('🔍 Fetching products with params:', params)
      const response = await productAPI.getMarketplaceProducts(params)
      console.log('📦 Marketplace API response:', response)
      // Handle response format: response.data or direct array
      const items = response?.data || (Array.isArray(response) ? response : [])
      const normalizedItems = (items || []).map((product) => {
        const fallbackCurrency = product?.currency || product?.shop?.paymentSettings?.currency || 'NGN'
        const currencyCode = typeof fallbackCurrency === 'string' ? fallbackCurrency.toUpperCase() : 'NGN'
        return {
          ...product,
          currency: currencyCode,
          priceUSD: typeof product?.priceUSD === 'number' ? product.priceUSD : null,
          comparePriceUSD: typeof product?.comparePriceUSD === 'number' ? product.comparePriceUSD : null
        }
      })
      if (reset) {
        setProducts(normalizedItems)
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...normalizedItems])
      }
      // Infer hasMore from page size
      setHasMore(normalizedItems.length === (params.limit || 24))
    } catch (err) {
      console.error('❌ Marketplace fetch error:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config
      })
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

  const processImageSearch = useCallback(async (file) => {
    if (!file) return

    if (isClassifying) {
      toast('Analyzing previous photo…', { icon: '⏳' })
      return
    }

    const toastId = toast.loading('Analyzing your photo…')

    try {
      const predictions = await classifyImage(file, { maxResults: 5 })

      toast.dismiss(toastId)

      if (!predictions || predictions.length === 0) {
        toast('No close matches found yet. Try another angle with good lighting.', { icon: '🤔' })
        return
      }

      const candidateLabels = predictions
        .map((prediction) => prediction?.className?.split(',')[0]?.trim())
        .filter(Boolean)

      const primaryQuery = candidateLabels[0]

      if (!primaryQuery) {
        toast('Couldn’t understand that photo. Try again with a clearer shot.', { icon: '🤔' })
        return
      }

      setCategory('all')
      setSearchInput(primaryQuery)
      setPage(1)

      setRecentSearches((prev) => {
        const trimmed = primaryQuery.trim()
        const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 5)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
        return updated
      })

      fetchProducts(true, { search: primaryQuery, category: 'all' })

      if (candidateLabels.length > 1) {
        toast.success(`Searching for “${primaryQuery}”. Other matches: ${candidateLabels.slice(1, 3).join(', ')}`)
      } else {
        toast.success(`Searching for “${primaryQuery}”`)
      }
    } catch (error) {
      toast.dismiss(toastId)
      console.error('Image search failed', error)
      toast.error('Unable to analyze that photo. Please retake it with better lighting.')
    }
  }, [classifyImage, fetchProducts, isClassifying])

  const handleCameraClick = (event) => {
    event.stopPropagation()
    if (isClassifying) {
      toast('Analyzing previous photo…', { icon: '⏳' })
      return
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleCameraChange = async (event) => {
    const [file] = event.target.files || []
    if (!file) return

    try {
      await processImageSearch(file)
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOpenFilters = () => setShowDiscoveryPanel(true)
    const handleOpenSort = () => openDiscoveryPanelForSort()
    const handlePhotoCapture = (event) => {
      const file = event.detail?.file
      if (file) {
        processImageSearch(file)
      }
    }
    window.addEventListener('openMarketplaceFilters', handleOpenFilters)
    window.addEventListener('openMarketplaceSort', handleOpenSort)
    window.addEventListener('marketplacePhotoCapture', handlePhotoCapture)
    return () => {
      window.removeEventListener('openMarketplaceFilters', handleOpenFilters)
      window.removeEventListener('openMarketplaceSort', handleOpenSort)
      window.removeEventListener('marketplacePhotoCapture', handlePhotoCapture)
    }
  }, [processImageSearch])

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

  // Scroll listener to show sticky header when scrolling stops
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const scrollY = window.scrollY
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      // Hide immediately when scrolling
      setShowStickyHeader(false)

      // Show after scrolling stops for 150ms and scrolled past the original sections
      if (scrollY > 200) {
        scrollTimeout.current = setTimeout(() => {
          setShowStickyHeader(true)
        }, 150)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return (
    <>
      <SEO
        title="Marketplace - Discover Products from Top Sellers"
        description="Browse thousands of products from verified sellers. Best prices, trusted reviews, instant WhatsApp orders."
      />
      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
        aria-hidden="true"
      />
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Navbar />



        {/* Fixed Search Bar + Categories as one unit */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 -mt-safe pt-safe">
          {/* Background that extends behind status bar */}
          <div className="absolute inset-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"></div>
          
          {/* Content stays below status bar */}
          <div className="relative">
            {/* Search bar */}
            <div className="px-3 flex items-center gap-3" style={{ paddingTop: isNativeApp ? 'calc(env(safe-area-inset-top) + 65px)' : '12px', paddingBottom: '12px' }}>
              <button
                onClick={openDiscoveryPanel}
                className="flex-1 flex items-center gap-3 h-11 rounded-md bg-gray-100 dark:bg-gray-800 px-3.5 shadow-sm active:bg-gray-200 dark:active:bg-gray-700 transition"
              >
                <FiSearch size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="flex-1 text-left text-[15px] text-gray-600 dark:text-gray-400">
                  Search WaZhop
                </span>
                <button
                  onClick={handleCameraClick}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                  aria-label="Search by image"
                  type="button"
                >
                  <FiCamera size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </button>
              <button
                onClick={() => {
                  const event = new CustomEvent('toggleMobileMenu');
                  window.dispatchEvent(event);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex-shrink-0"
                aria-label="Open menu"
              >
                <FiMenu size={24} />
              </button>
            </div>

            {/* Categories inside fixed header */}
            <div className="px-3 pb-0">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4">
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
        </div>

        {/* Desktop Deliver To + Categories Section */}
        <div className="hidden md:block bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div className="app-container py-3">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={openDiscoveryPanel}
                className="w-full flex items-center justify-between rounded-lg bg-gray-600/30 md:bg-gray-100 px-3 py-2.5 text-left transition hover:bg-gray-600/40 md:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:md:bg-gray-800 dark:md:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-500/40 md:bg-gray-200 text-white md:text-gray-900 dark:md:bg-gray-700 dark:md:text-gray-100">
                    <FiMapPin className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-300 md:text-gray-500 dark:md:text-gray-400">Deliver to</span>
                    <span className="text-sm font-bold text-white md:text-gray-900 dark:md:text-white">
                      {hasDeliveryAddress ? deliveryAddress : 'Set delivery address'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">{deliverySubtitle}</span>
                  <FiChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
              </button>
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
          </div>
        </div>

        {/* Spacer for fixed header with categories */}
        <div className="md:hidden" style={{ height: isNativeApp ? 'calc(env(safe-area-inset-top) + 100px)' : '75px' }}></div>

        {/* Filters & Sort Bar removed – combined into top search icon & full-screen panel */}

        {/* Products Grid */}
        <div className="flex-1 pt-0 sm:pt-4 pb-24 md:pb-8">
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
                      isFavorited={favoriteIds.has(product._id)}
                      onToggleFavorite={(isFavorited) => handleToggleFavorite(product, isFavorited)}
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

        <MobileBottomNav />
      </div>

      {showDiscoveryPanel && (
        <MarketplaceSearchScreen
          onClose={() => setShowDiscoveryPanel(false)}
          onSubmit={handleSearch}
          onClearAll={handleClearAll}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          debouncedSearch={debouncedSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={CATEGORY_OPTIONS}
          countryCode={countryCode}
          onCountryChange={handleCountryChange}
          supportedCountries={supportedCountries}
          regionLabel={regionLabel}
          selectedCountryName={selectedCountryName}
          regionOptions={regionOptions}
          ngState={ngState}
          onRegionChange={handleRegionChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          area={area}
          onAreaChange={setArea}
          recentSearches={recentSearches}
          onRecentSearchClick={handleRecentSearchClick}
        />
      )}

      {/* Product detail opens on a separate page now */}
    </>
  )
}

function ProductCard({ product, onOpen, index = 0, isFavorited = false, onToggleFavorite }) {
  const image = product.images?.[0]?.url || '/placeholder.png'
  const rating = product.reviewStats?.avgRating || 0
  const [isHovered, setIsHovered] = useState(false)
  const productCurrency = product.currency || product?.shop?.paymentSettings?.currency || 'NGN'
  
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

  const handleFavoriteClick = (event) => {
    event?.stopPropagation()
    onToggleFavorite?.(isFavorited)
  }

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
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="flex-1 font-semibold text-sm sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors min-h-[2.25rem]">
            {product.name}
          </h3>
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            className={`shrink-0 rounded-full p-2 transition-colors ${isFavorited ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'text-gray-500 hover:text-primary-600 bg-gray-100 dark:bg-gray-800/80 dark:hover:text-primary-400'}`}
          >
            {isFavorited ? <AiFillHeart className="w-4 h-4" /> : <FiHeart className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <div className="flex-1">
            <PriceTag
              price={product.price}
              currency={productCurrency}
              priceUSD={product.priceUSD}
              primaryClassName="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400"
              convertedClassName="text-xs text-gray-500 dark:text-gray-400"
            />
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(product.comparePrice, productCurrency)}
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
