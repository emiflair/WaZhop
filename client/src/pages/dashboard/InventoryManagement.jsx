import { useState, useEffect } from 'react';
import { FiPackage, FiAlertCircle, FiTrendingDown, FiEdit3 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardLayout from '../../components/DashboardLayout';

const InventoryManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const productsData = await productAPI.getMyProducts();
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Don't show error toast if shop doesn't exist (buyer account)
      if (error.response?.status !== 404) {
        toast.error('Failed to load inventory');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  // Debug logging
  console.log('User plan:', user?.plan);
  console.log('User object:', user);

  // Check plan access - Inventory is Pro and Premium only
  const hasAccess = user?.plan === 'pro' || user?.plan === 'premium';
  console.log('Has inventory access:', hasAccess);
  
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="card">
            <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Inventory Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Inventory management is available on Pro and Premium plans. 
              Track stock levels, get low stock alerts, and never run out of products.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Current plan: {user?.plan || 'Unknown'}
            </p>
            <Link to="/dashboard/subscription" className="btn btn-primary">
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const trackedProducts = products.filter(p => p.trackInventory);
  const lowStockProducts = trackedProducts.filter(p => p.stock !== null && p.stock <= p.lowStockThreshold);
  const outOfStock = trackedProducts.filter(p => !p.inStock || p.stock === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track and manage your product stock levels
            </p>
          </div>
          <Link to="/dashboard/products" className="btn btn-primary">
            <FiEdit3 size={18} />
            <span className="ml-2">Manage Products</span>
          </Link>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card text-center p-3 sm:p-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <FiPackage size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {trackedProducts.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Products Tracked</div>
        </div>

        <div className="card text-center p-3 sm:p-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <FiAlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {lowStockProducts.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
        </div>

        <div className="card text-center p-3 sm:p-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <FiTrendingDown size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {outOfStock.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Out of Stock</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiAlertCircle className="text-yellow-600" />
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Only {product.stock} left in stock
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard/products"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tracked Products */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Inventory Status
        </h2>
        
        {trackedProducts.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No products with inventory tracking enabled yet.
            </p>
            <Link to="/dashboard/products" className="text-primary-600 dark:text-primary-400 hover:underline">
              Enable tracking on your products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    SKU
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Stock
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Last Restock
                  </th>
                </tr>
              </thead>
              <tbody>
                {trackedProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.sku || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-medium ${
                        product.stock <= product.lowStockThreshold
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {product.stock ?? '∞'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        !product.inStock || product.stock === 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : product.stock <= product.lowStockThreshold
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      }`}>
                        {!product.inStock || product.stock === 0 ? 'Out of Stock' : 
                         product.stock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.lastRestockDate 
                        ? new Date(product.lastRestockDate).toLocaleDateString()
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="card bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Inventory Management Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Enable inventory tracking in product settings to monitor stock levels</li>
          <li>• Set low stock thresholds to receive alerts before running out</li>
          <li>• Update stock levels regularly to keep your storefront accurate</li>
          <li>• Use SKUs to easily identify and organize your products</li>
        </ul>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default InventoryManagement;
