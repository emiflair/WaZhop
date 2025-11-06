import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { shopAPI, productAPI } from '../../utils/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiShoppingBag, FiEye, FiMousePointer } from 'react-icons/fi';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // Sample analytics data (in production, this would come from API)
  const viewsData = [
    { date: 'Mon', views: 45, clicks: 12 },
    { date: 'Tue', views: 52, clicks: 18 },
    { date: 'Wed', views: 38, clicks: 10 },
    { date: 'Thu', views: 65, clicks: 24 },
    { date: 'Fri', views: 78, clicks: 32 },
    { date: 'Sat', views: 90, clicks: 40 },
    { date: 'Sun', views: 82, clicks: 35 },
  ];

  const categoryData = [
    { name: 'Fashion', value: 35 },
    { name: 'Electronics', value: 25 },
    { name: 'Food', value: 20 },
    { name: 'Beauty', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['#f97316', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopData, productsData] = await Promise.all([
        shopAPI.getMyShop(),
        productAPI.getMyProducts(),
      ]);
      setShopData(shopData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalViews = shopData?.analytics?.totalViews || 0;
  const totalClicks = shopData?.analytics?.totalClicks || 0;
  const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;
  const activeProducts = products.filter(p => p.isActive).length;

  // Get top products by views
  const topProducts = products
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track your shop&apos;s performance and insights</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '7d'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '30d'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '90d'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Views */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{totalViews}</p>
                <p className="text-sm text-primary-600 mt-1">↑ 12% vs last period</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiEye className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Clicks */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900">{totalClicks}</p>
                <p className="text-sm text-primary-600 mt-1">↑ 8% vs last period</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FiMousePointer className="text-primary-600" size={24} />
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
                <p className="text-sm text-primary-600 mt-1">↑ 3% vs last period</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Active Products */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Products</p>
                <p className="text-3xl font-bold text-gray-900">{activeProducts}</p>
                <p className="text-sm text-gray-500 mt-1">of {products.length} total</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views & Clicks Over Time */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Views & Clicks Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="clicks" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Products by Category */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Top Products by Views</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Views</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Clicks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((product) => {
                    const productViews = product.views || 0;
                    const productClicks = product.clicks || 0;
                    const productConversion = productViews > 0 
                      ? ((productClicks / productViews) * 100).toFixed(1)
                      : 0;

                    return (
                      <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <FiShoppingBag className="text-gray-400" />
                              </div>
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">{product.category}</td>
                        <td className="py-3 px-4">₦{product.price?.toLocaleString()}</td>
                        <td className="py-3 px-4">{productViews}</td>
                        <td className="py-3 px-4">{productClicks}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm">
                            {productConversion}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No products available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversion Insights */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-4">Conversion Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-1">Best Performing Day</p>
              <p className="text-2xl font-bold text-blue-900">Saturday</p>
              <p className="text-sm text-blue-700 mt-1">90 views, 40 clicks</p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600 font-medium mb-1">Most Popular Category</p>
              <p className="text-2xl font-bold text-primary-900">Fashion</p>
              <p className="text-sm text-primary-700 mt-1">35% of total products</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium mb-1">Average Time on Shop</p>
              <p className="text-2xl font-bold text-purple-900">2m 34s</p>
              <p className="text-sm text-purple-700 mt-1">↑ 15% vs last period</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
