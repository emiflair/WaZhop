import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
import logo from '../assets/brand/wazhop-icon.svg';

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
            <div className="flex items-center space-x-0 mb-4">
              <img src={logo} alt="WaZhop logo" className="w-9 h-9 rounded-lg shadow-sm" decoding="async" loading="eager" />
              <span className="-ml-2 tracking-tighter text-2xl font-bold">aZhop</span>
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

                {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p>&copy; {currentYear} WaZhop. All rights reserved. Made in Nigeria.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
