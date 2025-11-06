import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Get In Touch
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-600">support@wazhop.com</p>
              <p className="text-xs text-gray-500 mt-1">We typically reply within 24 hours (Mon–Fri)</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPhone className="text-primary-600" size={24} />
              </div>
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-gray-600">+234 801 234 5678</p>
              <p className="text-xs text-gray-500 mt-1">Support chats only—no voice calls</p>
            </div>

            <div className="text-center">
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
      <Footer />
    </div>
  );
};

export default Contact;
