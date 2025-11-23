import { GoogleLogin } from '@react-oauth/google';
import { useMemo, useState } from 'react';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const GoogleLoginButton = ({ role = 'buyer', onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sellerStep, setSellerStep] = useState(false);
  const [sellerWhatsapp, setSellerWhatsapp] = useState('');
  const [modalError, setModalError] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const defaultRoleLabel = useMemo(() => (role === 'seller' ? 'seller' : 'buyer'), [role]);

  const resetState = () => {
    setPendingToken(null);
    setShowModal(false);
    setSellerStep(false);
    setSellerWhatsapp('');
    setModalError('');
    setLoading(false);
  };

  // Normalizes NG numbers and returns +234XXXXXXXXXX if valid
  const formatSellerWhatsapp = (value) => {
    if (!value) return null;
    let digits = value.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('234')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (digits.length !== 10) return null;
    return `+234${digits}`;
  };

  const submitGoogleLogin = async (chosenRole, whatsappValue) => {
    if (!pendingToken) {
      onError?.('Unable to complete Google login. Please try again.');
      resetState();
      return;
    }

    setLoading(true);
    setModalError('');

    try {
      const payload = { token: pendingToken, role: chosenRole };
      if (chosenRole === 'seller' && whatsappValue) {
        payload.whatsapp = whatsappValue;
      }

      const result = await googleLogin(payload);

      if (result.success) {
        resetState();
        onSuccess?.(result);
      } else {
        const message = result.error || 'Google login failed';
        setLoading(false);
        setModalError(message);
        onError?.(message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Google login failed';
      setLoading(false);
      setModalError(message);
      onError?.(message);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setPendingToken(credentialResponse.credential);
    setShowModal(true);
    setSellerStep(defaultRoleLabel === 'seller');
    setModalError('');
  };

  const handleGoogleError = () => {
    onError?.('Google login failed');
  };

  const handleSellerSubmit = (event) => {
    event.preventDefault();
    const formatted = formatSellerWhatsapp(sellerWhatsapp);
    if (!formatted) {
      setModalError('Enter a valid WhatsApp number (10 digits after 0).');
      return;
    }
    submitGoogleLogin('seller', formatted);
  };

  const closeModal = () => {
    resetState();
  };

  if (!googleClientId) {
    console.warn('Google OAuth not configured - VITE_GOOGLE_CLIENT_ID missing');
    return null;
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
                      We use WhatsApp to connect sellers with their customers. Enter your 10-digit number (e.g. 8012345678).
                    </p>
                  </div>

                  <form onSubmit={handleSellerSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="google-seller-whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        WhatsApp Number
                      </label>
                      <div className="mt-2 flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 dark:border-gray-700">
                        <span className="flex items-center gap-2 rounded-l-lg bg-gray-100 px-3 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          NG +234
                        </span>
                        <input
                          id="google-seller-whatsapp"
                          type="tel"
                          inputMode="numeric"
                          placeholder="8012345678"
                          value={sellerWhatsapp}
                          onChange={(event) => setSellerWhatsapp(event.target.value)}
                          className="flex-1 rounded-r-lg border-0 bg-transparent px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:outline-none dark:text-white"
                          disabled={loading}
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Creating seller account…' : 'Continue as Seller'}
                    </button>
                  </form>
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
