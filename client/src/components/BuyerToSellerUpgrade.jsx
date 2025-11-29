import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { normalizeAfricanPhoneNumber, isValidAfricanPhone } from '../utils/helpers';
import useDefaultDialCode from '../hooks/useDefaultDialCode';

const BuyerToSellerUpgrade = ({ onClose }) => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const defaultDialCode = useDefaultDialCode();

  useEffect(() => {
    if (!defaultDialCode) return;
    setWhatsappNumber((prev) => {
      if (prev && prev.trim()) {
        return prev;
      }
      return defaultDialCode;
    });
  }, [defaultDialCode]);

  const handleWhatsAppSubmit = async (e) => {
    e.preventDefault();
    
    if (!whatsappNumber || !isValidAfricanPhone(whatsappNumber)) {
      toast.error('Please enter a valid phone number with country code (e.g., +233201234567)');
      return;
    }

    const normalized = normalizeAfricanPhoneNumber(whatsappNumber);
    if (!normalized) {
      toast.error('Please enter a valid phone number with country code (e.g., +233201234567)');
      return;
    }
    
    setLoading(true);

    try {
      // Switch to seller with free plan by default
      const response = await userAPI.switchToSeller(normalized, 'free');
      
      if (response.success) {
        updateUser(response.user);
        toast.success(response.message || 'Successfully upgraded to seller!');
        onClose();
        // Redirect to subscription page
        navigate('/dashboard/subscription');
      }
    } catch (error) {
      console.error('Switch to seller error:', error);
      toast.error(error.response?.data?.message || 'Failed to switch to seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Become a Seller
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <FaWhatsapp className="absolute left-3 top-3 text-green-500" size={20} />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g., +233201234567"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Include country code (e.g., +233201234567 or +2348012345678)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Continue to Subscription'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuyerToSellerUpgrade;
