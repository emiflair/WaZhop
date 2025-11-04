import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopAPI, productAPI } from '../../utils/api';
import { FiShoppingBag, FiEye, FiMousePointer, FiExternalLink } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import InstallPWA from '../../components/InstallPWA';

const Dashboard = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    views: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Check if user has dismissed the install prompt
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      setShowInstallPrompt(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [shopData, shopsData, productsData] = await Promise.all([
        shopAPI.getMyShop(),
        shopAPI.getMyShops(),
        productAPI.getMyProducts(),
      ]);

      setShop(shopData);
      setShops(shopsData.shops || []);

      // Calculate stats
      const activeCount = productsData.filter((p) => p.isActive).length;
      const totalViews = productsData.reduce((sum, p) => sum + p.views, 0);
      const totalClicks = productsData.reduce((sum, p) => sum + p.clicks, 0);

      setStats({
        totalProducts: productsData.length,
        activeProducts: activeCount,
        views: totalViews + (shopData.views || 0),
        clicks: totalClicks,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Open shop link in browser (not within PWA)
  const openShopInBrowser = (slug) => {
    const url = `${window.location.origin}/${slug}`;
    // Check if running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    
    if (isStandalone) {
      // Open in external browser
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Open in new tab
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
        {/* Welcome Header - Mobile Optimized */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Here&apos;s what&apos;s happening with your shop today.
          </p>
        </div>

        {/* PWA Install Prompt */}
        {showInstallPrompt && (
          <InstallPWA onClose={handleDismissInstallPrompt} />
        )}

        {/* Shop Link - Mobile Optimized */}
        {shop && (
          <div className="card bg-gradient-to-r from-primary-700 to-primary-900 dark:from-primary-600 dark:to-primary-800 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Your Shop Link</h3>
                <button
                  onClick={() => openShopInBrowser(shop.slug)}
                  className="text-primary-100 hover:text-white active:text-primary-200 flex items-center gap-2 text-sm sm:text-base break-all sm:break-normal touch-manipulation text-left"
                >
                  <span className="truncate">wazhop.com/{shop.slug}</span>
                  <FiExternalLink className="flex-shrink-0" />
                </button>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${shop.slug}`);
                  alert('Link copied!');
                }}
                className="btn bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 active:bg-primary-100 dark:active:bg-primary-900/50 w-full sm:w-auto text-sm sm:text-base touch-manipulation"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* All Shops Links - Mobile Optimized */}
        {shops.length > 0 && (
          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <FaStore className="text-blue-600 dark:text-blue-400" />
                All Your Shops ({shops.length})
              </h3>
              <Link 
                to="/dashboard/shops" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm touch-manipulation min-h-[44px] flex items-center"
              >
                Manage Shops
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {shops.map((shopItem) => (
                <div
                  key={shopItem._id}
                  className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md active:shadow transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base truncate">{shopItem.shopName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{shopItem.category}</p>
                    </div>
                    {shopItem.logo?.url && (
                      <img
                        src={shopItem.logo.url}
                        alt={shopItem.shopName}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openShopInBrowser(shopItem.slug)}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 active:text-blue-800 dark:active:text-blue-200 flex items-center gap-1 truncate flex-1 min-w-0 touch-manipulation min-h-[44px] text-left"
                      title={`wazhop.com/${shopItem.slug}`}
                    >
                      <FiExternalLink size={12} className="flex-shrink-0" />
                      <span className="truncate">{shopItem.slug}</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${shopItem.slug}`);
                        alert('Link copied!');
                      }}
                      className="text-xs px-2 py-2 sm:py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded transition touch-manipulation min-h-[44px] sm:min-h-[32px] flex items-center"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 dark:text-gray-100">{stats.totalProducts}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiShoppingBag className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Active Products</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 dark:text-gray-100">{stats.activeProducts}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiShoppingBag className="text-green-600 dark:text-green-400" size={20} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Views</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 dark:text-gray-100">{stats.views}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiEye className="text-purple-600 dark:text-purple-400" size={20} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">WhatsApp Clicks</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 dark:text-gray-100">{stats.clicks}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiMousePointer className="text-orange-600 dark:text-orange-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="card">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 dark:text-gray-100">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link to="/dashboard/shops" className="btn btn-primary text-center text-sm sm:text-base touch-manipulation">
              Manage Shops
            </Link>
            <Link to="/dashboard/products" className="btn btn-outline text-center text-sm sm:text-base touch-manipulation">
              Add New Product
            </Link>
            <Link to="/dashboard/shop" className="btn btn-outline text-center text-sm sm:text-base touch-manipulation">
              Customize Shop
            </Link>
            <button 
              onClick={() => shop && openShopInBrowser(shop.slug)}
              className="btn btn-secondary text-center text-sm sm:text-base touch-manipulation"
            >
              View Shop
            </button>
          </div>
        </div>

        {/* Current Plan - Mobile Optimized */}
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold dark:text-gray-100">Current Plan</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                You&apos;re on the <span className="font-semibold capitalize">{user?.plan}</span> plan
              </p>
            </div>
            {user?.plan === 'free' && (
              <Link 
                to="/dashboard/subscription" 
                className="btn btn-accent w-full sm:w-auto text-sm sm:text-base touch-manipulation"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
