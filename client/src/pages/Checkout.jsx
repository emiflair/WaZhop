import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiCreditCard, FiPackage, FiArrowLeft, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../hooks/useCart';
import { orderAPI, couponAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Customer Info, 2: Shipping, 3: Review & Pay

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Form state
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    fullAddress: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [customerNotes, setCustomerNotes] = useState('');

  // Check if cart is empty
  useEffect(() => {
    if (!cart || cart.length === 0) {
      navigate('/');
    }
  }, [cart, navigate]);

  // Group cart items by shop
  const groupedCart = cart.reduce((acc, item) => {
    const shopId = item.shop._id;
    if (!acc[shopId]) {
      acc[shopId] = {
        shop: item.shop,
        items: [],
        subtotal: 0
      };
    }
    acc[shopId].items.push(item);
    acc[shopId].subtotal += item.product.price * item.quantity;
    return acc;
  }, {});

  const shops = Object.values(groupedCart);
  const subtotalAmount = getTotalPrice();

  // Calculate discount and final total
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotalAmount * appliedCoupon.discountValue) / 100;
    }
    // Fixed amount discount
    return Math.min(appliedCoupon.discountValue, subtotalAmount);
  };

  const discountAmount = calculateDiscount();
  const totalAmount = Math.max(0, subtotalAmount - discountAmount); // Ensure total never goes negative

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await couponAPI.validateProduct(couponCode);
      
      if (response.valid && response.coupon) {
        setAppliedCoupon(response.coupon);
        setCouponError('');
        const discountText = response.coupon.discountType === 'percentage' 
          ? `${response.coupon.discountValue}% off` 
          : `NGN ${response.coupon.discountValue} off`;
        toast.success(`Coupon applied! You get ${discountText}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid coupon code';
      setCouponError(errorMsg);
      setAppliedCoupon(null);
      toast.error(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Validate customer info
  const validateCustomerInfo = () => {
    if (!customerInfo.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!customerInfo.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    setError('');
    return true;
  };

  // Validate shipping address
  const validateShippingAddress = () => {
    if (!shippingAddress.city.trim() || !shippingAddress.state.trim()) {
      setError('Please enter your city and state');
      return false;
    }
    setError('');
    return true;
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && validateCustomerInfo()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2 && validateShippingAddress()) {
      // If total is 0 (100% discount), skip payment step and place order directly
      if (totalAmount <= 0 || (appliedCoupon && discountAmount >= subtotalAmount)) {
        toast.success('🎉 Free order! Processing your order...', { duration: 3000 });
        handlePlaceOrder();
      } else {
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      // Create orders for each shop
      const orderPromises = shops.map(async (shopData) => {
        const shopTotal = appliedCoupon ? shopData.subtotal - ((shopData.subtotal / subtotalAmount) * discountAmount) : shopData.subtotal;
        const orderData = {
          shopId: shopData.shop._id,
          items: shopData.items.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          })),
          customer: customerInfo,
          shippingAddress: {
            ...shippingAddress,
            fullAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country}`
          },
          paymentMethod: shopTotal === 0 ? 'free' : paymentMethod,
          customerNotes,
          subtotal: shopData.subtotal,
          shippingFee: 0, // Calculate shipping if needed
          discount: appliedCoupon ? (shopData.subtotal / subtotalAmount) * discountAmount : 0,
          couponCode: appliedCoupon?.code || null,
          total: shopTotal,
          currency: shopData.shop.paymentSettings?.currency || 'NGN'
        };

        const response = await orderAPI.createOrder(orderData);
        return response.order;
      });

      const orders = await Promise.all(orderPromises);

      // Clear cart
      clearCart();

      // Navigate to confirmation page with order details
      navigate('/order-confirmation', {
        state: { orders, customerInfo }
      });

    } catch (err) {
      console.error('Order creation error:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {['Customer Info', 'Shipping', 'Review & Pay'].map((label, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step > index + 1 ? 'bg-green-500 text-white' :
              step === index + 1 ? 'bg-primary-600 text-white' :
              'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > index + 1 ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium hidden sm:inline ${
              step === index + 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
            }`}>
              {label}
            </span>
            {index < 2 && (
              <div className={`hidden sm:block w-12 md:w-24 h-1 mx-2 ${
                step > index + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!cart || cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Checkout
          </h1>
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Customer Information */}
            {step === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiUser className="text-2xl text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Customer Information
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Address */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiMapPin className="text-2xl text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Shipping Address
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Lagos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Lagos State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Nigeria"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="100001"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Payment */}
            {step === 3 && (
              <>
                {/* Payment Method */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <FiCreditCard className="text-2xl text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Payment Method
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {/* WhatsApp */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'whatsapp'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="whatsapp"
                        checked={paymentMethod === 'whatsapp'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900 dark:text-gray-100">WhatsApp Order</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Complete order via WhatsApp chat</div>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Cash on Delivery</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Pay when you receive your order</div>
                      </div>
                    </label>

                    {/* Bank Transfer */}
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-primary-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="flex-grow">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Bank Transfer</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Transfer to seller&apos;s account</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Order Notes (Optional)
                  </h3>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add any special instructions for your order..."
                  />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  onClick={() => {
                    setStep(step - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="btn btn-primary flex-1"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn btn-primary flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center gap-3 mb-6">
                <FiPackage className="text-2xl text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                {shops.map((shopData) => (
                  <div key={shopData.shop._id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {shopData.shop.shopName}
                    </div>
                    {shopData.items.map((item) => (
                      <div key={item.product._id} className="flex gap-3 mb-2">
                        <img
                          src={item.product.images?.[0] || '/placeholder.png'}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-grow text-sm">
                          <div className="text-gray-900 dark:text-gray-100">
                            {item.product.name}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity} × {shopData.shop.paymentSettings?.currency || 'NGN'} {item.product.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {shopData.shop.paymentSettings?.currency || 'NGN'} {(item.product.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Have a coupon code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-200">
                          Coupon Applied: {appliedCoupon.code}
                        </div>
                        {appliedCoupon.description && (
                          <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                            {appliedCoupon.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>NGN {subtotalAmount.toLocaleString()}</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'Fixed'})</span>
                    <span>-NGN {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>NGN {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
