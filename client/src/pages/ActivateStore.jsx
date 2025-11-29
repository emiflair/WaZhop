import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { storeActivationAPI } from '../utils/api';
import { normalizeAfricanPhoneNumber, isValidAfricanPhone } from '../utils/helpers';
import useDefaultDialCode from '../hooks/useDefaultDialCode';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ActivateStore() {
  const { shopId, token } = useParams();
  const navigate = useNavigate();
  const defaultDialCode = useDefaultDialCode();
  
  const [verifying, setVerifying] = useState(true);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    verifyToken();
  }, [shopId, token]);

  useEffect(() => {
    if (!defaultDialCode) return;
    setFormData((prev) => {
      if (prev.whatsapp && prev.whatsapp.trim()) {
        return prev;
      }
      return { ...prev, whatsapp: defaultDialCode };
    });
  }, [defaultDialCode]);

  const verifyToken = async () => {
    try {
      const response = await storeActivationAPI.verifyActivationToken(shopId, token);
      setStoreInfo(response.data);
      setVerifying(false);
    } catch (error) {
      console.error('Token verification failed:', error);
      toast.error(error.userMessage || 'Invalid or expired activation link');
      setVerifying(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else if (!isValidAfricanPhone(formData.whatsapp)) {
      newErrors.whatsapp = 'Enter a valid phone number with country code (e.g., +233201234567)';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const normalizedWhatsApp = normalizeAfricanPhoneNumber(formData.whatsapp);
      if (!normalizedWhatsApp) {
        setErrors((prev) => ({ ...prev, whatsapp: 'Enter a valid phone number with country code (e.g., +233201234567)' }));
        setLoading(false);
        return;
      }

      const response = await storeActivationAPI.activateStore(shopId, token, {
        email: formData.email.trim(),
        whatsapp: normalizedWhatsApp,
        password: formData.password
      });

      // Store the token and user info
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      toast.success('Store activated successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Activation failed:', error);
      toast.error(error.userMessage || 'Failed to activate store');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying activation link...</p>
        </div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <FiAlertCircle className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Invalid Activation Link
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This activation link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Success Banner */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <FiCheck className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Store Created For You!
              </h2>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                A store has been prepared with products for you. Complete the form below to claim it.
              </p>
            </div>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {storeInfo.shop.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {storeInfo.productCount} products ready for you
          </p>
          {storeInfo.shop.tags && storeInfo.shop.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {storeInfo.shop.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Activation Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activate Your Store
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enter your details to claim and activate your store
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number *
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.whatsapp ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="e.g., +233201234567"
                />
              </div>
              {!errors.whatsapp && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Include country code (e.g., +233201234567 or +2348012345678)
                </p>
              )}
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.whatsapp}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Create Password *
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="Min. 8 characters"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white`}
                  placeholder="Re-enter password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Activating...
                </>
              ) : (
                <>
                  <FiCheck className="h-5 w-5" />
                  Activate Store & Login
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-6">
            By activating, you agree to WaZhop's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
