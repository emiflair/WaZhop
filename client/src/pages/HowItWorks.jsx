import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import SEO from '../components/SEO';

const HowItWorks = () => {
  const sellerSteps = [
    {
      number: '1',
      title: 'Create or Upgrade',
      description: 'Sign up free or upgrade from a buyer account. You’ll provide your WhatsApp Business number.',
    },
    {
      number: '2',
      title: 'Set Up Your Shop',
      description: 'Add your shop name, brand, and products with clear photos and prices.',
    },
    {
      number: '3',
      title: 'Boost (Optional)',
      description: 'Target your State and Area so local buyers see your products first in the marketplace.',
    },
    {
      number: '4',
      title: 'Share and Sell on WhatsApp',
      description: 'Share your shop link. Buyers message you directly on WhatsApp to order—simple and fast.',
    },
  ];

  const buyerSteps = [
    {
      number: '1',
      title: 'Browse the Marketplace',
      description: 'Filter by category, State, and Area to find nearby products and services.',
    },
    {
      number: '2',
      title: 'Chat to Buy',
      description: 'Open the product and tap “Chat on WhatsApp” to discuss and complete your order with the seller.',
    },
    {
      number: '3',
      title: 'Want to Sell?',
      description: 'Upgrade to a seller in one step using your WhatsApp number. You can add a referral code (optional).',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <SEO
        title="How It Works"
        description="Learn how to create your digital shop in 4 easy steps. Sign up, customize, share, and start selling on WhatsApp in minutes."
      />
      <Navbar />
      <div className="flex-1 pb-24 md:pb-8">
        {/* Hero Section */}
        <section className="app-section bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 dark:from-primary-700 dark:via-primary-800 dark:to-accent-800 text-white">
          <div className="app-container text-center">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8">
              <span className="text-sm font-semibold">Simple & Powerful</span>
            </div>
            <h1 className="app-heading mb-6">How It Works</h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              WaZhop is WhatsApp‑first. Sellers create shops and boost visibility. Buyers browse and connect instantly.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="app-section bg-white dark:bg-gray-900">
          <div className="app-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* For Sellers */}
              <section>
                <div className="mb-10">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-4">
                    For Sellers
                  </div>
                  <h2 className="app-subheading text-gray-900 dark:text-gray-100 mb-4">Start Selling in Minutes</h2>
                </div>
                <div className="space-y-6">
                  {sellerSteps.map((step) => (
                    <div key={`s-${step.number}`} className="app-card group">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-16 h-16 app-gradient-primary rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {step.number}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{step.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* For Buyers */}
              <section>
                <div className="mb-10">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
                    For Buyers
                  </div>
                  <h2 className="app-subheading text-gray-900 dark:text-gray-100 mb-4">Shop with Confidence</h2>
                </div>
                <div className="space-y-6">
                  {buyerSteps.map((step) => (
                    <div key={`b-${step.number}`} className="app-card group">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {step.number}
                        </div>
                        <div className="flex-1 pt-1">
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{step.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* About Boosts Section */}
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="app-card-elevated bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent-600 dark:bg-accent-700 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">About Boosts</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                      Boosting improves marketplace visibility within the State and Area you choose. It does not guarantee
                      clicks or sales. Keep products accurate and responsive on WhatsApp for best results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default HowItWorks;
