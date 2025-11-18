import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { FaShieldAlt } from 'react-icons/fa';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get email and password from location state (passed from Login page)
  const credentials = location.state?.credentials;

  useEffect(() => {
    // If no credentials, redirect back to login
    if (!credentials || !credentials.email || !credentials.password) {
      navigate('/login', { replace: true });
    }
  }, [credentials, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Attempt login with 2FA token
      const result = await login({
        email: credentials.email,
        password: credentials.password,
        twoFactorToken: code.trim()
      });

      if (result.success) {
        // Determine where to navigate based on user role
        const from = location.state?.from?.pathname || '/';
        const target = result.user?.role === 'seller' 
          ? (from.startsWith('/dashboard') ? from : '/dashboard') 
          : '/';
        navigate(target, { replace: true });
      } else {
        // Show error message
        const msg = result.error || 'Invalid code. Please try again.';
        const helpful = /invalid token|incorrect code|expired|invalid/i.test(msg)
          ? 'That code is incorrect or has expired. Please check your Google Authenticator app and enter the current 6-digit code.'
          : msg;
        setError(helpful);
      }
    } catch (err) {
      setError(err.userMessage || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Add an extra layer of security to your account with Google Authenticator"
      altLink={
        <button 
          onClick={handleBackToLogin}
          className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline"
        >
          Back to login
        </button>
      }
      footer={
        <span>
          Having trouble? <Link to="/login" className="font-semibold text-gray-900 dark:text-white hover:underline">Try logging in again</Link>
        </span>
      }
    >
      <div className="max-w-md mx-auto">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaShieldAlt className="text-blue-600 dark:text-blue-400 text-xl mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">What is 2FA?</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Two-factor authentication requires both your password and a time-based code from Google Authenticator app to sign in. This significantly increases your account security.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-3 text-center">
            <label className="block text-sm font-medium">
              Enter the 6-digit code from your Google Authenticator app
            </label>
            <OtpInput 
              value={code} 
              onChange={(c) => {
                setCode(c.slice(0, 6));
                if (error) setError('');
              }} 
              autoFocus 
              disabled={loading} 
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tip: You can paste the 6-digit code directly. The code changes every 30 seconds.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button 
              type="button" 
              onClick={handleBackToLogin}
              className="btn btn-secondary"
              disabled={loading}
            >
              Back to Login
            </button>
            <button 
              type="submit" 
              disabled={loading || code.length !== 6} 
              className="btn btn-primary"
            >
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
