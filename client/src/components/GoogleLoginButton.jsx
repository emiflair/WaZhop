import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const GoogleLoginButton = ({ role = 'buyer', onSuccess, onError }) => {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const result = await googleLogin({
        token: credentialResponse.credential,
        role
      });

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      onError?.(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    onError?.('Google login failed');
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">Connecting...</span>
      </button>
    );
  }

  return (
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
  );
};

export default GoogleLoginButton;
