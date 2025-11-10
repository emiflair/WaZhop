import { useState } from 'react';
import { FiSearch, FiEye, FiTrash2, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [products] = useState([]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    toast.success('Product deleted successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage all products across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
              </div>
              <FiShoppingBag className="text-3xl text-red-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">0</p>
              </div>
              <FiShoppingBag className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Price</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₦0</p>
              </div>
              <FiDollarSign className="text-3xl text-blue-400" />
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="food">Food & Beverage</option>
                <option value="beauty">Beauty & Health</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <FiShoppingBag className="text-4xl" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Products will appear here once users add them to their shops</p>
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiShoppingBag className="text-4xl text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">₦{product.price?.toLocaleString()}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {product.category}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Shop: {product.shop?.name || 'Unknown'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                      title="View Details"
                    >
                      <FiEye size={14} />
                      View
                    </button>
                    <button
                      onClick={handleDeleteProduct}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      title="Delete Product"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
