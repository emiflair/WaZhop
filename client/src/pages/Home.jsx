import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiZap, FiCheck, FiStar, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { FaPalette, FaWhatsapp, FaDollarSign, FaUsers } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LazyImage from '../components/LazyImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMarketingTheme } from '../hooks/useMarketingTheme';

const Home = () => {
  useMarketingTheme(); // Force light mode for marketing page
  const { isAuthenticated, user } = useAuth();
  const isSeller = isAuthenticated && (user?.role === 'seller' || user?.role === 'admin');
  const isBuyer = isAuthenticated && user?.role === 'buyer';
  
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products/marketplace?limit=4&sort=-createdAt');
        // API interceptor already extracts data from { success: true, data: [...] }
        setFeaturedProducts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const getStartedHref = () => {
    if (!isAuthenticated) return '/register?role=seller';
    if (isSeller) return '/dashboard';
    if (isBuyer) return '/pricing?upgrade=seller';
    return '/pricing';
  };

  const plans = [
    {
      name: 'Free',
      price: '₦0',
      period: 'forever',
      features: ['1 shop', '10 products', 'WhatsApp integration', 'Basic customization']
    },
    {
      name: 'Pro',
      priceMonthly: '₦9,000',
      priceYearly: '₦75,600',
      period: 'month',
      popular: true,
      savings: '30%',
      features: ['Up to 2 shops', '100 products', 'Inventory management', 'Premium themes', 'Advanced analytics', 'Priority support']
    },
    {
      name: 'Premium',
      priceMonthly: '₦18,000',
      priceYearly: '₦151,200',
      period: 'month',
      savings: '30%',
      features: ['Up to 3 shops', 'Unlimited products', 'Payment integration', 'Custom domain', 'Remove Wazhop branding', '24/7 support']
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <SEO
        title="Your Own Digital Shop in Minutes. Sell Anywhere, Anytime | Wazhop"
        description="Wazhop gives you a fully customizable digital shop with your own brand, logo, and style. Reach customers instantly on WhatsApp and grow your business from home."
        keywords="WhatsApp shop, online store, e-commerce, sell online, WhatsApp business, digital shop, custom storefront"
        type="website"
      />
      <Navbar />
      
      {/* Hero Section - Native App Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 dark:from-primary-700 dark:via-primary-800 dark:to-accent-800 py-20 sm:py-24 md:py-32">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgyem0wIDMwaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="app-container relative z-10">
          <div className="text-center max-w-5xl mx-auto px-4">
            {/* Badge */}
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 mb-8 animate-fadeIn">
              <FiZap className="w-4 h-4 text-white mr-2" />
              <span className="text-sm font-semibold text-white">Launch Your Shop in Minutes</span>
            </div>
            
            <h1 className="app-heading text-white mb-6 leading-tight animate-fadeIn">
              Your Own Digital Shop.<br />
              <span className="text-white/90">Sell Anywhere, Anytime</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeIn">
              Build a fully customizable digital shop with your brand, logo, and style. Reach customers instantly and professionally.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fadeIn">
              <Link 
                to={getStartedHref()} 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-white text-primary-600 hover:bg-gray-50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 min-h-[56px]"
              >
                <FiShoppingBag className="mr-2" size={20} />
                Create Your Shop - Free Forever
              </Link>
              <Link 
                to="/" 
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-200 min-h-[56px]"
              >
                <FiTrendingUp className="mr-2" size={20} />
                Browse Marketplace
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-white/80 text-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Setup in 5 Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - App Style */}
      <section className="app-section bg-gray-50 dark:bg-gray-900">
        <div className="app-container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-4">
              <FiTrendingUp className="mr-2" size={16} />
              Trending Now
            </div>
            <h2 className="app-heading text-gray-900 dark:text-gray-100 mb-4">
              Trending Products
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover what&apos;s hot on Wazhop. Your products could be here too!
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {featuredProducts.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    state={{ fromMarketplace: true }}
                    className="group app-card hover:-translate-y-2 transform transition-all duration-300"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 relative">
                      {product.isBoosted && (
                        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <FiStar className="w-3 h-3" />
                          <span>Boosted</span>
                        </div>
                      )}
                      <LazyImage
                        src={product.images?.[0]?.url ?? product.images?.[0] ?? '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        width={600}
                        height={600}
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        transform={{ w: 600, h: 600, fit: 'fill' }}
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          ₦{product.price?.toLocaleString()}
                        </span>
                        {product.shop?.shopName && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            {product.shop.shopName}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-xl bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Explore All Products
                  <FiArrowRight size={20} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FiShoppingBag className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                No products yet. Be the first seller on Wazhop!
              </p>
              <Link to={getStartedHref()} className="btn btn-primary">
                Start Selling Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Three Key Benefits - App Cards */}
      <section className="app-section bg-white dark:bg-gray-900">
        <div className="app-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="app-card text-center group">
              <div className="w-20 h-20 app-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <FaPalette className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Customizable Storefronts</h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Pick your colors, upload your logo, and make your shop truly yours with complete branding control.
              </p>
            </div>

            <div className="app-card text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <FaWhatsapp className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Direct Customer Connection</h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Buyers contact you directly on WhatsApp. Build relationships without any middlemen or commissions.
              </p>
            </div>

            <div className="app-card text-center group">
              <div className="w-20 h-20 app-gradient-accent rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <FaDollarSign className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Simple & Affordable</h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Start free forever. Launch your store in minutes and upgrade only when you need more power.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Modern Steps */}
      <section className="app-section bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-primary-900/10">
        <div className="app-container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-sm font-semibold mb-4">
              <FiZap className="mr-2" size={16} />
              Quick Setup
            </div>
            <h2 className="app-heading text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get your digital shop live in just four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="app-card-elevated group">
              <div className="w-16 h-16 app-gradient-primary rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Sign Up & Set Up</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Enter your business name, upload your logo, and choose your style in minutes.
              </p>
            </div>

            <div className="app-card-elevated group">
              <div className="w-16 h-16 app-gradient-primary rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Add Your Products</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                List products with stunning images, descriptions, and competitive prices.
              </p>
            </div>

            <div className="app-card-elevated group">
              <div className="w-16 h-16 app-gradient-accent rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Share Your Link</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Share your unique shop link via WhatsApp, Instagram, or any social platform.
              </p>
            </div>

            <div className="app-card-elevated group">
              <div className="w-16 h-16 app-gradient-accent rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                4
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Sell & Grow</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Connect directly with buyers. Keep full control and maximize your profits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Wazhop */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 px-4">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why Wazhop?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for real sellers who want control, flexibility, and growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FiStar className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 dark:text-gray-100">Your Brand, Your Way</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No templates that look like everyone else. Your colors, your logo, your style.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FiZap className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 dark:text-gray-100">Sell Without Barriers</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No complicated payment systems. You decide how you get paid.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent-600 dark:bg-accent-700/30 rounded-lg flex items-center justify-center">
                  <FiShoppingBag className="text-white dark:text-accent-300" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 dark:text-gray-100">Designed for Real Sellers</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  From fashion to electronics, skincare to cakes. Wazhop works for any product.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent-700 dark:bg-accent-800/30 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-white dark:text-accent-300" size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 dark:text-gray-100">Affordable & Flexible</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Choose a plan that suits your needs. Free, Pro, or Premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 px-4">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <FaUsers size={40} />
                <span className="text-5xl font-bold">50,000+</span>
              </div>
              <p className="text-xl">Sellers currently using Wazhop to grow their business</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800 px-4">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              Choose the plan that works for you
            </p>
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
              💰 Save 30% when you pay yearly!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'border-4 border-primary-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-4 dark:text-gray-100">{plan.name}</h3>
                
                {plan.priceMonthly ? (
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {plan.priceMonthly}
                      <span className="text-lg text-gray-500">/{plan.period}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      or {plan.priceYearly}/year (save {plan.savings})
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    {plan.price}
                    <span className="text-lg text-gray-500">/{plan.period}</span>
                  </div>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FiCheck className="text-primary-500 mt-1 flex-shrink-0" size={20} />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={getStartedHref()}
                  className={`block w-full py-3 px-6 rounded-lg text-center font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing" className="text-primary-600 dark:text-primary-400 hover:underline text-lg font-medium">
              View detailed pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white px-4">
        <div className="container-custom text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Your Shop. Your Brand. Your Way.
          </h2>
          <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Start Selling Today.
          </p>
          <Link 
            to={getStartedHref()} 
            className="inline-block bg-white text-primary-600 hover:bg-gray-100 text-xl px-12 py-5 rounded-lg font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
          >
            Create My Shop Now
          </Link>
          <p className="text-sm mt-4 opacity-75">
            Join 50,000+ sellers already growing with Wazhop
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
