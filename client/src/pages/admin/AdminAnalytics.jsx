import { FiUsers, FiShoppingBag, FiTrendingUp, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';

export default function AdminAnalytics() {
  // Mock data
  const analyticsData = {
    userGrowth: [
      { month: 'Jan', users: 0 },
      { month: 'Feb', users: 0 },
      { month: 'Mar', users: 0 },
      { month: 'Apr', users: 0 },
      { month: 'May', users: 0 },
      { month: 'Jun', users: 0 }
    ],
    topShops: [],
    planDistribution: {
      free: 0,
      pro: 0,
      premium: 0
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Insights and statistics about platform performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiUsers className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">TOTAL USERS</span>
            </div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-80 mt-2">+0% from last month</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FaStore className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">TOTAL SHOPS</span>
            </div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-80 mt-2">+0% from last month</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiShoppingBag className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">TOTAL PRODUCTS</span>
            </div>
            <div className="text-3xl font-bold">0</div>
            <div className="text-sm opacity-80 mt-2">+0% from last month</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiDollarSign className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">REVENUE</span>
            </div>
            <div className="text-3xl font-bold">₦0</div>
            <div className="text-sm opacity-80 mt-2">+0% from last month</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
              <FiTrendingUp className="text-green-500" />
            </div>
            <div className="h-64 flex items-end justify-around gap-2">
              {analyticsData.userGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-red-200 dark:bg-red-900 rounded-t-lg transition-all hover:bg-red-300 dark:hover:bg-red-800" 
                       style={{ height: `${(data.users / 100) * 100 || 10}%`, minHeight: '20px' }}>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plan Distribution</h3>
              <FiBarChart2 className="text-blue-500" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Free Plan</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{analyticsData.planDistribution.free}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-gray-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pro Plan</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{analyticsData.planDistribution.pro}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Premium Plan</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{analyticsData.planDistribution.premium}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Shops */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Shops</h3>
          {analyticsData.topShops.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaStore className="text-4xl mx-auto mb-2" />
              <p>No shop data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Shop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analyticsData.topShops.map((shop, index) => (
                    <tr key={shop._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">#{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{shop.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{shop.products}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{shop.orders}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">₦{shop.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
