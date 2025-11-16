import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { FiCheck } from 'react-icons/fi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useMarketingTheme } from '../hooks/useMarketingTheme';

const Pricing = () => {
  useMarketingTheme(); // Force light mode for marketing page
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const { user, isAuthenticated, updateUser } = useAuth();
  const isBuyer = isAuthenticated && user?.role === 'buyer';
  const navigate = useNavigate();
  const location = useLocation();
  // Boost modal state
  const [boostOpen, setBoostOpen] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [boostHours, setBoostHours] = useState(5);
  const [boostProductId, setBoostProductId] = useState('');
  const [boostState, setBoostState] = useState('Lagos');
  const [boostArea, setBoostArea] = useState('');
  const BOOST_RATE = 400;

  // Become Seller modal
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeWhatsapp, setUpgradeWhatsapp] = useState('');
  const [upgradeReferral, setUpgradeReferral] = useState('');
  const [savingUpgrade, setSavingUpgrade] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: '₦0',
      yearlyPrice: '₦0',
      period: 'forever',
      features: [
        '1 shop',
        'Up to 10 products',
        '1 default theme (white)',
        'Basic product management',
        'Standard support'
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '₦9,000',
      yearlyPrice: '₦75,600',
      monthlyEquivalent: '₦6,300',
      period: '/month',
      yearlyDiscount: '30%',
      features: [
        'Up to 100 products',
        'Up to 2 shops',
        '10 premium themes with gradients',
        'Inventory management system',
        'Low stock alerts',
        'Automated stock tracking',
        'Custom subdomain (yourshop.wazhop.ng)',
        'No WaZhop branding',
        'Advanced analytics',
        'Priority support',
        '65GB storage',
      ],
      cta: 'Start Pro',
      popular: true,
    },
    {
      name: 'Premium',
      price: '₦18,000',
      yearlyPrice: '₦151,200',
      monthlyEquivalent: '₦12,600',
      period: '/month',
      yearlyDiscount: '30%',
      features: [
        'Unlimited products',
        'Up to 3 shops',
        'All themes + custom colors',
        'Force storefront theme (Light/Dark/Auto)',
        'Payment integration (Flutterwave/Paystack)',
        'Accept direct payments from customers',
        'Custom domain (myshop.com)',
        'Custom subdomain',
        'No WaZhop branding',
        'Advanced analytics & insights',
        '24/7 Priority support',
        '1TB storage',
        'Custom CSS',
      ],
      cta: 'Go Premium',
      popular: false,
    },
    // Add-on plan for Boosting
    {
      name: 'Boost',
      price: '₦400',
      period: '/hour',
      isBoost: true,
      features: [
        'Featured at the top while active',
        'Location targeting (State & Area)',
        'Pay as you go – no commitment',
      ],
      cta: 'Boost a Product',
      ctaLink: '/login',
      popular: false,
    },
  ];

  useEffect(() => {
    if (!boostOpen) return;
    const load = async () => {
      try {
        setLoadingProducts(true);
        const list = await productAPI.getMyProducts();
        setMyProducts(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) {
          setBoostProductId(list[0]._id);
        }
      } catch (e) {
        toast.error('Please log in to boost a product');
        setMyProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, [boostOpen]);

  // Auto-open the upgrade modal when arriving with ?upgrade=seller and user is a buyer
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (isBuyer && (params.get('upgrade') === 'seller' || params.get('upgrade') === '1' || params.has('upgrade'))) {
        setUpgradeOpen(true);
      }
    } catch (e) {
      // Safe fallback if query parsing fails
      console.warn('Failed to parse upgrade query param', e);
    }
  }, [location.search, isBuyer]);

  const openBoostFlow = () => {
    // If not authenticated, go to login
    if (!user) {
      navigate('/login');
      return;
    }
    setBoostOpen(true);
  };

  const submitBoost = async () => {
    if (!boostProductId) {
      toast.error('Select a product to boost');
      return;
    }
    if (!boostHours || Number(boostHours) < 1) {
      toast.error('Enter at least 1 hour');
      return;
    }
    try {
      await productAPI.boostProduct(boostProductId, { hours: Number(boostHours), state: boostState, area: boostArea });
      toast.success('Boost activated');
      setBoostOpen(false);
    } catch (e) {
      toast.error(e.userMessage || 'Failed to start boost');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow py-8 sm:py-12 md:py-16 bg-gray-50 dark:bg-gray-900 px-4">
        <div className="container-custom">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100 px-4">
              {isBuyer ? 'Become a Seller' : 'Become A Verified Seller In Minutes'}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-4">
              {isBuyer ? 'These are seller plans. Upgrade to start selling on WaZhop.' : "Choose the plan that's right for your business"}
            </p>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm sm:text-base font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                  billingPeriod === 'yearly' ? 'bg-accent-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm sm:text-base font-medium ${billingPeriod === 'yearly' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Yearly
                </span>
                <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-semibold px-2 py-1 rounded-full">
                  Save 30%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-100 dark:border-gray-700 ${
                  plan.popular ? 'ring-2 ring-accent-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-accent-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {plan.isBoost
                          ? plan.price
                          : (billingPeriod === 'yearly' && plan.yearlyPrice !== plan.price ? plan.yearlyPrice : plan.price)}
                      </span>
                      <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-2">
                        {plan.isBoost
                          ? plan.period
                          : (billingPeriod === 'yearly' && plan.yearlyPrice !== plan.price ? '/year' : plan.period)}
                      </span>
                    </div>
                    {!plan.isBoost && billingPeriod === 'yearly' && plan.monthlyEquivalent && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {plan.monthlyEquivalent}/month when billed annually
                      </div>
                    )}
                    {!plan.isBoost && billingPeriod === 'monthly' && plan.yearlyDiscount && (
                      <div className="mt-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
                        Save {plan.yearlyDiscount} with yearly billing
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <FiCheck className="text-primary-500 mt-1 mr-2 sm:mr-3 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.isBoost ? (
                  <button
                    onClick={openBoostFlow}
                    className={`w-full text-center block text-sm sm:text-base py-3 sm:py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white`}
                  >
                    {plan.cta}
                  </button>
                ) : isBuyer ? (
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className={`btn w-full text-center block text-sm sm:text-base py-3 sm:py-2 ${
                      plan.popular ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    Become a Seller
                  </button>
                ) : (
                  <Link
                    to={isAuthenticated ? '/dashboard/subscription' : (plan.ctaLink || '/register?role=seller')}
                    className={`btn w-full text-center block text-sm sm:text-base py-3 sm:py-2 ${
                      plan.popular ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Boost Modal */}
      {boostOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Boost a Product</h3>
              <button onClick={() => setBoostOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            {!user ? (
              <div className="text-sm text-gray-700">Please log in to boost a product.</div>
            ) : loadingProducts ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : myProducts.length === 0 ? (
              <div className="space-y-4">
                <p className="text-gray-700">You don’t have any products yet.</p>
                <Link to="/dashboard/products" className="btn btn-primary">Add a Product</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">Select Product</label>
                  <select className="input" value={boostProductId} onChange={(e) => setBoostProductId(e.target.value)}>
                    {myProducts.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Hours</label>
                  <input type="number" min={1} className="input" value={boostHours} onChange={(e) => setBoostHours(Number(e.target.value))} />
                </div>
                {/* Location targeting */}
                <div>
                  <label className="label">State (Nigeria)</label>
                  <select className="input" value={boostState} onChange={(e) => setBoostState(e.target.value)}>
                    {['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Area (optional)</label>
                  <input className="input" type="text" placeholder="e.g., Victoria Island" value={boostArea} onChange={(e) => setBoostArea(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Total</span>
                  <span className="text-lg font-semibold">₦{(Number(boostHours || 0) * BOOST_RATE).toLocaleString()}</span>
                </div>
                <button onClick={submitBoost} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3">
                  Start Boost
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Become Seller Modal */}
      {upgradeOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Switch to a Seller Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Enter your WhatsApp number to start selling. We’ll update your account and create a default shop.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">WhatsApp Number <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={upgradeWhatsapp}
                  onChange={(e) => setUpgradeWhatsapp(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +234 for Nigeria)</p>
              </div>
              <div>
                <label className="label">Referral Code <span className="text-gray-400 text-xs">(optional)</span></label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter referral code (optional)"
                  value={upgradeReferral}
                  onChange={(e) => setUpgradeReferral(e.target.value.toUpperCase())}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (!upgradeWhatsapp) { toast.error('Enter your WhatsApp number'); return; }
                    try {
                      setSavingUpgrade(true);
                      const payload = { whatsapp: upgradeWhatsapp };
                      if (upgradeReferral && upgradeReferral.trim()) {
                        payload.referralCode = upgradeReferral.trim();
                      }
                      const res = await authAPI.upgradeToSeller(payload);
                      if (res?.token && res?.user) {
                        localStorage.setItem('token', res.token);
                        localStorage.setItem('user', JSON.stringify(res.user));
                        updateUser(res.user);
                      }
                      toast.success('Your account is now a seller!');
                      setUpgradeOpen(false);
                      // Send new seller to shop settings to complete setup
                      navigate('/dashboard/shop');
                    } catch (e) {
                      toast.error(e.userMessage || 'Failed to upgrade account');
                    } finally {
                      setSavingUpgrade(false);
                    }
                  }}
                  className="btn btn-primary flex-1"
                  disabled={savingUpgrade}
                >
                  {savingUpgrade ? 'Upgrading…' : 'Become a Seller'}
                </button>
                <button onClick={() => setUpgradeOpen(false)} className="btn btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Pricing;
