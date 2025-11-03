import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { userAPI, productAPI, shopAPI } from '../../utils/api';
import toast from 'react-hot-toast';
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

const Subscription = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const productsData = await productAPI.getMyProducts();
      const shopsData = await shopAPI.getMyShops();
      setProducts(productsData);
      setShops(shopsData.shops || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subscription data');
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
        { text: 'Up to 5 products', included: true },
        { text: '1 default theme', included: true },
        { text: 'Basic product management', included: true },
        { text: 'Standard support', included: true },
        { text: 'Storage for images', included: false },
        { text: 'Multiple shops', included: false },
        { text: 'Premium themes', included: false },
        { text: 'Analytics dashboard', included: false },
        { text: 'Custom domain', included: false },
        { text: 'Priority support', included: false }
      ],
      limits: {
        products: 5,
        themes: 1,
        analytics: false,
        customDomain: false,
        maxShops: 1,
        storage: 0
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 6000,
      yearlyPrice: 50400,
      monthlyEquivalent: 4200,
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
        storage: 65 * 1024 * 1024 * 1024 // 65GB in bytes
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

  const handleUpgradeClick = (plan) => {
    if (plan.id === user?.plan) {
      toast.error('You are already on this plan');
      return;
    }
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setUpgrading(true);
      
      // Check if upgrading or downgrading
      const isUpgrade = getPlanLevel(selectedPlan.id) > getPlanLevel(user?.plan);
      
      if (isUpgrade) {
        const data = await userAPI.upgradePlan(selectedPlan.id, billingPeriod === 'yearly' ? 12 : 1, billingPeriod);
        updateUser(data.user);
        toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
      } else {
        const data = await userAPI.downgradePlan(selectedPlan.id);
        updateUser(data.user);
        toast.success(`Successfully changed to ${selectedPlan.name} plan!`);
      }
      
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      fetchData();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error(error.response?.data?.message || 'Failed to change plan');
    } finally {
      setUpgrading(false);
    }
  };

  const getPlanLevel = (planId) => {
    const levels = { free: 0, pro: 1, premium: 2 };
    return levels[planId] || 0;
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage your plan and billing</p>
        </div>

        {/* Current Plan Overview */}
        <div className="card mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getColorClasses(currentPlan.color).bg} flex items-center justify-center`}>
                <currentPlan.icon className={`text-2xl ${getColorClasses(currentPlan.color).text}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">{currentPlan.name} Plan</h2>
                  {user?.plan !== 'free' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{currentPlan.description}</p>
              </div>
            </div>
            <div className="text-left md:text-right flex-shrink-0">
              <div className="text-3xl font-bold">
                ₦{currentPlan.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">per {currentPlan.period}</div>
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpiringSoon && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4 flex items-start gap-2">
              <FaInfoCircle className="text-yellow-600 mt-1" />
              <div>
                <p className="font-semibold text-yellow-800">Plan Expiring Soon</p>
                <p className="text-sm text-yellow-700">
                  Your {currentPlan.name} plan will expire in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                  Renew now to continue enjoying premium features.
                </p>
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FaChartLine className="text-green-500" />
              Usage Statistics
            </h3>
            <div className="space-y-4">
              {/* Products Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaBox className="text-gray-400" />
                    <span className="text-sm font-medium">Products</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {productCount} / {productLimit === Infinity ? '∞' : productLimit}
                  </span>
                </div>
                {productLimit !== Infinity && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usagePercentage >= 90 ? 'bg-red-500' :
                        usagePercentage >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
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
                    <FaStore className="text-gray-400" />
                    <span className="text-sm font-medium">Shops</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {shops.length} / {currentPlan.limits.maxShops}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (shops.length / currentPlan.limits.maxShops) * 100 >= 90 ? 'bg-red-500' :
                      (shops.length / currentPlan.limits.maxShops) * 100 >= 70 ? 'bg-yellow-500' :
                      'bg-green-500'
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
                      <FaDatabase className="text-gray-400" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {((user?.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB / {(currentPlan.limits.storage / (1024 * 1024 * 1024)).toFixed(0)} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        ((user?.storageUsed || 0) / currentPlan.limits.storage) * 100 >= 90 ? 'bg-red-500' :
                        ((user?.storageUsed || 0) / currentPlan.limits.storage) * 100 >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(((user?.storageUsed || 0) / currentPlan.limits.storage) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Other Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <FaPalette className={currentPlan.limits.themes > 1 ? 'text-green-500' : 'text-gray-300'} />
                  <div>
                    <p className="text-xs text-gray-500">Themes</p>
                    <p className="text-sm font-medium">
                      {currentPlan.limits.themes === Infinity ? 'Unlimited' : currentPlan.limits.themes}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaChartLine className={currentPlan.limits.analytics ? 'text-green-500' : 'text-gray-300'} />
                  <div>
                    <p className="text-xs text-gray-500">Analytics</p>
                    <p className="text-sm font-medium">
                      {currentPlan.limits.analytics ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaGlobe className={currentPlan.limits.customDomain ? 'text-green-500' : 'text-gray-300'} />
                  <div>
                    <p className="text-xs text-gray-500">Custom Domain</p>
                    <p className="text-sm font-medium">
                      {currentPlan.limits.customDomain ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Choose Your Plan</h2>
            
            {/* Billing Period Toggle */}
            <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingPeriod === 'yearly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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
                    isCurrent ? 'border-2 border-green-500 shadow-lg' : ''
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
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <FaCheck /> CURRENT PLAN
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`text-3xl ${colors.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold">
                      {billingPeriod === 'yearly' && plan.yearlyPrice ? (
                        <>₦{plan.yearlyPrice.toLocaleString()}</>
                      ) : (
                        <>₦{plan.price.toLocaleString()}</>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {billingPeriod === 'yearly' ? 'per year' : `per ${plan.period}`}
                    </div>
                    {billingPeriod === 'yearly' && plan.monthlyEquivalent && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        ₦{plan.monthlyEquivalent.toLocaleString()}/month when billed annually
                      </div>
                    )}
                    {billingPeriod === 'monthly' && plan.yearlyPrice && (
                      <div className="text-xs text-blue-600 font-semibold mt-1">
                        💰 Save ₦{(plan.price * 12 - plan.yearlyPrice).toLocaleString()} with yearly billing
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <FaTimes className="text-gray-300 mt-1 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
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
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
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

        {/* Payment Notice */}
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 text-xl mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Payment Integration Coming Soon</h3>
              <p className="text-sm text-blue-700">
                We&apos;re currently integrating Paystack for secure payment processing. 
                For now, plan changes are free for testing purposes. 
                Once payment is live, you&apos;ll be charged automatically based on your selected plan.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Confirmation Modal */}
        {showUpgradeModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${getColorClasses(selectedPlan.color).bg} flex items-center justify-center`}>
                  <selectedPlan.icon className={`text-2xl ${getColorClasses(selectedPlan.color).text}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {getPlanLevel(selectedPlan.id) > getPlanLevel(user?.plan) ? 'Upgrade' : 'Change'} to {selectedPlan.name}
                  </h3>
                  <p className="text-sm text-gray-500">Confirm your plan change</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">₦{selectedPlan.price.toLocaleString()}/{selectedPlan.period}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Shops</span>
                  <span className="font-semibold">{selectedPlan.limits.maxShops} shop{selectedPlan.limits.maxShops > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-semibold">
                    {selectedPlan.limits.storage === 0 ? 'None' : `${(selectedPlan.limits.storage / (1024 * 1024 * 1024)).toFixed(0)} GB`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Products Limit</span>
                  <span className="font-semibold">
                    {selectedPlan.limits.products === Infinity ? 'Unlimited' : selectedPlan.limits.products}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Payment integration is coming soon. 
                  This change is currently free for testing.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedPlan(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={upgrading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  className={`flex-1 px-4 py-2 ${getColorClasses(selectedPlan.color).button} text-white rounded-lg transition-colors font-medium`}
                  disabled={upgrading}
                >
                  {upgrading ? 'Processing...' : 'Confirm'}
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
