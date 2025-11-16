import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import logoWhite from '/wazhoplogo/Logowhite.PNG?url';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, user } = useAuth();
  const isBuyer = isAuthenticated && user?.role === 'buyer';

  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4 -ml-14">
                          <img src={logoWhite} alt="WaZhop" className="h-20 w-auto object-contain mb-3" />
            </div>
            <p className="text-gray-400 text-sm">
              Create your WhatsApp shop in minutes. Customize, share, and sell smarter.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {!isBuyer && (
                <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
              )}
              <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1CD2GNxUEw/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FiFacebook size={20} />
              </a>
              <a href="https://www.instagram.com/wazhop.ng?igsh=Z2Nqd2w3eTF0bHdo&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <FiInstagram size={20} />
              </a>
              <a href="mailto:support@wazhop.ng" className="text-gray-400 hover:text-white transition">
                <FiMail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Apps */}
        <div className="flex flex-row items-center justify-center gap-4 mb-8 pb-8 border-b border-gray-800">
          <button
            onClick={() => toast('iOS app coming soon! 🚀', { icon: '📱' })}
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
              alt="Download on the App Store" 
              className="h-10 sm:h-12"
            />
          </button>
          <button
            onClick={() => toast('Android app coming soon! 🚀', { icon: '📱' })}
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
              alt="Get it on Google Play" 
              className="h-[60px] sm:h-[72px]"
            />
          </button>
        </div>

                {/* Copyright */}
        <div className="pt-8 text-center">
          <p>&copy; {currentYear} WaZhop. All rights reserved. Made in Nigeria.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
