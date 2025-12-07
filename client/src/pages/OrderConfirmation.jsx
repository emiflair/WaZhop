import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiMail, FiPhone } from 'react-icons/fi';
import Navbar from '../components/Navbar';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, customerInfo } = location.state || {};

  // Redirect if no order data
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
      setTimeout(() => navigate('/'), 100);
    return null;
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const firstOrder = orders[0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <FiCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Thank you for your order. We&apos;ve sent a confirmation email to{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {customerInfo?.email}
            </span>
          </p>
        </div>

        {/* Order Details Cards */}
        <div className="space-y-6 mb-8">
          {orders.map((order, index) => (
            <div key={order.id || index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="text-sm opacity-90">Order Number</div>
                    <div className="text-xl font-bold">{order.orderNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Total</div>
                    <div className="text-xl font-bold">
                      {order.currency} {order.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400">
                  <FiPackage className="text-xl" />
                  <h3 className="text-lg font-semibold">
                    Order #{index + 1} of {orders.length}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Tracking Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        <FiPackage className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          Track your order
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          You can track your order status anytime
                        </div>
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Order Details
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* What's Next */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      What happens next?
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold mt-0.5">
                          1
                        </span>
                        <span>The seller will review and confirm your order</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold mt-0.5">
                          2
                        </span>
                        <span>You&apos;ll receive an email when your order ships</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold mt-0.5">
                          3
                        </span>
                        <span>Track your delivery until it arrives</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiMail className="text-primary-600" />
              Contact Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FiMail className="flex-shrink-0" />
                <span>{customerInfo?.email}</span>
              </div>
              {customerInfo?.phone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FiPhone className="flex-shrink-0" />
                  <span>{customerInfo.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiPackage className="text-primary-600" />
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Total Items</span>
                <span>{orders.length} order{orders.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Payment Method</span>
                <span className="capitalize">
                  {firstOrder.paymentMethod?.replace('_', ' ') || 'WhatsApp'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total Amount</span>
                <span>NGN {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/my-orders"
            className="btn btn-primary text-center"
          >
            View All Orders
          </Link>
          <Link
            to="/"
            className="btn btn-secondary text-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Need help with your order?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you have any questions or concerns about your order, please don&apos;t hesitate to contact us.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </main>

    </div>
  );
}
