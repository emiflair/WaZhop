import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiPackage, FiMapPin, FiMail, FiPhone, FiArrowLeft, FiXCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { orderAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const orderTimeline = [
  { key: 'pending', label: 'Order Placed', description: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', description: 'Seller confirmed your order' },
  { key: 'processing', label: 'Processing', description: 'Your order is being prepared' },
  { key: 'shipped', label: 'Shipped', description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully' }
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(orderId);
      setOrder(response.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.message || 'Failed to load order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const getStatusIndex = (status) => {
    if (status === 'cancelled') return -1;
    return orderTimeline.findIndex(step => step.key === status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await orderAPI.cancelOrder(orderId);
      fetchOrder(); // Refresh order
    } catch (err) {
      alert('Failed to cancel order. Please try again.');
    }
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

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FiPackage className="mx-auto w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Order Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'The order you are looking for could not be found.'}
            </p>
            <button onClick={() => navigate('/my-orders')} className="btn btn-primary">
              View All Orders
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-orders')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
        >
          <FiArrowLeft /> Back to Orders
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {order.currency} {order.total.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Status: <span className="capitalize">{order.status}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            {!isCancelled ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Order Timeline
                </h2>
                <div className="space-y-6">
                  {orderTimeline.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                      <div key={step.key} className="relative flex gap-4">
                        {/* Line */}
                        {index < orderTimeline.length - 1 && (
                          <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                          }`} />
                        )}

                        {/* Icon */}
                        <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? isCurrent
                              ? 'bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-900/30'
                              : 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}>
                          {isCompleted && !isCurrent ? (
                            <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-white' : 'bg-gray-500'}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-grow pb-6">
                          <div className={`font-semibold ${
                            isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.label}
                          </div>
                          <div className={`text-sm ${
                            isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {step.description}
                          </div>
                          {isCompleted && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatDate(
                                step.key === 'confirmed' ? order.confirmedAt :
                                step.key === 'shipped' ? order.shippedAt :
                                step.key === 'delivered' ? order.deliveredAt :
                                order.createdAt
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Cancelled Status */
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                    <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Order Cancelled
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                      This order was cancelled on {formatDate(order.cancelledAt)}
                    </p>
                    {order.paymentStatus === 'paid' && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Refund will be processed within 5-7 business days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                    <img
                      src={item.productImage || '/placeholder.png'}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {item.productName}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity} × {order.currency} {item.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {order.currency} {item.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{order.currency} {order.subtotal.toLocaleString()}</span>
                </div>
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>{order.currency} {order.shippingFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>{order.currency} {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Order Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {order.customerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <FiMail className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Email</div>
                    <div className="text-gray-900 dark:text-gray-100">{order.customer.email}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiPhone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">Phone</div>
                    <div className="text-gray-900 dark:text-gray-100">{order.customer.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-primary-600" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{order.customer.name}</div>
                  {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                </div>
              </div>
            )}

            {/* Shop Info */}
            {order.shop && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Sold By
                </h3>
                <Link
                  to={`/shop/${order.shop.slug}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  {order.shop.shopName}
                </Link>
              </div>
            )}

            {/* Cancel Button */}
            {['pending', 'confirmed'].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                className="w-full btn btn-secondary bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
