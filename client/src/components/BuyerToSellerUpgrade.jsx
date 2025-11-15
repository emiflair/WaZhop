import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaWhatsapp, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BuyerToSellerUpgrade = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: ['Up to 10 products', '1 shop', 'Basic analytics', 'WhatsApp support']
    },
    pro: {
      name: 'Pro',
      price: 5000,
      features: ['Up to 100 products', '2 shops', 'Advanced analytics', 'Priority support', 'Custom themes']
    },
    premium: {
      name: 'Premium',
      price: 15000,
      features: ['Unlimited products', '3 shops', 'Full analytics', '24/7 support', 'All themes', 'API access']
    }
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    
    if (!whatsappNumber || !/^\+?[1-9]\d{1,14}$/.test(whatsappNumber)) {
      toast.error('Please enter a valid WhatsApp number with country code');
      return;
    }
    
    setStep(2);
  };

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setLoading(true);

    try {
      const response = await userAPI.switchToSeller(whatsappNumber, plan);
      
      if (response.success) {
        updateUser(response.user);
        toast.success(response.message || 'Successfully upgraded to seller!');
        onClose();
        navigate('/dashboard');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Become a Seller' : 'Choose Your Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
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
                    placeholder="+234XXXXXXXXXX"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Include country code (e.g., +234 for Nigeria)
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Continue to Plan Selection
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Select a plan to start selling on WaZhop
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <button
                    key={key}
                    onClick={() => handlePlanSelect(key)}
                    disabled={loading}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedPlan === key
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-3">
                      {plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}/mo`}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                          <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to WhatsApp Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerToSellerUpgrade;
