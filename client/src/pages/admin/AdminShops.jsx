import { useState } from 'react';
import { FiSearch, FiEye, FiTrash2, FiUser, FiCalendar, FiExternalLink } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminShops() {
  const [searchTerm, setSearchTerm] = useState('');
  const [shops] = useState([]);

  const filteredShops = shops.filter(shop =>
    shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteShop = () => {
    if (!confirm('Are you sure you want to delete this shop? This action cannot be undone.')) return;
    toast.success('Shop deleted successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shop Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage all shops on the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Shops</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
              </div>
              <FaStore className="text-3xl text-red-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Shops</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">0</p>
              </div>
              <FaStore className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Products/Shop</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">0</p>
              </div>
              <FaStore className="text-3xl text-blue-400" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops by name or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Shops Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FaStore className="text-4xl" />
                        <p className="text-lg font-medium">No shops found</p>
                        <p className="text-sm">Shops will appear here once users create them</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => (
                    <tr key={shop._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {shop.logo ? (
                              <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <FaStore className="text-red-600 dark:text-red-300" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{shop.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{shop.subdomain}.wazhop.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <FiUser size={12} />
                          {shop.owner?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{shop.owner?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {shop.productsCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://${shop.subdomain}.wazhop.com`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Shop"
                          >
                            <FiExternalLink size={18} />
                          </a>
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteShop(shop._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Shop"
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
      </div>
    </AdminLayout>
  );
}
