import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import AuthLayout from '../components/AuthLayout';
import MobileBottomNav from '../components/MobileBottomNav';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', twoFactorToken: '', general: '' });
  const [touched, setTouched] = useState({ email: false, password: false, twoFactorToken: false });

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ email: '', password: '', twoFactorToken: '', general: '' });

    const result = await login(formData);
    
    if (result.success) {
      const target = result.user?.role === 'seller' ? (from.startsWith('/dashboard') ? from : '/dashboard') : '/';
      navigate(target, { replace: true });
    }
    // Check if 2FA is required
    else if (result.requires2FA) {
      setRequires2FA(true);
      setErrors({
        email: '',
        password: '',
        twoFactorToken: '',
        general: 'Please enter your 2FA code from Google Authenticator'
      });
    }
    // Inline error feedback on failure
    else if (!result.success) {
      const msg = (result.error || '').toLowerCase();
      const isCreds = /invalid email|password/i.test(result.error || '');
      const is2FAError = /invalid 2fa|2fa code/i.test(result.error || '');
      
      setErrors({
        email: isCreds ? 'Invalid email or password' : '',
        password: isCreds ? 'Invalid email or password' : '',
        twoFactorToken: is2FAError ? result.error : '',
        general: (isCreds || is2FAError) ? '' : (result.error || 'Login failed')
      });
      setTouched({ email: true, password: true, twoFactorToken: true });
    }
    
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your shop or keep exploring the marketplace."
      altLink={<Link to="/register" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">Create account</Link>}
      footer={<span>Don&apos;t have an account? <Link to="/register" className="font-semibold text-gray-900 dark:text-white hover:underline">Sign up</Link></span>}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {errors.general ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {errors.general}
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaEnvelope />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={`input pl-10 ${touched.email && errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {touched.email && errors.email ? (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaLock />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className={`input pl-10 pr-10 ${touched.password && errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {touched.password && errors.password ? (
            <p className="text-sm text-red-600 mt-1">{errors.password}</p>
          ) : null}
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>

        {requires2FA && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaShieldAlt className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Two-Factor Authentication</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Enter the 6-digit code from your Google Authenticator app
            </p>
            <div>
              <label htmlFor="twoFactorToken" className="label">2FA Code</label>
              <input
                id="twoFactorToken"
                name="twoFactorToken"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                required
                className={`input text-center text-2xl tracking-widest ${touched.twoFactorToken && errors.twoFactorToken ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="000000"
                value={formData.twoFactorToken}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {touched.twoFactorToken && errors.twoFactorToken ? (
                <p className="text-sm text-red-600 mt-1">{errors.twoFactorToken}</p>
              ) : null}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <MobileBottomNav />
    </AuthLayout>
  );
};

export default Login;
