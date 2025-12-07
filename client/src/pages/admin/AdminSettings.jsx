import { useState, useEffect } from 'react';
import { FiSave, FiMail, FiGlobe, FiDatabase, FiShield, FiCreditCard } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import { adminSettingsAPI } from '../../utils/api';
import { parseApiError } from '../../utils/errorHandler';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'WaZhop',
    siteDescription: 'Build and manage your online shop with ease',
    contactEmail: 'admin@wazhop.ng',
    supportEmail: 'support@wazhop.ng',
    
    // Payment Settings
    paystackEnabled: false,
    paystackPublicKey: '',
    paystackSecretKey: '',
    flutterwaveEnabled: false,
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    
    // Email Settings
    emailProvider: 'brevo',
    brevoApiKey: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    
    // Storage Settings
    storageProvider: 'cloudinary',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    
    // Security Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    
    // Feature Flags
    enableMarketplace: true,
    enableReviews: true,
    enableReferrals: true,
    maintenanceMode: false
  });

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminSettingsAPI.get();
      
      if (data.success) {
        const s = data.data;
        setSettings({
          siteName: s.siteName,
          siteDescription: s.siteDescription,
          contactEmail: s.contactEmail,
          supportEmail: s.supportEmail,
          paystackEnabled: s.paymentGateways.paystack.enabled,
          paystackPublicKey: s.paymentGateways.paystack.publicKey,
          paystackSecretKey: s.paymentGateways.paystack.secretKey,
          flutterwaveEnabled: s.paymentGateways.flutterwave.enabled,
          flutterwavePublicKey: s.paymentGateways.flutterwave.publicKey,
          flutterwaveSecretKey: s.paymentGateways.flutterwave.secretKey,
          emailProvider: s.emailConfig.provider,
          brevoApiKey: s.emailConfig.brevo.apiKey,
          smtpHost: s.emailConfig.smtp.host,
          smtpPort: s.emailConfig.smtp.port,
          smtpUser: s.emailConfig.smtp.user,
          smtpPassword: s.emailConfig.smtp.password,
          storageProvider: s.storageConfig.provider,
          cloudinaryCloudName: s.storageConfig.cloudinary.cloudName,
          cloudinaryApiKey: s.storageConfig.cloudinary.apiKey,
          cloudinaryApiSecret: s.storageConfig.cloudinary.apiSecret,
          requireEmailVerification: s.security.requireEmailVerification,
          enableTwoFactor: s.security.enableTwoFactor,
          maxLoginAttempts: s.security.maxLoginAttempts,
          sessionTimeout: s.security.sessionTimeout,
          enableMarketplace: s.features.enableMarketplace,
          enableReviews: s.features.enableReviews,
          enableReferrals: s.features.enableReferrals,
          maintenanceMode: s.features.maintenanceMode
        });
      } else {
        toast.error(data.message || 'Failed to load settings');
      }
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const data = await adminSettingsAPI.update(settings);

      if (data.success) {
        toast.success(data.message || 'Settings saved successfully!');
        fetchSettings();
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Configure system-wide settings and preferences</p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <FiSave />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiGlobe className="text-xl text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiCreditCard className="text-xl text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Integration</h2>
          </div>
          
          {/* Paystack */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Paystack</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paystackEnabled}
                  onChange={(e) => handleInputChange('paystackEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
            {settings.paystackEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Public Key</label>
                  <input
                    type="text"
                    value={settings.paystackPublicKey}
                    onChange={(e) => handleInputChange('paystackPublicKey', e.target.value)}
                    placeholder="pk_test_..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key</label>
                  <input
                    type="password"
                    value={settings.paystackSecretKey}
                    onChange={(e) => handleInputChange('paystackSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Flutterwave */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Flutterwave</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.flutterwaveEnabled}
                  onChange={(e) => handleInputChange('flutterwaveEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
            {settings.flutterwaveEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Public Key</label>
                  <input
                    type="text"
                    value={settings.flutterwavePublicKey}
                    onChange={(e) => handleInputChange('flutterwavePublicKey', e.target.value)}
                    placeholder="FLWPUBK-..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key</label>
                  <input
                    type="password"
                    value={settings.flutterwaveSecretKey}
                    onChange={(e) => handleInputChange('flutterwaveSecretKey', e.target.value)}
                    placeholder="FLWSECK-..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiMail className="text-xl text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Provider</label>
              <select
                value={settings.emailProvider}
                onChange={(e) => handleInputChange('emailProvider', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="brevo">Brevo (Sendinblue)</option>
                <option value="smtp">Custom SMTP</option>
              </select>
            </div>
            {settings.emailProvider === 'brevo' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brevo API Key</label>
                <input
                  type="password"
                  value={settings.brevoApiKey}
                  onChange={(e) => handleInputChange('brevoApiKey', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP Port</label>
                  <input
                    type="text"
                    value={settings.smtpPort}
                    onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiDatabase className="text-xl text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Storage Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Storage Provider</label>
              <select
                value={settings.storageProvider}
                onChange={(e) => handleInputChange('storageProvider', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="cloudinary">Cloudinary</option>
                <option value="aws">AWS S3</option>
              </select>
            </div>
            {settings.storageProvider === 'cloudinary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cloud Name</label>
                  <input
                    type="text"
                    value={settings.cloudinaryCloudName}
                    onChange={(e) => handleInputChange('cloudinaryCloudName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                  <input
                    type="text"
                    value={settings.cloudinaryApiKey}
                    onChange={(e) => handleInputChange('cloudinaryApiKey', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Secret</label>
                  <input
                    type="password"
                    value={settings.cloudinaryApiSecret}
                    onChange={(e) => handleInputChange('cloudinaryApiSecret', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FiShield className="text-xl text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Require Email Verification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Users must verify email before accessing platform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Maintenance Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Put platform in maintenance mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
