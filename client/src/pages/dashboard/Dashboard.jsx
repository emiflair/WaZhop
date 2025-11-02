import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopAPI, productAPI } from '../../utils/api';
import { FiShoppingBag, FiEye, FiMousePointer, FiExternalLink } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    views: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your shop today.
          </p>
        </div>

        {/* Shop Link */}
        {shop && (
          <div className="card bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Shop Link</h3>
                <a
                  href={`/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-400 hover:text-accent-300 flex items-center gap-2"
                >
                  washop.com/{shop.slug}
                  <FiExternalLink />
                </a>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${shop.slug}`);
                  alert('Link copied!');
                }}
                className="btn bg-white text-gray-900 hover:bg-gray-100"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* All Shops Links */}
        {shops.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FaStore className="text-blue-600" />
                All Your Shops ({shops.length})
              </h3>
              <Link to="/dashboard/shops" className="text-blue-600 hover:text-blue-700 text-sm">
                Manage Shops
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((shopItem) => (
                <div
                  key={shopItem._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{shopItem.shopName}</h4>
                      <p className="text-xs text-gray-500 mb-2">{shopItem.category}</p>
                    </div>
                    {shopItem.logo?.url && (
                      <img
                        src={shopItem.logo.url}
                        alt={shopItem.shopName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`/${shopItem.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 truncate flex-1"
                      title={`washop.com/${shopItem.slug}`}
                    >
                      <FiExternalLink size={12} />
                      <span className="truncate">{shopItem.slug}</span>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${shopItem.slug}`);
                        alert('Link copied!');
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Products</p>
                <p className="text-3xl font-bold mt-1">{stats.activeProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Views</p>
                <p className="text-3xl font-bold mt-1">{stats.views}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiEye className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">WhatsApp Clicks</p>
                <p className="text-3xl font-bold mt-1">{stats.clicks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiMousePointer className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/dashboard/shops" className="btn btn-primary text-center">
              Manage Shops
            </Link>
            <Link to="/dashboard/products" className="btn btn-outline text-center">
              Add New Product
            </Link>
            <Link to="/dashboard/shop" className="btn btn-outline text-center">
              Customize Shop
            </Link>
            <Link to={`/${shop?.slug}`} target="_blank" className="btn btn-secondary text-center">
              View Shop
            </Link>
          </div>
        </div>

        {/* Current Plan */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <p className="text-gray-600 mt-1">
                You&apos;re on the <span className="font-semibold capitalize">{user?.plan}</span> plan
              </p>
            </div>
            {user?.plan === 'free' && (
              <Link to="/dashboard/subscription" className="btn btn-accent">
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
