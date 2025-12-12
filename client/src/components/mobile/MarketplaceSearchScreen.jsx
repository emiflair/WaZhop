import { useEffect, useRef } from 'react'
import { FiArrowLeft, FiSearch, FiX } from 'react-icons/fi'

export default function MarketplaceSearchScreen({
  onClose,
  onSubmit,
  onClearAll,
  searchInput,
  setSearchInput,
  debouncedSearch,
  category,
  onCategoryChange,
  categories,
  countryCode,
  onCountryChange,
  supportedCountries,
  regionLabel,
  selectedCountryName,
  regionOptions,
  ngState,
  onRegionChange,
  sortBy,
  onSortChange,
  area,
  onAreaChange,
  recentSearches,
  onRecentSearchClick
}) {
  const searchRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current?.focus()
    }, 120)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-[1040] bg-black/5 dark:bg-black/10"
        onClick={onClose}
        style={{ marginTop: 'calc(env(safe-area-inset-top) + 60px)' }}
      />
      
      {/* Dropdown panel */}
      <div className="fixed left-0 right-0 z-[1050] mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ top: 'calc(env(safe-area-inset-top) + 70px)' }}>
        {/* Glass effect container */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition"
              aria-label="Close search"
            >
              <FiX className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Marketplace Search</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Filter by category, location, and keywords.</p>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
        <form onSubmit={onSubmit} className="space-y-5 pt-5">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products, categories..."
              className="w-full rounded-xl border border-gray-300/20 dark:border-gray-600/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md pl-10 pr-11 py-3 text-sm text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:text-gray-100"
              style={{ fontSize: '16px' }}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Clear search"
              >
                <FiX className="h-4 w-4" />
              </button>
            ) : null}
            {searchInput && searchInput !== debouncedSearch && (
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">updating…</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Category</label>
              <select
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
              >
                <option value="all">All Categories</option>
                {categories.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Country</label>
              <select
                value={countryCode}
                onChange={(event) => onCountryChange(event.target.value)}
                className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
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
                  onChange={(event) => onRegionChange(event.target.value)}
                  className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
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
                  onChange={(event) => onRegionChange(event.target.value)}
                  placeholder={`State or region${selectedCountryName ? ` in ${selectedCountryName}` : ''}`}
                  className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
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
              onChange={(event) => onSortChange(event.target.value)}
              className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
            >
              <option value="">Featured (Boosted first)</option>
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-views">Most Popular</option>
              <option value="-clicks">Trending</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Area</label>
              <input
                type="text"
                value={area}
                onChange={(event) => onAreaChange(event.target.value)}
                placeholder={selectedCountryName ? `Area in ${selectedCountryName}` : 'City or area'}
                className="input text-sm bg-white/30 dark:bg-gray-800/30 border-gray-300/20 dark:border-gray-600/20 backdrop-blur-md"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClearAll}
              className="text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Clear all
            </button>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Powered by WaZhop Marketplace</span>
          </div>
        </form>

        {recentSearches.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Recent searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onRecentSearchClick(term)}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-primary-600 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-primary-500"
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
    </>
  )
}
