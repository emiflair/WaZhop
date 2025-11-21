import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { shopAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { FaStore, FaPlus, FaTrash, FaEdit, FaCrown } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

const ManageShops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    category: 'fashion',
    location: ''
  });

  const planLimits = {
    free: { maxShops: 1, storage: 0 },
    pro: { maxShops: 2, storage: 65 },
    premium: { maxShops: 3, storage: 1024 }
  };

  const currentLimit = planLimits[user?.plan] || planLimits.free;

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.getMyShops();
      console.log('📦 Full API response:', response);
      // Handle response format: response.data.shops or response.shops
      const shops = response?.data?.shops || response?.shops || [];
      console.log('✅ Extracted shops:', shops.length);
      setShops(shops);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    
    if (shops.length >= currentLimit.maxShops) {
      toast.error(`You can only create ${currentLimit.maxShops} shop${currentLimit.maxShops > 1 ? 's' : ''} on the ${user?.plan} plan`);
      return;
    }

    try {
      setCreating(true);
      await shopAPI.createShop(formData);
      toast.success('Shop created successfully!');
      setShowCreateModal(false);
      setFormData({
        shopName: '',
        description: '',
        category: 'fashion',
        location: ''
      });
      fetchShops();
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error(error.response?.data?.message || 'Failed to create shop');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShop = async (shopId, shopName) => {
    if (!confirm(`Are you sure you want to delete "${shopName}"? This will also delete all products in this shop.`)) {
      return;
    }

    try {
      setDeleting(shopId);
      await shopAPI.deleteShop(shopId);
      toast.success('Shop deleted successfully');
      fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast.error(error.response?.data?.message || 'Failed to delete shop');
    } finally {
      setDeleting(null);
    }
  };

  const canCreateMore = shops.length < currentLimit.maxShops;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Shops</h1>
            <p className="text-gray-600 mt-2">
              You have {shops.length} of {currentLimit.maxShops} shop{currentLimit.maxShops > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateMore}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              canCreateMore
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaPlus />
            Create New Shop
          </button>
        </div>

        {/* Shop Limit Warning */}
        {!canCreateMore && (
          <div className="card bg-yellow-50 border-2 border-yellow-300 mb-6">
            <div className="flex items-start gap-3">
              <FaCrown className="text-yellow-600 text-xl mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900">Shop Limit Reached</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You&apos;ve reached the maximum number of shops for your {user?.plan} plan. 
                  {user?.plan === 'free' && ' Upgrade to Pro to create up to 2 shops.'}
                  {user?.plan === 'pro' && ' Upgrade to Premium to create up to 3 shops.'}
                  {user?.plan === 'premium' && ' Delete a shop to create a new one.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shops Grid */}
        {shops.length === 0 ? (
          <div className="card text-center py-12">
            <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Shops Yet</h3>
            <p className="text-gray-600 mb-4">Create your first shop to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <FaPlus />
              Create Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div key={shop._id} className="card hover:shadow-lg transition-shadow">
                {/* Shop Image */}
                <div className="w-full h-40 bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {shop.logo?.url ? (
                    <img src={shop.logo.url} alt={shop.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <FaStore className="text-6xl text-white opacity-50" />
                  )}
                </div>

                {/* Shop Info */}
                <h3 className="text-xl font-bold mb-2">{shop.shopName}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {shop.description || 'No description'}
                </p>

                {/* Shop Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b">
                  <span className="capitalize">{shop.category}</span>
                  <span>{shop.views || 0} views</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={`/${shop.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-outline text-sm flex items-center justify-center gap-2"
                  >
                    <FiExternalLink />
                    View
                  </a>
                  <button
                    onClick={() => navigate(`/dashboard/shop?shopId=${shop._id}`)}
                    className="flex-1 btn btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteShop(shop._id, shop.shopName)}
                    disabled={deleting === shop._id}
                    className="btn bg-red-600 hover:bg-red-700 text-white text-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {deleting === shop._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Shop Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Shop</h2>
              <form onSubmit={handleCreateShop}>
                <div className="space-y-4">
                  <div>
                    <label className="label">Shop Name *</label>
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="input"
                      required
                      placeholder="My Awesome Shop"
                    />
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Tell customers about your shop..."
                    />
                  </div>

                  <div>
                    <label className="label">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="fashion">Fashion</option>
                      <option value="electronics">Electronics</option>
                      <option value="food">Food & Beverage</option>
                      <option value="beauty">Beauty & Cosmetics</option>
                      <option value="home">Home & Garden</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="books">Books & Media</option>
                      <option value="toys">Toys & Games</option>
                      <option value="art">Art & Crafts</option>
                      <option value="automotive">Automotive</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input"
                      placeholder="Lagos, Nigeria"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn btn-outline"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Shop'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageShops;
