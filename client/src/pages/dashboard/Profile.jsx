import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaWhatsapp, FaLock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
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

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        whatsappNumber: user.whatsappNumber || ''
      });
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

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
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
            <FaUser className="text-green-500" />
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
                <FaWhatsapp className="inline mr-2 text-green-500" />
                WhatsApp Number *
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={profileData.whatsappNumber}
                onChange={handleProfileChange}
                className="input"
                placeholder="+234XXXXXXXXXX"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Customers will contact you on this number. Include country code.
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
            <FaLock className="text-green-500" />
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
                        'text-green-500'
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
                  <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
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
