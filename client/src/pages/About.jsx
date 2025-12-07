import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';

const About = () => {
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
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default About;
