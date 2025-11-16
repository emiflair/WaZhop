import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import LazyImage from '../components/LazyImage';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { useMarketingTheme } from '../hooks/useMarketingTheme';

const About = () => {
  useMarketingTheme(); // Force light mode for marketing page
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        // Fetch trending products based on engagement (clicks and views)
        const response = await api.get('/products/marketplace?limit=4&sort=-clicks,-views');
        setTrendingProducts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch trending products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <div className="flex-1 py-16 pb-24 md:pb-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 dark:text-gray-100">About WaZhop</h1>
          <div className="max-w-3xl mx-auto text-center">
            <div className="space-y-8 text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                WaZhop helps Nigerian entrepreneurs launch and grow shops that use WhatsApp for sales. Create a
                beautiful storefront, add products, and sell where your customers already chat: WhatsApp.
              </p>

              <h2 className="text-2xl sm:text-3xl font-semibold dark:text-gray-100">What&apos;s new</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">Location Boosts:</span> Promote products by State and Area so nearby buyers find you first.</p>
                <p><span className="font-semibold">Upgrade in one step:</span> Already buying? Become a seller with your WhatsApp number. You can add a referral code if you have one.</p>
                <p><span className="font-semibold">Plans that fit:</span> Clear limits across Free, Pro, and Premium. Pay only when you need more.</p>
                <p><span className="font-semibold">Better experience:</span> Choose light or dark theme and it stays that way until you change it.</p>
                <p><span className="font-semibold">Sharp images:</span> Fast, reliable uploads so your shop always looks good.</p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold dark:text-gray-100">How we work</h2>
              <p>
                We keep it simple. Buyers browse your shop and message you on WhatsApp to order. Sellers keep control of
                pricing, fulfillment, and customer relationships.
              </p>

              <h2 className="text-2xl sm:text-3xl font-semibold dark:text-gray-100">Our promise</h2>
              <div className="space-y-2">
                <p>Clear information. Boosts improve visibility but do not guarantee sales.</p>
                <p>Respect for privacy. We only collect what we need to run your shop.</p>
                <p>Built for Nigeria. Made for local buyers and sellers.</p>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold dark:text-gray-100">Plans that grow with you</h2>
              <p>
                Start free and upgrade when you are ready. Pro and Premium unlock more products, shops, analytics, and priority support.
                You can cancel anytime. We will keep your data and move you back to Free.
              </p>
            </div>
          </div>

          {/* Trending Products Section */}
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8 dark:text-gray-100">Trending Now</h2>
            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : trendingProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {trendingProducts.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <LazyImage
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-primary-600 dark:text-primary-400 font-bold mt-1 text-sm sm:text-base">
                        ₦{product.price?.toLocaleString()}
                      </p>
                      {product.shop?.name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {product.shop.name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No trending products at the moment</p>
            )}
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default About;
