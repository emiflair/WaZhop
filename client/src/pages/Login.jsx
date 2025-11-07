import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthLayout from '../components/AuthLayout';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const from = location.state?.from?.pathname || '/marketplace';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData);
    if (result.success) {
      const target = result.user?.role === 'seller' ? (from.startsWith('/dashboard') ? from : '/dashboard') : '/marketplace';
      navigate(target, { replace: true });
    }
    if (!result.success) {
      // Heuristic: backend returns 403 with this message for unverified accounts
      const msg = (result.error || '').toLowerCase();
      if (msg.includes('verify your email')) {
        setUnverified(true);
      }
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
              className="input pl-10"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
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
              className="input pl-10 pr-10"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
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
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      {unverified && (
        <div className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="text-sm">Your email isn&apos;t verified yet.</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
            onClick={async () => {
              try {
                await authAPI.requestEmailVerificationPublic(formData.email);
                toast.success('If an account exists, we sent a verification email.');
              } catch (e) {
                toast.error('Could not request verification at this time.');
              }
            }}
          >
            Resend verification email
          </button>
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;
