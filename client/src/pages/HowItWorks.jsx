import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
        title="How It Works - Simple Steps to Start Selling | WaZhop"
        description="Learn how to create your digital shop in 4 easy steps. Sign up, customize, share, and start selling on WhatsApp in minutes."
      />
      <Navbar />
      <div className="flex-grow py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 dark:text-gray-100">How It Works</h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            WaZhop is WhatsApp‑first. Sellers create shops and can optionally Boost to reach buyers in specific locations.
            Buyers browse, filter by State/Area, and chat on WhatsApp to buy.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            <section>
              <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">For Sellers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {sellerSteps.map((step) => (
                  <div key={`s-${step.number}`} className="text-center">
                    <div className="w-14 h-14 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold mb-1.5 dark:text-gray-100">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6 dark:text-gray-100">For Buyers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {buyerSteps.map((step) => (
                  <div key={`b-${step.number}`} className="text-center">
                    <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3 shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold mb-1.5 dark:text-gray-100">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <div className="card bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">About Boosts</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Boosting improves marketplace visibility within the State and Area you choose. It does not guarantee
                clicks or sales. Keep products accurate and responsive on WhatsApp for best results.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorks;
