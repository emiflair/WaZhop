import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiTrash2, FiMail, FiCalendar, FiUsers, FiX } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, free: 0, pro: 0, premium: 0 });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    plan: '',
    billingPeriod: '',
    subscriptionEndDate: '',
    isVerified: false
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/admin/all`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const getPlanBadge = (plan) => {
    const badges = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    };
    return badges[plan] || badges.free;
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      plan: user.plan || 'free',
      billingPeriod: user.billingPeriod || 'monthly',
      subscriptionEndDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toISOString().split('T')[0] : '',
      isVerified: user.isVerified || false
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/admin/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('User subscription updated successfully!');
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      // In production, implement delete endpoint
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/users/admin/${userId}`, {
      //   method: 'DELETE'
      // });
      
      toast.success('User deletion is not yet implemented');
      // fetchUsers(); // Refresh the list after implementing delete
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage all platform users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{loading ? '...' : stats.total}</p>
              </div>
              <FiUsers className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Free Plan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{loading ? '...' : stats.free}</p>
              </div>
              <FiUsers className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pro Plan</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{loading ? '...' : stats.pro}</p>
              </div>
              <FiUsers className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premium Plan</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{loading ? '...' : stats.premium}</p>
              </div>
              <FiUsers className="text-3xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FiUsers className="text-4xl" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Users will appear here once they register</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300 font-semibold">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FiMail size={12} />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(user.plan)}`}>
                          {user.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isVerified 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit User"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={handleDeleteUser}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete User"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User Subscription</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{editingUser.name} ({editingUser.email})</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Current Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Current Plan:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPlanBadge(editingUser.plan)}`}>
                        {editingUser.plan?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Billing:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {editingUser.billingPeriod || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Subscription End:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {editingUser.subscriptionEndDate 
                          ? new Date(editingUser.subscriptionEndDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription Plan
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Billing Period
                    </label>
                    <select
                      value={editForm.billingPeriod}
                      onChange={(e) => setEditForm({ ...editForm, billingPeriod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      disabled={editForm.plan === 'free'}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription End Date
                    </label>
                    <input
                      type="date"
                      value={editForm.subscriptionEndDate}
                      onChange={(e) => setEditForm({ ...editForm, subscriptionEndDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      disabled={editForm.plan === 'free'}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVerified"
                      checked={editForm.isVerified}
                      onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isVerified" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Email Verified
                    </label>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> Changing a user&apos;s subscription manually will override their payment status. 
                    Use this only for administrative purposes (refunds, special cases, etc.).
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Update Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
