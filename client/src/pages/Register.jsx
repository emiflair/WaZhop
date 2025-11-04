import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    referralCodeInput: referralCode || '', // Pre-fill if from URL
  });
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Validate referral code on mount if from URL
  useEffect(() => {
    if (referralCode) {
      validateReferralCode(referralCode);
    }
  }, [referralCode]);

  const validateReferralCode = async (code) => {
    if (!code || code.trim() === '') return;
    
    setValidatingReferral(true);
    try {
      const response = await api.get(`/referrals/validate/${code.toUpperCase()}`);
      if (response.valid) {
        setReferrerName(response.referrerName);
        toast.success(`✅ Referred by ${response.referrerName}! You'll both earn rewards.`);
      }
    } catch (error) {
      console.error('Invalid referral code:', error);
      setReferrerName('');
      toast.error('Invalid referral code');
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReferralCodeBlur = () => {
    const code = formData.referralCodeInput.trim();
    if (code && code !== referralCode) {
      validateReferralCode(code);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);

    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    // Apply referral code after successful registration
    if (result.success) {
      const codeToApply = formData.referralCodeInput.trim() || referralCode;
      
      if (codeToApply) {
        try {
          await api.post('/referrals/apply', {
            referralCode: codeToApply.toUpperCase(),
            newUserId: result.user._id || result.user.id
          });
          console.log('✅ Referral code applied successfully');
        } catch (error) {
          console.error('❌ Failed to apply referral:', error);
        }
      }
      
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Referral Banner */}
          {referrerName && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <p className="text-green-800 dark:text-green-200 font-medium">
                🎉 Referred by {referrerName}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You&apos;ll both earn rewards!
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create Your Account</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Start your WhatsApp shop journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="name" className="label text-sm sm:text-base">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="label text-sm sm:text-base">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="label text-sm sm:text-base">
                  WhatsApp Number
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  required
                  className="input text-sm sm:text-base"
                  placeholder="+234 801 234 5678"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Include country code (e.g., +234 for Nigeria)
                </p>
              </div>

              <div>
                <label htmlFor="password" className="label text-sm sm:text-base">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="input text-sm sm:text-base"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

                            <div>
                <label htmlFor="confirmPassword" className="label text-sm sm:text-base">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="input text-sm sm:text-base"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Referral Code Input */}
              <div>
                <label htmlFor="referralCodeInput" className="label text-sm sm:text-base">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <input
                    id="referralCodeInput"
                    name="referralCodeInput"
                    type="text"
                    className="input text-sm sm:text-base uppercase"
                    placeholder="Enter referral code"
                    value={formData.referralCodeInput}
                    onChange={handleChange}
                    onBlur={handleReferralCodeBlur}
                    disabled={validatingReferral}
                  />
                  {validatingReferral && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {referrerName && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <span>✓</span> Referred by {referrerName}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-sm sm:text-base py-3 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-gray-900 dark:text-gray-100 font-semibold hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
