import { GoogleLogin } from '@react-oauth/google';
import { useMemo, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { normalizeAfricanPhoneNumber, isValidAfricanPhone } from '../utils/helpers';
import useDefaultDialCode from '../hooks/useDefaultDialCode';
import toast from 'react-hot-toast';

const GoogleLoginButton = ({ role = 'buyer', onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sellerStep, setSellerStep] = useState(false);
  const [sellerWhatsapp, setSellerWhatsapp] = useState('');
  const [modalError, setModalError] = useState('');
  const defaultDialCode = useDefaultDialCode();

  useEffect(() => {
    if (!showModal || !defaultDialCode) return;
    setSellerWhatsapp((prev) => {
      if (prev && prev.trim()) {
        return prev;
      }
      return defaultDialCode;
    });
  }, [defaultDialCode, showModal]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isNative = typeof window !== 'undefined' && (Capacitor?.isNativePlatform?.() ?? false);
  const googleEnabled = Boolean(googleClientId);

  const defaultRoleLabel = useMemo(() => (role === 'seller' ? 'seller' : 'buyer'), [role]);

  const resetState = () => {
    setPendingToken(null);
    setShowModal(false);
    setSellerStep(false);
    setSellerWhatsapp('');
    setModalError('');
    setLoading(false);
  };

  const submitGoogleLogin = async (chosenRole, whatsappValue, overrideToken) => {
    const tokenToUse = overrideToken || pendingToken;
    console.log('📤 submitGoogleLogin called with role:', chosenRole, 'whatsapp:', whatsappValue, 'using override token:', !!overrideToken);
    console.log('🔑 pendingToken exists:', !!pendingToken, 'tokenToUse exists:', !!tokenToUse);
    
    if (!tokenToUse) {
      console.error('❌ No pending token - this should not happen');
      onError?.('Unable to complete Google login. Please try again.');
      resetState();
      return;
    }

    setLoading(true);
    setModalError('');

    try {
      const payload = { token: tokenToUse, role: chosenRole };
      if (chosenRole === 'seller' && whatsappValue) {
        payload.whatsapp = whatsappValue;
      }

      console.log('🚀 Calling googleLogin with payload:', { ...payload, token: '***' });
      const result = await googleLogin(payload);
      console.log('✅ googleLogin result:', result);

      if (result.success) {
        resetState();
        onSuccess?.(result);
      } else {
        const message = result.error || 'Google login failed';
        console.error('❌ Google login failed:', message);
        setLoading(false);
        setModalError(message);
        onError?.(message);
      }
    } catch (error) {
      console.error('❌ Google login exception:', error);
      const message = error?.response?.data?.message || error?.message || 'Google login failed';
      setLoading(false);
      setModalError(message);
      onError?.(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    
    if (!token) {
      console.error('No credential token received from Google');
      onError?.('Google login failed. Please try again.');
      return;
    }

    setPendingToken(token);
    setLoading(true);

    try {
      // Check if user exists first using api instance (correct base URL)
      console.log('🔍 Checking if Google user exists...');
      const checkData = await api.post('/auth/google/check', { token });
      console.log('✅ Check response:', checkData);

      if (checkData.userExists) {
        // User exists - login directly without showing modal
        // Use the existing user's role to login automatically
        console.log('👤 Existing user found, auto-logging in with role:', checkData.user.role);
        await submitGoogleLogin(checkData.user.role, null, token);
      } else {
        // New user - show modal to select role
        console.log('🆕 New user, showing role selection modal');
        setLoading(false);
        setShowModal(true);
        setSellerStep(defaultRoleLabel === 'seller');
        setModalError('');
      }
    } catch (error) {
      console.error('❌ Google user check error:', error);
      setLoading(false);
      const message = error?.response?.data?.message || error?.message || 'Failed to verify Google account';
      setModalError(message);
      onError?.(message);
    }
  };

  const handleGoogleError = () => {
    onError?.('Google login failed');
  };

  const handleNativeGoogleLogin = async () => {
    if (!isNative) return;
    
    setLoading(true);
    try {
      const result = await GoogleAuth.signIn();
      console.log('✅ Native Google Auth result:', result);
      
      // Extract the ID token from the result
      const token = result.authentication?.idToken;
      
      if (!token) {
        toast.error('Failed to get Google authentication token');
        setLoading(false);
        return;
      }

      setPendingToken(token);

      // Check if user exists
      console.log('🔍 Checking if Google user exists...');
      const checkData = await api.post('/auth/google/check', { token });
      console.log('✅ Check response:', checkData);

      if (checkData.userExists) {
        console.log('👤 Existing user found, auto-logging in with role:', checkData.user.role);
        await submitGoogleLogin(checkData.user.role, null, token);
      } else {
        console.log('🆕 New user, showing role selection modal');
        setLoading(false);
        setShowModal(true);
        setSellerStep(defaultRoleLabel === 'seller');
        setModalError('');
      }
    } catch (error) {
      console.error('❌ Native Google Sign-In error:', error);
      setLoading(false);
      toast.error('Google Sign-In failed. Please try again.');
      onError?.('Google Sign-In failed');
    }
  };

  const handleSellerSubmit = () => {
    if (!sellerWhatsapp || !isValidAfricanPhone(sellerWhatsapp)) {
      setModalError('Enter a valid phone number with country code (e.g., +233201234567).');
      return;
    }
    const normalized = normalizeAfricanPhoneNumber(sellerWhatsapp);
    if (!normalized) {
      setModalError('Enter a valid phone number with country code (e.g., +233201234567).');
      return;
    }
    submitGoogleLogin('seller', normalized);
  };

  const closeModal = () => {
    resetState();
  };

  if (!googleEnabled) {
    if (!googleClientId) {
      console.warn('Google OAuth not configured - VITE_GOOGLE_CLIENT_ID missing');
    } else if (isNative) {
      console.info('Google OAuth disabled on native platform to avoid GSI script errors');
    }
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google المواصلة باستخدام
      </button>
    );
  }

  return (
    <>
      {loading && !showModal ? (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Connecting...</span>
        </button>
      ) : isNative ? (
        <button
          type="button"
          onClick={handleNativeGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      ) : (
        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            width="100%"
          />
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete your sign in</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {modalError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {modalError}
                </div>
              ) : null}

              {!sellerStep ? (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    How would you like to use WaZhop with your Google account?
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => submitGoogleLogin('buyer')}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-gray-800 transition hover:border-primary-500 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-primary-400"
                    >
                      <span className="block text-base font-semibold">Continue as Buyer</span>
                      <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Browse stores, track orders, and make purchases.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSellerStep(true);
                        setModalError('');
                      }}
                      disabled={loading}
                      className="w-full rounded-xl border border-primary-500 bg-primary-50 px-4 py-3 text-left text-primary-800 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-100"
                    >
                      <span className="block text-base font-semibold">I want to sell products</span>
                      <span className="mt-1 block text-sm text-primary-700 dark:text-primary-200">Set up your shop and manage orders with a seller dashboard.</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSellerStep(false);
                      setModalError('');
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                  >
                    <FaArrowLeft size={14} /> Back
                  </button>

                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Provide your WhatsApp number</h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      We use WhatsApp to connect sellers with their customers. Include your country code (e.g., +233201234567).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="google-seller-whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        WhatsApp Number
                      </label>
                      <div className="mt-2 flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 dark:border-gray-700">
                        <input
                          id="google-seller-whatsapp"
                          type="tel"
                          inputMode="tel"
                          placeholder="e.g., +233201234567"
                          value={sellerWhatsapp}
                          onChange={(event) => setSellerWhatsapp(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleSellerSubmit();
                            }
                          }}
                          className="flex-1 rounded-lg border-0 bg-transparent px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:outline-none dark:text-white"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleSellerSubmit}
                    >
                      {loading ? 'Creating seller account…' : 'Continue as Seller'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GoogleLoginButton;
