import { useState, useEffect, useCallback } from 'react'
import { FiSearch, FiFilter, FiX, FiShoppingBag, FiStar } from 'react-icons/fi'
import { productAPI } from '../utils/api'
import { CATEGORY_SUGGESTIONS } from '../utils/categories'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import ProductDetailModal from '../components/ProductDetailModal'

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('-createdAt')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [selectedProduct, setSelectedProduct] = useState(null)

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      const params = {
        page: reset ? 1 : page,
        limit: 24,
        sort: sortBy,
        ...(category !== 'all' && { category }),
        ...(search && { search }),
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max })
      }
      const res = await productAPI.getMarketplaceProducts(params)
      if (reset) {
        setProducts(res.data || [])
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...(res.data || [])])
      }
      setHasMore(res.pagination?.hasNextPage || false)
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, category, search, sortBy, priceRange])

  useEffect(() => {
    fetchProducts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, search])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts(true)
  }

  const clearFilters = () => {
    setCategory('all')
    setSortBy('-createdAt')
    setSearch('')
    setPriceRange({ min: '', max: '' })
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1)
      fetchProducts(false)
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

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 dark:from-primary-700 dark:via-primary-600 dark:to-primary-700 text-white py-12 sm:py-16 md:py-20">
          <div className="container-custom text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              Discover <span className="text-primary-200">Amazing</span> Products
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              Shop from thousands of verified sellers. Best deals. Trusted reviews. Instant WhatsApp checkout.
            </p>

            {/* Hero Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search products, sellers, categories..."
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 focus:ring-2 focus:ring-primary-300 text-sm sm:text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary px-6 sm:px-8 text-sm sm:text-base whitespace-nowrap">
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Filters & Sort Bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container-custom py-3 sm:py-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden btn btn-outline flex items-center gap-2 text-sm"
              >
                <FiFilter /> Filters
              </button>

              {/* Desktop Category Pills */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap flex-1">
                <button
                  onClick={() => setCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {CATEGORY_SUGGESTIONS.slice(0, 6).map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      category === cat.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input py-2 text-sm w-auto"
              >
                <option value="-createdAt">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-views">Most Popular</option>
                <option value="-clicks">Trending</option>
              </select>

              {/* Clear Filters */}
              {(category !== 'all' || search || priceRange.min || priceRange.max) && (
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
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
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
        <div className="flex-1 py-8">
          <div className="container-custom">
            {loading && page === 1 ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} onSelect={setSelectedProduct} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-12">
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  )
}

function ProductCard({ product, onSelect }) {
  const image = product.images?.[0] || '/placeholder.png'
  const rating = product.reviewStats?.avgRating || 0
  const reviewCount = product.reviewStats?.count || 0

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {product.comparePrice && product.comparePrice > product.price && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
          <FiStar className="text-yellow-500" />
          <span className="text-gray-900 dark:text-gray-100">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
              ₦{product.price?.toLocaleString()}
            </div>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                ₦{product.comparePrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Shop Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
          <FiShoppingBag className="shrink-0" />
          <span className="truncate">{product.shop?.shopName || 'Shop'}</span>
        </div>

        {reviewCount > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </div>
        )}
      </div>
    </div>
  )
}
