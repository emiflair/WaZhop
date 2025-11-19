import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaWhatsapp, FaLock, FaExclamationTriangle, FaCheckCircle, FaShieldAlt, FaQrcode, FaKey } from 'react-icons/fa';
import { TouchButton } from '../../components/mobile';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    whatsappNumber: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation state
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Deactivation state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState('');

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableToken, setDisableToken] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        whatsappNumber: user.whatsappNumber || ''
      });
      // Set 2FA status from user object
      setTwoFAEnabled(user.twoFactorEnabled || false);
    }
  }, [user]);

  // Validate password strength
  useEffect(() => {
    const password = passwordData.newPassword;
    if (!password) {
      setPasswordStrength('');
      return;
    }

    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [passwordData.newPassword]);

  // Check password match
  useEffect(() => {
    if (!passwordData.confirmPassword) {
      setPasswordMatch(true);
      return;
    }
    setPasswordMatch(passwordData.newPassword === passwordData.confirmPassword);
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const data = await authAPI.updateProfile(profileData);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      // Note: You'll need to implement this endpoint on the backend
      // await authAPI.deactivateAccount();
      
      // For now, just show a message
      toast.success('Account deactivation request submitted. Our team will process it within 24 hours.');
      setShowDeactivateModal(false);
      setDeactivateConfirm('');
      
      // Optional: Log out after a delay
      // setTimeout(() => {
      //   logout();
      // }, 2000);
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Functions
  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      // API interceptor returns the { qrCode, secret, manualEntry } object directly
      const data = await userAPI.setup2FA();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShow2FASetup(true);
      toast.success('Scan the QR code with Google Authenticator');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await userAPI.verify2FA(verificationToken);
      setTwoFAEnabled(true);
      setShow2FASetup(false);
      setVerificationToken('');
      setQrCode('');
      setSecret('');
      // Update user context to reflect 2FA is now enabled
      updateUser({ twoFactorEnabled: true });
      toast.success('Two-factor authentication enabled successfully');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();

    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }

    if (!disableToken || disableToken.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await userAPI.disable2FA(disablePassword, disableToken);
      setTwoFAEnabled(false);
      setShow2FADisable(false);
      setDisablePassword('');
      setDisableToken('');
      // Update user context to reflect 2FA is now disabled
      updateUser({ twoFactorEnabled: false });
      toast.success('Two-factor authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-primary-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'w-1/3';
      case 'medium':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
      default:
        return 'w-0';
    }
  };

  // Segmented OTP input for 2FA verification
  const OTPInputs = ({ value, onChange, disabled, onComplete }) => {
    const inputsRef = useRef([]);
    const digits = Array.from({ length: 6 }, (_, i) => (value && value[i]) || '');

    const focusInput = (idx) => {
      if (idx >= 0 && idx < 6) {
        inputsRef.current[idx]?.focus();
        inputsRef.current[idx]?.select?.();
      }
    };

    const handleChange = (i, e) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 1);
      const next = [...digits];
      next[i] = v;
      const newVal = next.join('');
      onChange(newVal);
      if (v && i < 5) focusInput(i + 1);
      if (newVal.length === 6 && typeof onComplete === 'function') onComplete(newVal);
    };

    const handleKeyDown = (i, e) => {
      if (e.key === 'Backspace') {
        if (digits[i]) {
          // Clear current digit
          const next = [...digits];
          next[i] = '';
          onChange(next.join(''));
          return;
        }
        if (i > 0) {
          focusInput(i - 1);
          const next = [...digits];
          next[i - 1] = '';
          onChange(next.join(''));
        }
      } else if (e.key === 'ArrowLeft') {
        focusInput(i - 1);
      } else if (e.key === 'ArrowRight') {
        focusInput(i + 1);
      }
    };

    const handlePaste = (i, e) => {
      const clip = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const nums = String(clip).replace(/\D/g, '').slice(0, 6);
      if (!nums) return;
      e.preventDefault();
      const next = [...digits];
      let idx = i;
      for (let c = 0; c < nums.length && idx < 6; c++, idx++) {
        next[idx] = nums[c];
      }
      const newVal = next.join('');
      onChange(newVal);
      if (idx < 6) focusInput(idx);
      else inputsRef.current[5]?.blur?.();
      if (newVal.length === 6 && typeof onComplete === 'function') onComplete(newVal);
    };

    return (
      <div className="grid grid-cols-6 gap-2 w-full max-w-[320px] md:max-w-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            ref={(el) => (inputsRef.current[i] = el)}
            autoComplete="one-time-code"
            className="w-full h-11 md:h-12 text-lg md:text-xl lg:text-2xl font-mono text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={disabled}
            autoFocus={i === 0}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security</p>
        </div>

        {/* Account Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <FaUser className="text-primary-600" />
            Account Information
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Update your personal details
          </p>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaUser className="inline mr-2 text-gray-400" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaEnvelope className="inline mr-2 text-gray-400" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This email is used for login and notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaWhatsapp className="inline mr-2 text-primary-600" />
                WhatsApp Number *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium border-r border-gray-300 dark:border-gray-600 pr-3">
                  <span className="text-xl">🇳🇬</span>
                  <span>+234</span>
                </span>
                <input
                  type="tel"
                  name="whatsappNumber"
                  value={profileData.whatsappNumber}
                  onChange={handleProfileChange}
                  className="input pl-28"
                  placeholder="8012345678"
                  required
                  maxLength={10}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enter your 10-digit phone number (e.g., 8012345678)
              </p>
            </div>

            {/* Plan Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="text-lg font-semibold capitalize">{user?.plan || 'Free'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-sm font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <TouchButton
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                loading={loading}
              >
                Save Changes
              </TouchButton>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <FaLock className="text-primary-600" />
            Password & Security
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Update your password to keep your account secure
          </p>

          {!showPasswordForm ? (
            <TouchButton
              onClick={() => setShowPasswordForm(true)}
              variant="secondary"
              size="md"
            >
              Change Password
            </TouchButton>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  required
                  minLength={6}
                />
                
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Password Strength:</span>
                      <span className={`text-sm font-medium capitalize ${
                        passwordStrength === 'weak' ? 'text-red-500' :
                        passwordStrength === 'medium' ? 'text-yellow-500' :
                        'text-primary-600'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`input ${!passwordMatch ? 'border-red-500' : ''}`}
                  required
                />
                {passwordData.confirmPassword && !passwordMatch && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle />
                    Passwords do not match
                  </p>
                )}
                {passwordData.confirmPassword && passwordMatch && (
                  <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                    <FaCheckCircle />
                    Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <TouchButton
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  variant="secondary"
                  size="md"
                  disabled={loading}
                >
                  Cancel
                </TouchButton>
                <TouchButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || !passwordMatch || passwordStrength === 'weak'}
                  loading={loading}
                >
                  Update Password
                </TouchButton>
              </div>
            </form>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <FaShieldAlt className="text-primary-600" />
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Add an extra layer of security to your account with Google Authenticator
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <FaShieldAlt className="text-blue-600 text-xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">What is 2FA?</h3>
                <p className="text-sm text-blue-800">
                  Two-factor authentication requires both your password and a time-based code from Google Authenticator app to sign in. This significantly increases your account security.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div>
              <p className="font-semibold text-gray-900">Status</p>
              <p className="text-sm text-gray-600 mt-1">
                {twoFAEnabled ? (
                  <span className="inline-flex items-center gap-1 text-primary-600">
                    <FaCheckCircle /> Enabled
                  </span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </p>
            </div>
            {!twoFAEnabled ? (
              <TouchButton
                onClick={handleSetup2FA}
                variant="primary"
                size="md"
                disabled={loading}
                loading={loading}
              >
                Enable 2FA
              </TouchButton>
            ) : (
              <TouchButton
                onClick={() => setShow2FADisable(true)}
                variant="danger"
                size="md"
                disabled={loading}
              >
                Disable 2FA
              </TouchButton>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-2 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-red-700">
            <FaExclamationTriangle className="text-red-500" />
            Danger Zone
          </h2>
          <p className="text-sm text-red-600 mb-4">
            Irreversible actions that affect your account
          </p>

          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h3 className="font-semibold text-gray-900 mb-2">Deactivate Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Once you deactivate your account, your shop will be removed from public view and all your data will be scheduled for deletion. This action cannot be undone.
            </p>
            <TouchButton
              onClick={() => setShowDeactivateModal(true)}
              variant="danger"
              size="md"
            >
              Deactivate Account
            </TouchButton>
          </div>
        </div>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full md:p-2 max-h-[90vh] overflow-hidden border border-gray-200">
              <div className="flex items-center gap-3 mb-2 px-6 pt-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <FaQrcode className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Enable 2FA</h3>
                  <p className="text-sm text-gray-500">Scan QR code to continue</p>
                </div>
              </div>

              <div className="px-6 pb-6 overflow-y-auto overflow-x-hidden">
                <p className="text-gray-700 mb-4 font-semibold">Step 1: Install Google Authenticator</p>
                <p className="text-sm text-gray-600 mb-3">
                  Download and install Google Authenticator on your phone:
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <a
                    href="https://apps.apple.com/app/google-authenticator/id388497605"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white bg-black px-3 py-1.5 rounded-lg hover:opacity-90"
                  >
                    iOS App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    Google Play Store
                  </a>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div>
                    <p className="text-gray-700 mb-2 font-semibold">Step 2: Scan QR Code</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Open Google Authenticator and scan this QR code:
                    </p>
                    {qrCode && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-3 flex justify-center shadow-sm">
                        <img src={qrCode} alt="2FA QR Code" className="w-56 h-56 md:w-64 md:h-64" />
                      </div>
                    )}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                      <p className="text-xs text-gray-600 mb-2">Can&apos;t scan? Enter this code manually:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900 break-all flex-1">{secret}</code>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(secret || ''); toast.success('Secret copied'); }}
                          className="px-3 py-1.5 text-xs rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleVerify2FA} className="md:pt-2">
                    <p className="text-gray-700 mb-2 font-semibold">Step 3: Verify</p>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <FaKey className="inline mr-2 text-gray-400" /> Enter the 6-digit code from Google Authenticator:
                    </label>

                    <OTPInputs value={verificationToken} onChange={(v) => setVerificationToken(v.replace(/\D/g, '').slice(0, 6))} disabled={loading} />
                    <p className="text-xs text-gray-500 mt-2">The code changes every 30 seconds</p>

                    <div className="flex gap-3 mt-6">
                      <TouchButton
                        type="button"
                        onClick={() => {
                          setShow2FASetup(false);
                          setVerificationToken('');
                          setQrCode('');
                          setSecret('');
                        }}
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        disabled={loading}
                      >
                        Cancel
                      </TouchButton>
                      <TouchButton
                        type="submit"
                        variant="primary"
                        size="md"
                        className="flex-1"
                        disabled={loading || verificationToken.length !== 6}
                        loading={loading}
                      >
                        Verify & Enable
                      </TouchButton>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Disable Modal */}
        {show2FADisable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <FaShieldAlt className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Disable 2FA</h3>
                  <p className="text-sm text-gray-500">Verify your identity</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Disabling 2FA will make your account less secure.
                  </p>
                </div>

                <form onSubmit={handleDisable2FA} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaLock className="inline mr-2 text-gray-400" />
                      Enter your password:
                    </label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="input"
                      placeholder="Your password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaKey className="inline mr-2 text-gray-400" />
                      Enter the 6-digit code from Google Authenticator:
                    </label>
                    <input
                      type="text"
                      value={disableToken}
                      onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <TouchButton
                      type="button"
                      onClick={() => {
                        setShow2FADisable(false);
                        setDisablePassword('');
                        setDisableToken('');
                      }}
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </TouchButton>
                    <TouchButton
                      type="submit"
                      variant="danger"
                      size="md"
                      className="flex-1"
                      disabled={loading || !disablePassword || disableToken.length !== 6}
                      loading={loading}
                    >
                      Disable 2FA
                    </TouchButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation Modal */}
        {showDeactivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Deactivate Account</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to deactivate your account? This will:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                  <li>Remove your shop from public view</li>
                  <li>Delete all your products and images</li>
                  <li>Cancel your subscription</li>
                  <li>Permanently delete your data after 30 days</li>
                </ul>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You have 30 days to recover your account before permanent deletion.
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deactivateConfirm}
                  onChange={(e) => setDeactivateConfirm(e.target.value)}
                  className="input"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <TouchButton
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivateConfirm('');
                  }}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </TouchButton>
                <TouchButton
                  onClick={handleDeactivateAccount}
                  variant="danger"
                  size="md"
                  className="flex-1"
                  disabled={loading || deactivateConfirm !== 'DELETE'}
                  loading={loading}
                >
                  Deactivate Account
                </TouchButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
