import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthLayout from '../components/AuthLayout';
import MobileBottomNav from '../components/MobileBottomNav';
import api from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const roleParam = (searchParams.get('role') || '').toLowerCase();

  const [formData, setFormData] = useState({
    role: 'buyer',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    referralCodeInput: referralCode || '',
  });
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    role: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    general: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    whatsapp: false
  });

  useEffect(() => {
    if (referralCode) {
      validateReferralCode(referralCode);
    }
  }, [referralCode]);

  useEffect(() => {
    if (roleParam === 'seller' || roleParam === 'buyer') {
      setFormData((prev) => ({ ...prev, role: roleParam }));
    }
  }, [roleParam]);

  const validateReferralCode = async (code) => {
    if (!code || code.trim() === '') return;
    setValidatingReferral(true);
    try {
      const response = await api.get(`/referrals/validate/${code.toUpperCase()}`);
      if (response.valid) {
        setReferrerName(response.referrerName);
      }
    } catch (error) {
      console.error('Invalid referral code:', error);
      setReferrerName('');
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
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
      setErrors((prev) => ({ ...prev, password: 'Passwords do not match', confirmPassword: 'Passwords do not match' }));
      setTouched((prev) => ({ ...prev, password: true, confirmPassword: true }));
      setLoading(false);
      return;
    }

    setLoading(true);

    const payload = {
      role: formData.role,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      ...(formData.role === 'seller' && formData.whatsapp ? { 
        whatsapp: `+234${formData.whatsapp.replace(/^\+?234/, '')}` 
      } : {}),
    };

    const result = await register(payload);

    if (result.success && result.user) {
      if (result.user.role === 'seller') {
        const codeToApply = formData.referralCodeInput.trim() || referralCode;
        if (codeToApply) {
          try {
            await api.post('/referrals/apply', {
              referralCode: codeToApply.toUpperCase(),
              newUserId: result.user._id || result.user.id
            });
          } catch (error) {
            console.error('Failed to apply referral:', error);
          }
        }
        // Sellers: send to pricing to choose plan during onboarding
        navigate('/pricing?onboarding=1');
        setLoading(false);
        return;
      }
      // Buyers: go home
      navigate('/');
      setLoading(false);
      return;
    }

    if (result?.pendingVerification) {
      navigate('/verify-email');
      setLoading(false);
      return;
    }

    if (!result.success) {
      const msg = (result.error || '').toLowerCase();
      const newErrors = { ...errors };
      
      // Parse backend validation errors (array of {field, message})
      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach(err => {
          const field = err.field || err.param;
          if (field && err.message) {
            newErrors[field] = err.message;
          }
        });
        // Set general error only if no specific fields matched
        if (Object.keys(newErrors).filter(k => k !== 'general' && newErrors[k]).length === 0) {
          newErrors.general = 'Please check your inputs and try again';
        }
      } else {
        // Fallback to old parsing logic
        newErrors.general = result.error || 'Registration failed';
        if (/email/.test(msg)) newErrors.email = result.error;
        if (/whatsapp|phone/.test(msg)) newErrors.whatsapp = result.error;
        if (/password/.test(msg)) newErrors.password = result.error;
        if (/name/.test(msg)) newErrors.name = result.error;
      }
      
      setErrors(newErrors);
      setTouched({ 
        name: true,
        email: true, 
        password: true,
        confirmPassword: true,
        whatsapp: true 
      });
    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Buy confidently or start selling with a powerful dashboard."
      altLink={<Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">Sign in</Link>}
      aside={referrerName ? (
        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg text-center">
          <p className="text-primary-800 dark:text-primary-200 font-medium">🎉 Referred by {referrerName}</p>
          <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">You&apos;ll both earn rewards!</p>
        </div>
      ) : null}
      footer={<span>Already have an account? <Link to="/login" className="font-semibold text-gray-900 dark:text-white hover:underline">Login</Link></span>}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {errors.general ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{errors.general}</div>
        ) : null}

        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center justify-center gap-2 py-2 rounded-lg border cursor-pointer ${formData.role === 'buyer' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
              <input type="radio" name="role" value="buyer" checked={formData.role === 'buyer'} onChange={handleChange} className="sr-only" />
              Buyer
            </label>
            <label className={`flex items-center justify-center gap-2 py-2 rounded-lg border cursor-pointer ${formData.role === 'seller' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
              <input type="radio" name="role" value="seller" checked={formData.role === 'seller'} onChange={handleChange} className="sr-only" />
              Seller
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaUser /></span>
            <input id="name" name="name" type="text" required className={`input pl-10 ${touched.name && errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder="John Doe" value={formData.name} onChange={handleChange} onBlur={handleBlur} />
            {touched.name && errors.name ? (<p className="text-sm text-red-600 mt-1">{errors.name}</p>) : null}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaEnvelope /></span>
            <input id="email" name="email" type="email" required className={`input pl-10 ${touched.email && errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder="you@example.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} />
            {touched.email && errors.email ? (<p className="text-sm text-red-600 mt-1">{errors.email}</p>) : null}
          </div>
        </div>

        {formData.role === 'seller' && (
          <div>
            <label htmlFor="whatsapp" className="label">WhatsApp Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium border-r border-gray-300 dark:border-gray-600 pr-3">
                <span className="text-xl">🇳🇬</span>
                <span>+234</span>
              </span>
              <input id="whatsapp" name="whatsapp" type="tel" required className={`input pl-28 ${touched.whatsapp && errors.whatsapp ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder="8012345678" value={formData.whatsapp} onChange={handleChange} onBlur={handleBlur} maxLength={10} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter your 10-digit phone number (e.g., 8012345678)</p>
            {touched.whatsapp && errors.whatsapp ? (<p className="text-sm text-red-600 mt-1">{errors.whatsapp}</p>) : null}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaLock /></span>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} required minLength={8} className={`input pl-10 pr-10 ${touched.password && errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder="••••••••" value={formData.password} onChange={handleChange} onBlur={handleBlur} />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At least 8 characters with uppercase, lowercase, and number</p>
          {touched.password && errors.password ? (<p className="text-sm text-red-600 mt-1">{errors.password}</p>) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaLock /></span>
            <input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} required minLength={8} className={`input pl-10 pr-10 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
            <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword ? (<p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>) : null}
        </div>

        {formData.role === 'seller' && (
          <div>
            <label htmlFor="referralCodeInput" className="label">Referral Code (Optional)</label>
            <div className="relative">
              <input id="referralCodeInput" name="referralCodeInput" type="text" className="input uppercase pr-10" placeholder="Enter referral code" value={formData.referralCodeInput} onChange={handleChange} onBlur={handleReferralCodeBlur} disabled={validatingReferral} />
              {validatingReferral && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {referrerName && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1"><span>✓</span> Referred by {referrerName}</p>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 mt-1">
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>
      <MobileBottomNav />
    </AuthLayout>
  );
};

export default Register;
 
