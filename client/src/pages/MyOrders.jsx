import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { orderAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const statusConfig = {
  pending: {
    icon: FiClock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Pending'
  },
  confirmed: {
    icon: FiCheckCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Confirmed'
  },
  processing: {
    icon: FiPackage,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'Processing'
  },
  shipped: {
    icon: FiTruck,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    label: 'Shipped'
  },
  delivered: {
    icon: FiCheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: 'Delivered'
  },
  cancelled: {
    icon: FiXCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    label: 'Cancelled'
  }
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, shipped, delivered, cancelled

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders();
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage all your orders in one place
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FiPackage className="mx-auto w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet"
                : `You don't have any ${filter} orders`}
            </p>
                        <Link to="/" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || FiPackage;
              const statusStyle = statusConfig[order.status] || statusConfig.pending;

              return (
                <div
                  key={order._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Order Header */}
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`${statusStyle.bg} p-3 rounded-lg`}>
                            <StatusIcon className={`w-6 h-6 ${statusStyle.color}`} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              Order #{order.orderNumber}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Total
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {order.currency} {order.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-4">
                    <div className="space-y-3 mb-4">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <img
                            src={item.productImage || '/placeholder.png'}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-grow">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity} × {order.currency} {item.price.toLocaleString()}
                            </div>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {order.currency} {item.total.toLocaleString()}
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-20">
                          +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Shop Info */}
                    {order.shop && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span>Sold by:</span>
                        <Link
                          to={`/shop/${order.shop.slug}`}
                          className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {order.shop.shopName}
                        </Link>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </Link>

                      {order.status === 'pending' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                              try {
                                await orderAPI.cancelOrder(order._id);
                                fetchOrders(); // Refresh orders
                              } catch (err) {
                                alert('Failed to cancel order. Please try again.');
                              }
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <FiXCircle className="w-4 h-4" />
                          Cancel Order
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <Link
                          to={`/products/${order.items[0]?.product}/review`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Write Review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
