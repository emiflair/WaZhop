import { useState, useEffect, useCallback } from 'react';
import { FiTag, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [couponStats, setCouponStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsage: 0,
    totalDiscountGiven: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expiryDate: '',
    maxUses: '',
    applicablePlans: ['pro', 'premium']
  });

  const fetchCoupons = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else {
        toast.error('Failed to load coupons');
      }
    } catch (error) {
      console.error('Fetch coupons error:', error);
      toast.error('Error loading coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCouponStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCouponStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, []);

  // Fetch coupons on component mount
  useEffect(() => {
    fetchCoupons();
    fetchCouponStats();
  }, [fetchCoupons, fetchCouponStats]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCoupon.code.trim().toUpperCase(),
          discountType: newCoupon.discountType,
          discountValue: parseFloat(newCoupon.discountValue),
          validUntil: newCoupon.expiryDate || null,
          maxUses: newCoupon.maxUses ? parseInt(newCoupon.maxUses) : null,
          applicablePlans: newCoupon.applicablePlans
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Coupon created successfully!');
        setShowCreateModal(false);
        setNewCoupon({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expiryDate: '',
          maxUses: '',
          applicablePlans: ['pro', 'premium']
        });
        // Refresh coupons list
        fetchCoupons();
        fetchCouponStats();
      } else {
        toast.error(data.message || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Create coupon error:', error);
      toast.error('Error creating coupon');
    }
  };

  const handleToggleCoupon = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setCoupons(coupons.map(c => 
          c.id === id ? { ...c, isActive: !currentStatus } : c
        ));
        toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchCouponStats();
      } else {
        toast.error('Failed to toggle coupon');
      }
    } catch (error) {
      console.error('Toggle coupon error:', error);
      toast.error('Error toggling coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== id));
        toast.success('Coupon deleted');
        fetchCouponStats();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('Error deleting coupon');
    }
  };

  const getDiscountBadge = (type, value) => {
    if (type === 'fixed') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          ₦{value}
        </span>
      );
    }
    
    const val = parseFloat(value);
    if (val === 100) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          {val}% OFF
        </span>
      );
    } else if (val >= 50) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          {val}% OFF
        </span>
      );
    } else if (val >= 25) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          {val}% OFF
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          {val}% OFF
        </span>
      );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coupon Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create and manage discount coupons for users</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <FiPlus /> Create Coupon
          </button>
        </div>

        {couponStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <FiTag className="text-2xl text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Coupons</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{couponStats.totalCoupons}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <FiToggleRight className="text-2xl text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{couponStats.activeCoupons}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <FiTag className="text-2xl text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{couponStats.totalUsage}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                <FiTag className="text-2xl text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discount Given</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{couponStats.totalDiscountGiven.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading coupons...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plans</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getDiscountBadge(coupon.discountType, coupon.discountValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {coupon.applicablePlans?.map(plan => (
                          <span key={plan} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs capitalize">
                            {plan}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {coupon.usedCount} / {coupon.maxUses || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                        className="flex items-center gap-2"
                      >
                        {coupon.isActive ? (
                          <>
                            <FiToggleRight className="text-2xl text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="text-2xl text-gray-400" />
                            <span className="text-sm text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
              {coupons.length === 0 && (
                <div className="text-center py-12">
                  <FiTag className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No coupons created yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Create your first coupon
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Coupon</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono"
                    placeholder="e.g., WELCOME2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount Value</label>
                  <div className="flex gap-2 mb-2">
                    {[10, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewCoupon({ ...newCoupon, discountValue: val, discountType: 'percentage' })}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900 rounded text-sm"
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                    max={newCoupon.discountType === 'percentage' ? '100' : undefined}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Uses (0 = unlimited)</label>
                  <input
                    type="number"
                    value={newCoupon.maxUses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Applicable Plans</label>
                  <div className="space-y-2">
                    {['pro', 'premium'].map((plan) => (
                      <label key={plan} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newCoupon.applicablePlans.includes(plan)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCoupon({ ...newCoupon, applicablePlans: [...newCoupon.applicablePlans, plan] });
                            } else {
                              setNewCoupon({ ...newCoupon, applicablePlans: newCoupon.applicablePlans.filter(p => p !== plan) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{plan}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
