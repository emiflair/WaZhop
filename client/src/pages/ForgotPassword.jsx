import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { authAPI } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' }); // 'idle' | 'loading' | 'success' | 'error'
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: 'loading', message: 'Sending reset link...' });

    try {
      const res = await authAPI.forgotPassword(normalizedEmail);
      
      if (res?.success) {
        setStatus({
          type: 'success',
          message: 'If an account exists with that email, we\'ve sent password reset instructions. Please check your inbox and spam folder.'
        });
        setEmail(''); // Clear the form
      } else {
        setStatus({
          type: 'error',
          message: res?.message || 'Unable to send reset link. Please try again.'
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.userMessage || 'Network error. Please check your connection and try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      altLink={
        <Link
          to="/login"
          className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline"
        >
          Back to login
        </Link>
      }
      footer={
        <span>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-gray-900 dark:text-white hover:underline"
          >
            Sign up
          </Link>
        </span>
      }
    >
      <div className="max-w-md mx-auto">
        {/* Success State */}
        {status.type === 'success' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Check your email
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {status.message}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Back to login
              </Link>
            </div>
          </div>
        )}

        {/* Form State */}
        {status.type !== 'success' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Error Message */}
            {status.type === 'error' && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-200">
                {status.message}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>

            {/* Additional Help Text */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              The reset link will expire in 15 minutes for security.
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
