import { useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiDownload } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';

export default function AdminRevenue() {
  const [timeRange, setTimeRange] = useState('month');
  
  // Mock revenue data
  const revenueData = {
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    subscriptions: [],
    monthlyRevenue: [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 }
    ]
  };

  const percentageChange = revenueData.lastMonth > 0 
    ? ((revenueData.thisMonth - revenueData.lastMonth) / revenueData.lastMonth * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Track subscription revenue and financial metrics</p>
          </div>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <FiDownload />
            Export Report
          </button>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiDollarSign className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">TOTAL REVENUE</span>
            </div>
            <div className="text-3xl font-bold">₦{revenueData.total.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-2">All-time earnings</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiTrendingUp className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">THIS MONTH</span>
            </div>
            <div className="text-3xl font-bold">₦{revenueData.thisMonth.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-2">
              {percentageChange >= 0 ? '+' : ''}{percentageChange}% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FiCalendar className="text-3xl opacity-80" />
              <span className="text-sm font-semibold opacity-80">LAST MONTH</span>
            </div>
            <div className="text-3xl font-bold">₦{revenueData.lastMonth.toLocaleString()}</div>
            <div className="text-sm opacity-80 mt-2">Previous period</div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === 'week'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === 'month'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === 'year'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-around gap-2">
            {revenueData.monthlyRevenue.map((data, index) => {
              const maxAmount = Math.max(...revenueData.monthlyRevenue.map(m => m.amount), 1);
              const height = (data.amount / maxAmount) * 100 || 10;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500 cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '20px' }}
                    title={`₦${data.amount.toLocaleString()}`}
                  >
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Subscriptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {revenueData.subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FiDollarSign className="text-4xl" />
                        <p className="text-lg font-medium">No subscription payments yet</p>
                        <p className="text-sm">Revenue data will appear here once users subscribe to paid plans</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  revenueData.subscriptions.map((subscription) => (
                    <tr key={subscription._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{subscription.user?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{subscription.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subscription.plan === 'premium' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {subscription.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {subscription.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        ₦{subscription.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(subscription.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
