import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAPI.getStats();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  const activity = stats?.recentUsers || [];

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.users?.total || 0,
      icon: FiUsers,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Total Shops',
      value: stats?.shops || 0,
      icon: FaStore,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      name: 'Total Products',
      value: stats?.products || 0,
      icon: FiShoppingBag,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Total Revenue',
      value: `₦${(stats?.orders?.revenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'yellow',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      name: 'Active Subscriptions',
      value: stats?.subscriptions?.active || 0,
      icon: FiTrendingUp,
      color: 'indigo',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      name: 'Total Orders',
      value: stats?.orders?.total || 0,
      icon: FiPackage,
      color: 'pink',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      textColor: 'text-pink-600 dark:text-pink-400'
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back! Here&apos;s your platform overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`text-xl ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((user, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{user.name} ({user.email})</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Joined {new Date(user.createdAt).toLocaleDateString()} • {user.role} • {user.plan} plan
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
