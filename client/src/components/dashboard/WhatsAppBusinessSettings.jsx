import { useState, useEffect } from 'react';
import { FaWhatsapp, FaSync, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

export default function WhatsAppBusinessSettings({ shop, onUpdate }) {
  const [settings, setSettings] = useState({
    enabled: shop?.whatsappBusiness?.enabled || false,
    whatsappNumber: shop?.whatsappNumber || '',
    automatedMessages: {
      orderConfirmation: shop?.whatsappBusiness?.automatedMessages?.orderConfirmation ?? true,
      orderStatusUpdate: shop?.whatsappBusiness?.automatedMessages?.orderStatusUpdate ?? true,
      abandonedCart: shop?.whatsappBusiness?.automatedMessages?.abandonedCart ?? false
    }
  });
  
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(shop?.whatsappBusiness?.catalogSyncedAt);
  const [message, setMessage] = useState('');

  const handleSyncCatalog = async () => {
    try {
      setSyncing(true);
      setMessage('');
      
      const response = await api.post('/whatsapp/catalog/sync');
      
      if (response.data.success) {
        setLastSync(new Date());
        setMessage({
          type: 'success',
          text: `Catalog synced successfully! ${response.data.productsCount} products uploaded to WhatsApp.`
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to sync catalog'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await api.put(`/shops/${shop._id}`, {
        whatsappNumber: settings.whatsappNumber,
        'whatsappBusiness.enabled': settings.enabled,
        'whatsappBusiness.automatedMessages': settings.automatedMessages
      });
      
      if (response.data) {
        setMessage({
          type: 'success',
          text: 'WhatsApp settings saved successfully!'
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save settings'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <FaWhatsapp className="text-2xl text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            WhatsApp Business API
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Premium Feature - Automate customer communications
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <FaCheck /> : <FaTimes />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* WhatsApp Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            WhatsApp Business Number
          </label>
          <input
            type="tel"
            value={settings.whatsappNumber}
            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
            placeholder="+234801234567"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Use international format (e.g., +234801234567)
          </p>
        </div>

        {/* Enable WhatsApp Business API */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Enable WhatsApp Business API</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your WhatsApp Business account
            </p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Automated Messages */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Automated Messages</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Order Confirmation</span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Send confirmation when order is placed</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedMessages.orderConfirmation}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedMessages: { ...settings.automatedMessages, orderConfirmation: e.target.checked }
                })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Order Status Updates</span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Notify customers of order progress</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedMessages.orderStatusUpdate}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedMessages: { ...settings.automatedMessages, orderStatusUpdate: e.target.checked }
                })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Abandoned Cart Reminders</span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Remind customers about items in cart</p>
              </div>
              <input
                type="checkbox"
                checked={settings.automatedMessages.abandonedCart}
                onChange={(e) => setSettings({
                  ...settings,
                  automatedMessages: { ...settings.automatedMessages, abandonedCart: e.target.checked }
                })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
            </label>
          </div>
        </div>

        {/* Catalog Sync */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Product Catalog</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sync your products to WhatsApp Business Catalog for easy sharing
          </p>
          
          {lastSync && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}

          <button
            onClick={handleSyncCatalog}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <FaSync className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Catalog'}</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
