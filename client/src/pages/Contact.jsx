import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { FiMail, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 py-16 pb-24 md:pb-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 tracking-tight">
            <span className="bg-gradient-to-r from-primary-600 via-orange-500 to-primary-600 bg-clip-text text-transparent">Get In Touch</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:support@wazhop.ng" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 underline-offset-2 hover:underline">support@wazhop.ng</a>
              <p className="text-xs text-gray-500 mt-1">We typically reply within 24 hours (Mon–Fri)</p>
            </div>

            <a
              href="https://wa.me/2348169875198"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with WaZhop Support on WhatsApp"
              className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaWhatsapp className="text-primary-600" size={26} />
              </div>
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-gray-700 dark:text-gray-200 font-medium">+234 816 987 5198</p>
              <p className="text-xs text-gray-500 mt-1">Support chats only — no voice calls</p>
              <div className="mt-4">
                <span className="btn btn-primary px-5 py-2 inline-block">Chat on WhatsApp</span>
              </div>
            </a>

            <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-gray-600">Lagos, Nigeria</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-12">
            <div className="card bg-gray-50">
              <p className="text-gray-600 text-sm">
                For legal or privacy questions, see our{' '}
                <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a>{' '}and{' '}
                <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};

export default Contact;
