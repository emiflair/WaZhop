import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FaStore, FaWhatsapp, FaTimes } from 'react-icons/fa';

const BuyerToSellerUpgrade = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: WhatsApp, 2: Plan Selection
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: ['1 shop', 'Up to 10 products', '1 default theme', 'Basic support']
    },
    pro: {
      name: 'Pro',
      price: 5000,
      features: ['2 shops', 'Up to 100 products', '10 preset themes', '65GB storage', 'Analytics', 'Inventory management']
    },
    premium: {
      name: 'Premium',
      price: 15000,
      features: ['3 shops', 'Unlimited products', 'Unlimited customization', '1TB storage', 'Custom domain', 'Priority support']
    }
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    
    // Validate WhatsApp number
    if (!whatsappNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error('Please enter a valid WhatsApp number with country code (e.g., +2348012345678)');
      return;
    }

    setStep(2);
  };

  const handlePlanSelect = async () => {
    try {
      setLoading(true);
      
      const response = await userAPI.switchToSeller(whatsappNumber, selectedPlan);
      
      // Update user context
      updateUser(response.user);
      
      toast.success(`Welcome to WaZhop ${plans[selectedPlan].name} plan! 🎉`);
      
      // Close modal and navigate to dashboard
      onClose();
      navigate('/dashboard');
      
      // Refresh page to update UI
      setTimeout(() => window.location.reload(), 500);
      
    } catch (error) {
      console.error('Switch to seller error:', error);
      toast.error(error.response?.data?.message || 'Failed to switch to seller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FaStore className="text-primary-600 text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Become a Seller</h2>
              <p className="text-sm text-gray-600">Start selling on WaZhop today</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: WhatsApp Number</h3>
                <p className="text-gray-600 mb-4">
                  Enter your WhatsApp number so customers can contact you about their orders.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaWhatsapp className="text-green-600 text-xl" />
                  </div>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+2348012345678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Include country code (e.g., +234 for Nigeria)
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: Choose Your Plan</h3>
                <p className="text-gray-600 mb-6">
                  Select a plan that fits your business needs. You can upgrade anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`
                      relative p-6 border-2 rounded-lg cursor-pointer transition
                      ${selectedPlan === key 
                        ? 'border-primary-600 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    {selectedPlan === key && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                          <span className="text-gray-600">/month</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {selectedPlan === 'free' 
                    ? 'You can start for free and upgrade anytime as your business grows!' 
                    : `You'll be charged ₦${plans[selectedPlan].price.toLocaleString()} after your trial period.`
                  }
                </p>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handlePlanSelect}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Start Selling'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerToSellerUpgrade;
