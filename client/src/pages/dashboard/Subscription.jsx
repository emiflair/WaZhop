import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { userAPI, productAPI, shopAPI, subscriptionAPI, couponAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import FlutterwavePayment from '../../components/FlutterwavePayment';
import { 
  FaCrown, 
  FaCheck, 
  FaTimes, 
  FaRocket, 
  FaStar, 
  FaChartLine, 
  FaGlobe,
  FaPalette,
  FaBox,
  FaInfoCircle,
  FaStore,
  FaDatabase
} from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import useDetectedCountry from '../../hooks/useDetectedCountry';
import { DEFAULT_COUNTRY_CODE } from '../../utils/location';
import { parseApiError } from '../../utils/errorHandler';

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Destructive downgrade confirmation state
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [ackIrreversible, setAckIrreversible] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  // Boost flow state
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostHours, setBoostHours] = useState(5);
  const [boostProductId, setBoostProductId] = useState('');
  const [boostLoading, setBoostLoading] = useState(false);
  const BOOST_RATE = 400;
  // Location targeting for boost
  const [boostState, setBoostState] = useState('');
  const [boostArea, setBoostArea] = useState('');
  // Payment state
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const {
    countryCode: sellerCountryCode,
    countryName: sellerCountryName,
    regionLabel: sellerRegionLabel,
    regions: sellerRegions,
    defaultRegion: sellerDefaultRegion
  } = useDetectedCountry(user?.whatsapp);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!sellerRegions || sellerRegions.length === 0) return;
    setBoostState((prev) => prev || sellerDefaultRegion || sellerRegions[0]);
  }, [sellerRegions, sellerDefaultRegion]);

  // Pre-select plan from URL parameter if present - moved after plans definition
  // This will be handled in a later useEffect

  const fetchData = async () => {
    try {
      setLoading(true);
      const productsData = await productAPI.getMyProducts();
      const shopsData = await shopAPI.getMyShops();
      
      // Handle response format: productsData.data or productsData (array)
      const userProducts = Array.isArray(productsData) ? productsData : (productsData?.data || []);
      setProducts(userProducts);
      
      // Handle response format: shopsData.data.shops or shopsData.shops
      const userShops = shopsData?.data?.shops || shopsData?.shops || [];
      setShops(userShops);
      
      if (userProducts.length > 0) {
        setBoostProductId(userProducts[0]._id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't show error toast if shop doesn't exist (buyer account)
      if (error.response?.status !== 404) {
        toast.error('Failed to load subscription data');
      }
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      icon: FaBox,
      color: 'gray',
      features: [
        { text: '1 shop', included: true },
        { text: 'Up to 10 products', included: true },
        { text: '1 default theme (white)', included: true },
        { text: 'Basic product management', included: true },
        { text: 'Standard support', included: true },
        { text: 'Storage for images', included: false },
        { text: 'Multiple shops', included: false },
        { text: 'Premium themes', included: false },
        { text: 'Analytics dashboard', included: false },
        { text: 'Inventory management', included: false },
        { text: 'Custom domain', included: false },
        { text: 'Priority support', included: false }
      ],
      limits: {
        products: 10,
        themes: 1,
        analytics: false,
        customDomain: false,
        maxShops: 1,
        storage: 0,
        inventoryManagement: false
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9000,
      yearlyPrice: 75600,
      monthlyEquivalent: 6300,
      period: 'month',
      description: 'For growing businesses',
      icon: FaRocket,
      color: 'blue',
      popular: true,
      features: [
        { text: 'Up to 2 shops', included: true },
        { text: '65GB storage for images', included: true },
        { text: 'Up to 100 products', included: true },
        { text: '10 professional preset themes', included: true },
        { text: 'Beautiful gradient themes', included: true },
        { text: 'Smooth animations', included: true },
        { text: 'Inventory management system', included: true },
        { text: 'Low stock alerts', included: true },
        { text: 'Automated stock tracking', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Sales reports & insights', included: true },
        { text: 'Customer behavior tracking', included: true },
        { text: 'Multiple shop layouts', included: true },
        { text: 'Social media integration', included: true },
        { text: 'Email support', included: true },
        { text: 'Custom domains', included: false },
        { text: 'Payment integration', included: false },
        { text: 'Unlimited customization', included: false }
      ],
      limits: {
        products: 100,
        themes: 10,
        analytics: true,
        customDomain: false,
        maxShops: 2,
        storage: 65 * 1024 * 1024 * 1024, // 65GB in bytes
        inventoryManagement: true
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 18000,
      yearlyPrice: 151200,
      monthlyEquivalent: 12600,
      period: 'month',
      description: 'For established brands',
      icon: FaCrown,
      color: 'purple',
      features: [
        { text: 'Up to 3 shops', included: true },
        { text: '1TB storage for images', included: true },
        { text: 'Unlimited products', included: true },
        { text: 'Unlimited theme customization', included: true },
  { text: 'Control customer theme mode (Light/Dark/Auto)', included: true },
        { text: 'Payment integration (Flutterwave/Paystack)', included: true },
        { text: 'Accept direct payments from customers', included: true },
        { text: 'Custom color pickers', included: true },
        { text: 'Custom gradient builder', included: true },
        { text: 'Custom CSS & advanced styling', included: true },
        { text: 'Custom domain', included: true },
        { text: 'Remove WaZhop branding', included: true },
        { text: 'Video backgrounds', included: true },
        { text: 'Advanced animations', included: true },
        { text: 'SEO optimization tools', included: true },
        { text: 'Email marketing integration', included: true },
        { text: 'Multi-currency support', included: true },
        { text: 'Inventory management', included: true },
        { text: 'Automated backups', included: true },
        { text: 'Priority 24/7 support', included: true },
        { text: 'Dedicated account manager', included: true }
      ],
      limits: {
        products: Infinity,
        themes: Infinity,
        analytics: true,
        customDomain: true,
        maxShops: 3,
        storage: 1024 * 1024 * 1024 * 1024 // 1TB in bytes
      }
    }
  ];

  const currentPlan = plans.find(p => p.id === user?.plan) || plans[0];
  const productCount = products.length;
  const productLimit = currentPlan.limits.products;
  const usagePercentage = productLimit === Infinity ? 0 : (productCount / productLimit) * 100;

  const getDaysUntilExpiry = () => {
    if (user?.plan === 'free' || !user?.planExpiry) return null;
    const expiry = new Date(user.planExpiry);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBillingInfo = () => {
    if (user?.plan === 'free' || !user?.planExpiry) {
      return { period: 'forever', price: 0, isYearly: false };
    }
    
    const daysUntilExpiry = getDaysUntilExpiry();
    if (daysUntilExpiry === null) {
      return { period: currentPlan.period, price: currentPlan.price, isYearly: false };
    }
    
    // If days until expiry is >= 300 (approximately 10 months), assume yearly billing
    const isYearly = daysUntilExpiry >= 300;
    
    if (isYearly && currentPlan.yearlyPrice) {
      return { 
        period: 'year', 
        price: currentPlan.yearlyPrice,
        monthlyEquivalent: currentPlan.monthlyEquivalent,
        isYearly: true 
      };
    }
    
    return { 
      period: currentPlan.period, 
      price: currentPlan.price, 
      isYearly: false 
    };
  };

  const handleUpgradeClick = (plan) => {
    if (plan.id === user?.plan) {
      toast.error('You are already on this plan');
      return;
    }
    
    // For onboarding users selecting Free plan, redirect to dashboard
    const isOnboarding = searchParams.get('onboarding') === '1';
    if (isOnboarding && plan.id === 'free') {
      window.location.href = '/dashboard';
      return;
    }
    
    setSelectedPlan(plan);
    // If moving to Free from a higher plan, require destructive downgrade confirmation
    const isDowngradeToFree = plan.id === 'free' && getPlanLevel(user?.plan) > getPlanLevel('free');
    if (isDowngradeToFree) {
      setConfirmPhrase('');
      setAckIrreversible(false);
      setShowDowngradeModal(true);
      setShowUpgradeModal(false);
      return;
    }
    setShowUpgradeModal(true);
    setCouponCode('');
    setCouponData(null);
    setCouponError('');
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponValidating(true);
      setCouponError('');
      const data = await couponAPI.validate(couponCode.trim(), selectedPlan.id);

      if (!data?.valid) {
        throw new Error(data?.message || 'Invalid coupon code');
      }

      setCouponData(data.coupon);
      toast.success('Coupon applied successfully!');
      // Open preview modal after successful validation
      setShowUpgradeModal(false);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError(error.message || parseApiError(error));
      setCouponData(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (!selectedPlan) return;

    // Store plan name before clearing state
    const planName = selectedPlan.name;
    const planId = selectedPlan.id;

    try {
      setUpgrading(true);
      toast.loading('Verifying payment and upgrading your plan...');
      
      // Verify payment and upgrade plan
      const data = await userAPI.verifyPaymentAndUpgrade({
        transactionId: paymentData.transactionId,
        txRef: paymentData.txRef,
        plan: planId,
        billingPeriod: billingPeriod,
        couponCode: couponData ? couponCode.trim() : null
      });
      
      updateUser(data.user);
      toast.dismiss();
      
      // Show success message with payment details
      const successMessage = data.payment?.discountApplied 
        ? `🎉 Payment successful! Upgraded to ${planName} with ${data.payment.discountApplied.discountPercentage}% discount!`
        : `🎉 Payment successful! Welcome to ${planName} plan!`;
      
      toast.success(successMessage, { duration: 5000 });
      
      // Close modals and reset state immediately
      setShowPreviewModal(false);
      setShowUpgradeModal(false);
      setPaymentInitiated(false);
      setSelectedPlan(null);
      setCouponCode('');
      setCouponData(null);
      setCouponError('');
      
      // Refresh subscription data
      await fetchData();
      
      // Show what they unlocked
      setTimeout(() => {
        toast.success(`✅ All ${planName} features are now active!`, { duration: 4000 });
      }, 1000);
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.dismiss();
      toast.error(
        error.response?.data?.message || 
        'Payment verification failed. Please contact support with your transaction reference.',
        { duration: 6000 }
      );
      // Don't close modals on error so user can retry
      setPaymentInitiated(false);
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentClose = (data) => {
    setPaymentInitiated(false);
    
    if (data?.cancelled) {
      toast.error('Payment was cancelled');
      // Close modals and stay on current page
      setShowPreviewModal(false);
      setShowUpgradeModal(false);
    } else if (data?.failed) {
      toast.error('Payment failed. Please try again or contact support.');
      // Keep modals open so user can retry
    }
  };

  // Destructive downgrade handler (to Free with data cleanup)
  const handleConfirmDestructiveDowngrade = async () => {
    if (!selectedPlan || selectedPlan.id !== 'free') return;
    if (confirmPhrase.trim().toUpperCase() !== 'DOWNGRADE' || !ackIrreversible) return;

    try {
      setDowngrading(true);
      const data = await userAPI.downgradePlan('free', { confirmLoss: true });
      updateUser(data.user);
      toast.success(data.message || 'Downgraded to Free and cleaned up data');
      setShowDowngradeModal(false);
      setSelectedPlan(null);
      await fetchData();
    } catch (error) {
      console.error('Error downgrading to free:', error);
      toast.error(error.response?.data?.message || error.userMessage || 'Failed to downgrade');
    } finally {
      setDowngrading(false);
    }
  };

  const getPlanLevel = (planId) => {
    const levels = { free: 0, pro: 1, premium: 2 };
    return levels[planId] || 0;
  };

  // Pre-select plan from URL parameter if present
  useEffect(() => {
    // Wait for initial data to load and user to be available
    if (loading || !user) return;
    
    const planParam = searchParams.get('plan');
    const billingParam = searchParams.get('billing');
    const checkoutParam = searchParams.get('checkout');
    
    if (billingParam && (billingParam === 'monthly' || billingParam === 'yearly')) {
      setBillingPeriod(billingParam);
    }
    
    if (planParam) {
      const plan = plans.find(p => p.id === planParam.toLowerCase());
      if (plan && plan.id !== user?.plan) {
        // Auto-open the upgrade modal for the selected plan
        setSelectedPlan(plan);
        
        // Check if it's a downgrade to free
        const isDowngradeToFree = plan.id === 'free' && getPlanLevel(user?.plan) > getPlanLevel('free');
        if (isDowngradeToFree) {
          setConfirmPhrase('');
          setAckIrreversible(false);
          setShowDowngradeModal(true);
        } else {
          // If checkout=1 is present, go directly to preview modal (skip the plan selection modal)
          if (checkoutParam === '1') {
            setShowUpgradeModal(false);
            setShowPreviewModal(true);
          } else {
            setShowUpgradeModal(true);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.plan, loading]);

  const getColorClasses = (color) => {
    const colors = {
      gray: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        button: 'bg-gray-600 hover:bg-gray-700',
        badge: 'bg-gray-100 text-gray-700'
      },
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-300',
        button: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-700'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-300',
        button: 'bg-purple-600 hover:bg-purple-700',
        badge: 'bg-purple-100 text-purple-700'
      }
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;
  const billingInfo = getBillingInfo();

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {searchParams.get('onboarding') === '1' ? 'Choose Your Plan' : 'Subscription Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {searchParams.get('onboarding') === '1' 
              ? 'Select a plan to start selling. You can upgrade or downgrade anytime.' 
              : 'Manage your plan and billing'}
          </p>
        </div>

        {/* Current Plan Overview - Hide for onboarding users */}
        {searchParams.get('onboarding') !== '1' && (
        <div className="card mb-6 border-2 border-primary-200 dark:border-primary-700 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getColorClasses(currentPlan.color).bg} flex items-center justify-center`}>
                <currentPlan.icon className={`text-2xl ${getColorClasses(currentPlan.color).text}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold dark:text-white">{currentPlan.name} Plan</h2>
                  {user?.plan !== 'free' && (
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 text-xs font-semibold rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{currentPlan.description}</p>
              </div>
            </div>
            <div className="text-left md:text-right flex-shrink-0">
              <div className="text-3xl font-bold dark:text-white">
                ₦{billingInfo.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">per {billingInfo.period}</div>
              {billingInfo.isYearly && billingInfo.monthlyEquivalent && (
                <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                  (₦{billingInfo.monthlyEquivalent.toLocaleString()}/month)
                </div>
              )}
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4 flex items-start gap-2">
              <FaInfoCircle className="text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">Plan Expiring Soon</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your {currentPlan.name} plan will expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                  Renew now to continue enjoying premium features.
                </p>
              </div>
            </div>
          )}

          {/* Auto-Renewal & Manual Renewal Controls */}
          {user?.plan !== 'free' && daysUntilExpiry !== null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
                <FaInfoCircle className="text-primary-500" />
                Subscription Management
              </h3>
              
              <div className="space-y-4">
                {/* Manual Renewal Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Manual Renewal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Renew your subscription for another {billingInfo.isYearly ? 'year' : '30 days'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const data = await subscriptionAPI.renew({ isYearly: billingInfo.isYearly });
                        if (data.success) {
                          toast.success(data.message);
                          fetchData();
                          updateUser({ ...user, planExpiry: data.data.planExpiry });
                        } else {
                          toast.error(data.message || 'Failed to renew subscription');
                        }
                      } catch (error) {
                        console.error('Error renewing:', error);
                        toast.error(parseApiError(error));
                      }
                    }}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center"
                  >
                    <FaCheck /> Renew Now
                  </button>
                </div>

                {/* Auto-Renewal Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Auto-Renewal</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically renew before expiration
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const data = await subscriptionAPI.toggleAutoRenew(!user?.autoRenew);
                        if (data.success) {
                          toast.success(data.message);
                          updateUser({ ...user, autoRenew: data.data.autoRenew });
                        } else {
                          toast.error(data.message || 'Failed to update auto-renewal');
                        }
                      } catch (error) {
                        console.error('Error toggling auto-renewal:', error);
                        toast.error(parseApiError(error));
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      user?.autoRenew ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        user?.autoRenew ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
              <FaChartLine className="text-primary-500" />
              Usage Statistics
            </h3>
            <div className="space-y-4">
              {/* Products Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaBox className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium dark:text-gray-200">Products</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {productCount} / {productLimit === Infinity ? '∞' : productLimit}
                  </span>
                </div>
                {productLimit !== Infinity && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usagePercentage >= 90 ? 'bg-red-500' :
                        usagePercentage >= 70 ? 'bg-yellow-500' :
                        'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Shops Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaStore className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium dark:text-gray-200">Shops</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {shops.length} / {currentPlan.limits.maxShops}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (shops.length / currentPlan.limits.maxShops) * 100 >= 90 ? 'bg-red-500' :
                      (shops.length / currentPlan.limits.maxShops) * 100 >= 70 ? 'bg-yellow-500' :
                      'bg-primary-500'
                    }`}
                    style={{ width: `${Math.min((shops.length / currentPlan.limits.maxShops) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Storage Usage */}
              {currentPlan.limits.storage > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaDatabase className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium dark:text-gray-200">Storage</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {((user?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB / {(currentPlan.limits.storage / (1024 * 1024 * 1024)).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        ((user?.storageUsed || 0) / currentPlan.limits.storage) * 100 >= 90 ? 'bg-red-500' :
                        ((user?.storageUsed || 0) / currentPlan.limits.storage) * 100 >= 70 ? 'bg-yellow-500' :
                        'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(((user?.storageUsed || 0) / currentPlan.limits.storage) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Other Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <FaPalette className={currentPlan.limits.themes > 1 ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Themes</p>
                    <p className="text-sm font-medium dark:text-gray-200">
                      {currentPlan.limits.themes === Infinity ? 'Unlimited' : currentPlan.limits.themes}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaChartLine className={currentPlan.limits.analytics ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analytics</p>
                    <p className="text-sm font-medium dark:text-gray-200">
                      {currentPlan.limits.analytics ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaGlobe className={currentPlan.limits.customDomain ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Custom Domain</p>
                    <p className="text-sm font-medium dark:text-gray-200">
                      {currentPlan.limits.customDomain ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Plan Comparison */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold dark:text-white">Choose Your Plan</h2>
            
            {/* Billing Period Toggle */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingPeriod === 'yearly' 
                    ? 'bg-primary-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  -30%
                </span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const colors = getColorClasses(plan.color);
              const isCurrent = plan.id === user?.plan;
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  className={`card relative ${
                    isCurrent ? 'border-2 border-primary-500 shadow-lg' : ''
                  } ${plan.popular ? 'border-2 border-blue-500' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <FaStar /> POPULAR
                      </span>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <FaCheck /> CURRENT PLAN
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`text-3xl ${colors.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold dark:text-white">
                      {billingPeriod === 'yearly' && plan.yearlyPrice ? (
                        <>₦{plan.yearlyPrice.toLocaleString()}</>
                      ) : (
                        <>₦{plan.price.toLocaleString()}</>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {billingPeriod === 'yearly' ? 'per year' : `per ${plan.period}`}
                    </div>
                    {billingPeriod === 'yearly' && plan.monthlyEquivalent && (
                      <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                        ₦{plan.monthlyEquivalent.toLocaleString()}/month when billed annually
                      </div>
                    )}
                    {billingPeriod === 'monthly' && plan.yearlyPrice && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                        💰 Save ₦{(plan.price * 12 - plan.yearlyPrice).toLocaleString()} with yearly billing
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <FaCheck className="text-primary-500 mt-1 flex-shrink-0" />
                        ) : (
                          <FaTimes className="text-gray-300 mt-1 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgradeClick(plan)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : `${colors.button} text-white`
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : 
                     getPlanLevel(plan.id) > getPlanLevel(user?.plan) ? 'Upgrade' : 'Change Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boost Section */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1 dark:text-white">Boost your product</h2>
              <p className="text-gray-600 dark:text-gray-300">Get featured at the top of the marketplace. Pricing: ₦400/hour.</p>
            </div>
            <button
              onClick={() => setBoostOpen(true)}
              className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Boost a Product
            </button>
          </div>
        </div>

        {/* Boost Modal */}
        {boostOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold dark:text-white">Start a Boost</h3>
                <button onClick={() => setBoostOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"><FiX /></button>
              </div>
              {products.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">You don’t have any products yet.</p>
                  <Link to="/dashboard/products" className="btn btn-primary inline-block">Add a Product</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Select Product</label>
                    <select
                      className="input"
                      value={boostProductId}
                      onChange={(e) => setBoostProductId(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Hours</label>
                    <select
                      className="input"
                      value={boostHours}
                      onChange={(e) => setBoostHours(Number(e.target.value))}
                    >
                      {[5, 10, 15, 20, 24, 48, 72, 96, 120, 168].map((h) => (
                        <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''} - ₦{(h * 400).toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                  {/* Location targeting */}
                  <div>
                    <label className="label">{`${sellerRegionLabel || 'State/Region'}${sellerCountryName ? ` (${sellerCountryName})` : ''}`}</label>
                    {sellerRegions && sellerRegions.length > 0 ? (
                      <select
                        className="input"
                        value={boostState}
                        onChange={(e) => setBoostState(e.target.value)}
                      >
                        {sellerRegions.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="input"
                        value={boostState}
                        onChange={(e) => setBoostState(e.target.value)}
                        placeholder="Enter state or region"
                      />
                    )}
                  </div>
                  <div>
                    <label className="label">Area (optional)</label>
                    <input
                      type="text"
                      className="input"
                      value={boostArea}
                      onChange={(e) => setBoostArea(e.target.value)}
                      placeholder="e.g., Victoria Island"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Total</span>
                    <span className="text-lg font-semibold">₦{(Number(boostHours || 0) * BOOST_RATE).toLocaleString()}</span>
                  </div>
                  
                  {/* Payment Integration for Boost */}
                  {!boostLoading ? (
                    <FlutterwavePayment
                      amount={Number(boostHours || 0) * BOOST_RATE}
                      email={user?.email}
                      name={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                      phone={user?.phone || ''}
                      planName="Product Boost"
                      billingPeriod={`${boostHours} hour${boostHours > 1 ? 's' : ''}`}
                      paymentType="boost"
                      metadata={{
                        productId: boostProductId,
                        boostHours: Number(boostHours),
                        state: boostState,
                        area: boostArea,
                        country: sellerCountryCode || DEFAULT_COUNTRY_CODE
                      }}
                      returnUrl="/dashboard/subscription"
                      onSuccess={async (paymentData) => {
                        if (!boostProductId) { toast.error('Select a product'); return; }
                        if (!boostHours || boostHours < 1) { toast.error('Enter at least 1 hour'); return; }
                        try {
                          setBoostLoading(true);
                          toast.loading('Activating boost...');
                          await productAPI.boostProduct(boostProductId, { 
                            hours: Number(boostHours), 
                            state: boostState, 
                            area: boostArea,
                            country: sellerCountryCode || DEFAULT_COUNTRY_CODE,
                            transactionId: paymentData.transactionId,
                            txRef: paymentData.txRef
                          });
                          toast.dismiss();
                          toast.success('🎉 Boost activated successfully!');
                          setBoostOpen(false);
                        } catch (e) {
                          toast.dismiss();
                          toast.error(e.userMessage || 'Failed to start boost');
                        } finally {
                          setBoostLoading(false);
                        }
                      }}
                      onClose={(closeData) => {
                        if (closeData?.cancelled) {
                          toast.info('Payment cancelled');
                        } else if (closeData?.failed) {
                          toast.error('Payment failed. Please try again.');
                        }
                      }}
                    >
                      <button
                        className="w-full py-3 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700"
                      >
                        Pay ₦{(Number(boostHours || 0) * BOOST_RATE).toLocaleString()} & Start Boost
                      </button>
                    </FlutterwavePayment>
                  ) : (
                    <button
                      className="w-full py-3 rounded-lg text-white font-semibold bg-purple-400"
                      disabled
                    >
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Activating...
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Preview Modal - Shows discount breakdown */}
        {showPreviewModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${couponData ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {couponData ? (
                    <FaCheck className="text-green-600 dark:text-green-400 text-4xl" />
                  ) : (
                    <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-4xl" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {couponData ? 'Discount Applied!' : 'Review Your Order'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {couponData ? 'Review your order before proceeding to payment' : 'Confirm your subscription details before proceeding'}
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border-2 border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Order Summary</h4>
                
                {/* Plan Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Plan:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Billing:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}
                    </span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-4"></div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  {/* Original Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">{couponData ? 'Original Price:' : 'Price:'}</span>
                    <span className={couponData ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white font-semibold'}>
                      ₦{(billingPeriod === 'yearly' && selectedPlan.yearlyPrice 
                        ? selectedPlan.yearlyPrice 
                        : selectedPlan.price).toLocaleString()}
                    </span>
                  </div>

                  {/* Discount - Only show if coupon applied */}
                  {couponData && (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-green-700 dark:text-green-300 font-medium">Discount:</span>
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded uppercase">
                            {couponData.code}
                          </span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {couponData.discountType === 'percentage' 
                            ? `${couponData.discountValue}% OFF`
                            : `-₦${couponData.discountValue.toLocaleString()}`
                          }
                        </span>
                      </div>

                      {/* Discount Amount */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">You Save:</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {(() => {
                            const originalPrice = billingPeriod === 'yearly' && selectedPlan.yearlyPrice 
                              ? selectedPlan.yearlyPrice 
                              : selectedPlan.price;
                            const discountAmount = couponData.discountType === 'percentage'
                              ? (originalPrice * couponData.discountValue) / 100
                              : couponData.discountValue;
                            return `-₦${discountAmount.toLocaleString()}`;
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {couponData && <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-4"></div>}

                {/* Final Price */}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Total Amount:</span>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${couponData ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`}>
                      {(() => {
                        const originalPrice = billingPeriod === 'yearly' && selectedPlan.yearlyPrice 
                          ? selectedPlan.yearlyPrice 
                          : selectedPlan.price;
                        if (!couponData) return `₦${originalPrice.toLocaleString()}`;
                        
                        const discountAmount = couponData.discountType === 'percentage'
                          ? (originalPrice * couponData.discountValue) / 100
                          : couponData.discountValue;
                        const finalPrice = originalPrice - discountAmount;
                        return `₦${finalPrice.toLocaleString()}`;
                      })()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {billingPeriod === 'yearly' ? 'per year' : 'per month'}
                    </div>
                  </div>
                </div>

                {/* Monthly Equivalent for Yearly */}
                {billingPeriod === 'yearly' && selectedPlan.monthlyEquivalent && (
                  <div className="mt-3 text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Just ₦{(() => {
                        const originalPrice = selectedPlan.yearlyPrice;
                        if (!couponData) return Math.floor(originalPrice / 12).toLocaleString();
                        
                        const discountAmount = couponData.discountType === 'percentage'
                          ? (originalPrice * couponData.discountValue) / 100
                          : couponData.discountValue;
                        const finalPrice = originalPrice - discountAmount;
                        return Math.floor(finalPrice / 12).toLocaleString();
                      })()}/month</strong> when billed annually!
                    </p>
                  </div>
                )}
              </div>

              {/* Benefits Reminder */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  What You&apos;ll Get:
                </h5>
                <ul className="space-y-2">
                  {selectedPlan.features.slice(0, 5).map((feature, idx) => (
                    feature.included && (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <FaCheck className="text-primary-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
                      </li>
                    )
                  ))}
                  {selectedPlan.features.filter(f => f.included).length > 5 && (
                    <li className="text-sm text-gray-500 dark:text-gray-400 italic">
                      + {selectedPlan.features.filter(f => f.included).length - 5} more features...
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowUpgradeModal(true);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-200"
                  disabled={upgrading || paymentInitiated}
                >
                  ← Back
                </button>
                
                {/* Flutterwave Payment Button */}
                {!paymentInitiated ? (
                  (() => {
                    const originalPrice = billingPeriod === 'yearly' && selectedPlan.yearlyPrice 
                      ? selectedPlan.yearlyPrice 
                      : selectedPlan.price;
                    let finalAmount = originalPrice;
                    
                    if (couponData) {
                      const discountAmount = couponData.discountType === 'percentage'
                        ? (originalPrice * couponData.discountValue) / 100
                        : couponData.discountValue;
                      finalAmount = Math.max(0, originalPrice - discountAmount);
                    }
                    
                    // If amount is 0 (100% discount), bypass payment gateway
                    if (finalAmount <= 0) {
                      return (
                        <button
                          onClick={async () => {
                            try {
                              setPaymentInitiated(true);
                              toast.loading('Processing free upgrade...');
                              
                              // Directly process free upgrade
                              await handlePaymentSuccess({
                                transactionId: `FREE_${Date.now()}`,
                                txRef: `free_upgrade_${Date.now()}`,
                                status: 'successful'
                              });
                              
                              toast.dismiss();
                              toast.success('🎉 Plan upgraded successfully! No payment required.');
                            } catch (error) {
                              toast.dismiss();
                              toast.error('Failed to process upgrade');
                              setPaymentInitiated(false);
                            }
                          }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-colors font-bold shadow-lg"
                        >
                          Complete Free Upgrade
                        </button>
                      );
                    }
                    
                    // Normal paid upgrade with Flutterwave
                    return (
                      <FlutterwavePayment
                        amount={finalAmount}
                        email={user?.email}
                        name={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
                        phone={user?.phone || ''}
                        planName={selectedPlan.name}
                        billingPeriod={billingPeriod}
                        paymentType="subscription"
                        metadata={{
                          plan: selectedPlan.id,
                          billingPeriod: billingPeriod,
                          couponCode: couponData ? couponCode.trim() : null,
                          discountApplied: couponData ? true : false
                        }}
                        returnUrl="/dashboard/subscription"
                        onSuccess={handlePaymentSuccess}
                        onClose={handlePaymentClose}
                      >
                        <button
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg transition-colors font-bold shadow-lg"
                        >
                          Proceed to Payment
                        </button>
                      </FlutterwavePayment>
                    );
                  })()
                ) : (
                  <button
                    className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                    disabled
                  >
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verifying...
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Confirmation Modal */}
        {showUpgradeModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${getColorClasses(selectedPlan.color).bg} flex items-center justify-center`}>
                  <selectedPlan.icon className={`text-2xl ${getColorClasses(selectedPlan.color).text}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {getPlanLevel(selectedPlan.id) > getPlanLevel(user?.plan) ? 'Upgrade' : 'Change'} to {selectedPlan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Confirm your plan change</p>
                </div>
              </div>

              {/* Coupon Code Input - Only for Pro and Premium */}
              {(selectedPlan.id === 'pro' || selectedPlan.id === 'premium') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Have a Coupon Code? (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                        setCouponData(null);
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white font-mono text-sm"
                      disabled={couponValidating}
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={couponValidating || !couponCode.trim()}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                    >
                      {couponValidating ? 'Validating...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{couponError}</p>
                  )}
                  {couponData && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FaCheck className="text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                          {couponData.discountType === 'percentage' 
                            ? `${couponData.discountValue}% discount applied!`
                            : `₦${couponData.discountValue} discount applied!`
                          }
                        </span>
                      </div>
                      {couponData.description && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{couponData.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Plan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Billing Period</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Price</span>
                  <span className={`font-semibold ${couponData ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {billingPeriod === 'yearly' && selectedPlan.yearlyPrice ? (
                      <>₦{selectedPlan.yearlyPrice.toLocaleString()}/year</>
                    ) : (
                      <>₦{selectedPlan.price.toLocaleString()}/{selectedPlan.period}</>
                    )}
                  </span>
                </div>
                {couponData && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Final Price</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {(() => {
                        const originalPrice = billingPeriod === 'yearly' && selectedPlan.yearlyPrice 
                          ? selectedPlan.yearlyPrice 
                          : selectedPlan.price;
                        const discountAmount = couponData.discountType === 'percentage'
                          ? (originalPrice * couponData.discountValue) / 100
                          : couponData.discountValue;
                        const finalPrice = originalPrice - discountAmount;
                        return `₦${finalPrice.toLocaleString()}${billingPeriod === 'yearly' ? '/year' : `/${selectedPlan.period}`}`;
                      })()}
                    </span>
                  </div>
                )}
                {billingPeriod === 'yearly' && selectedPlan.monthlyEquivalent && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Monthly Equivalent</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      ₦{selectedPlan.monthlyEquivalent.toLocaleString()}/month
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Shops</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPlan.limits.maxShops} shop{selectedPlan.limits.maxShops > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">Storage</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedPlan.limits.storage === 0 ? 'None' : `${(selectedPlan.limits.storage / (1024 * 1024 * 1024)).toFixed(0)} GB`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Products Limit</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedPlan.limits.products === Infinity ? 'Unlimited' : selectedPlan.limits.products}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedPlan(null);
                    setCouponCode('');
                    setCouponData(null);
                    setCouponError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-200"
                  disabled={upgrading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // If coupon code is entered but not validated, require validation
                    if (couponCode.trim() && !couponData && !couponError) {
                      toast.error('Please click "Apply" to validate your coupon code first');
                      return;
                    }
                    
                    // Always show preview for paid plans (Pro/Premium)
                    if (selectedPlan.id !== 'free') {
                      setShowUpgradeModal(false);
                      setShowPreviewModal(true);
                    } else {
                      // Free plan - this path is for safety fallback; normally we show destructive modal
                      setShowUpgradeModal(false);
                      setShowDowngradeModal(true);
                    }
                  }}
                  className={`flex-1 px-4 py-2 ${getColorClasses(selectedPlan.color).button} text-white rounded-lg transition-colors font-medium`}
                  disabled={upgrading}
                >
                  {upgrading ? 'Processing...' : 'Continue to Preview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Destructive Downgrade Modal (to Free) */}
        {showDowngradeModal && selectedPlan?.id === 'free' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto border-2 border-red-300 dark:border-red-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FaTimes className="text-2xl text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Downgrade to Free (Destructive)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Read carefully — this action permanently removes data.</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-800 dark:text-red-200 mb-2">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                  <li>Only your oldest shop will remain. All other shops will be deleted.</li>
                  <li>In the remaining shop, only the first 10 products will be kept. The rest will be deleted.</li>
                  <li>All shop and product images will be permanently deleted from storage.</li>
                  <li>Your storage usage will be reset and WaZhop branding/watermark will be enforced.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                  Type <span className="font-mono font-semibold">DOWNGRADE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white"
                  placeholder="DOWNGRADE"
                />

                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={ackIrreversible}
                    onChange={(e) => setAckIrreversible(e.target.checked)}
                    className="mt-1"
                  />
                  <span>I understand this is irreversible and my extra shops, products, and images will be permanently deleted.</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDowngradeModal(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-700 dark:text-gray-200"
                  disabled={downgrading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDestructiveDowngrade}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    confirmPhrase.trim().toUpperCase() === 'DOWNGRADE' && ackIrreversible && !downgrading
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-400 cursor-not-allowed'
                  }`}
                  disabled={
                    confirmPhrase.trim().toUpperCase() !== 'DOWNGRADE' || !ackIrreversible || downgrading
                  }
                >
                  {downgrading ? 'Downgrading…' : 'Confirm Downgrade'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
