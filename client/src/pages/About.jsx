import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <div className="flex-grow container-custom py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 dark:text-gray-100">About WaZhop</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">
            WaZhop helps Nigerian entrepreneurs launch and grow shops that use WhatsApp for sales. Create a
            beautiful storefront, add products, and sell where your customers already chat: WhatsApp.
          </p>

          <h2>What&apos;s new</h2>
          <ul>
            <li><strong>Location Boosts:</strong> Promote products by State and Area so nearby buyers find you first.</li>
            <li><strong>Upgrade in one step:</strong> Already buying? Become a seller with your WhatsApp number. You can add a referral code if you have one.</li>
            <li><strong>Plans that fit:</strong> Clear limits across Free, Pro, and Premium. Pay only when you need more.</li>
            <li><strong>Better experience:</strong> Choose light or dark theme and it stays that way until you change it.</li>
            <li><strong>Sharp images:</strong> Fast, reliable uploads so your shop always looks good.</li>
          </ul>

          <h2>How we work</h2>
          <p>
            We keep it simple. Buyers browse your shop and message you on WhatsApp to order. Sellers keep control of
            pricing, fulfillment, and customer relationships.
          </p>

          <h2>Our promise</h2>
          <ul>
            <li>Clear information. Boosts improve visibility but do not guarantee sales.</li>
            <li>Respect for privacy. We only collect what we need to run your shop.</li>
            <li>Built for Nigeria. Made for local buyers and sellers.</li>
          </ul>

          <h2>Plans that grow with you</h2>
          <p>
            Start free and upgrade when you are ready. Pro and Premium unlock more products, shops, analytics, and priority support.
            You can cancel anytime. We will keep your data and move you back to Free.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
