import { useState, useEffect } from 'react';
import { FaCreditCard, FaLock, FaWhatsapp, FaExternalLinkAlt, FaCrown } from 'react-icons/fa';
import { SiFlutter } from 'react-icons/si';

const PaymentSettings = ({ shop, onUpdate, isPremium }) => {
  const [paymentData, setPaymentData] = useState({
    enabled: true, // Always enabled for Premium users
    provider: shop?.paymentSettings?.provider || null,
    flutterwave: {
      publicKey: shop?.paymentSettings?.flutterwave?.publicKey || '',
      paymentLink: shop?.paymentSettings?.flutterwave?.paymentLink || ''
    },
    paystack: {
      publicKey: shop?.paymentSettings?.paystack?.publicKey || '',
      paymentLink: shop?.paymentSettings?.paystack?.paymentLink || ''
    },
    allowWhatsAppNegotiation: shop?.paymentSettings?.allowWhatsAppNegotiation ?? true,
    currency: shop?.paymentSettings?.currency || 'NGN'
  });

  const [activeTab, setActiveTab] = useState(paymentData.provider || 'flutterwave');

  // Sync local state with shop prop changes
  useEffect(() => {
    console.log('🔄 Shop data changed, syncing payment settings:', shop?.paymentSettings);
    if (shop?.paymentSettings) {
      setPaymentData({
        enabled: true, // Always enabled for Premium users
        provider: shop.paymentSettings.provider || null,
        flutterwave: {
          publicKey: shop.paymentSettings.flutterwave?.publicKey || '',
          paymentLink: shop.paymentSettings.flutterwave?.paymentLink || ''
        },
        paystack: {
          publicKey: shop.paymentSettings.paystack?.publicKey || '',
          paymentLink: shop.paymentSettings.paystack?.paymentLink || ''
        },
        allowWhatsAppNegotiation: shop.paymentSettings.allowWhatsAppNegotiation ?? true,
        currency: shop.paymentSettings.currency || 'NGN'
      });
      
      if (shop.paymentSettings.provider) {
        setActiveTab(shop.paymentSettings.provider);
      }
    }
  }, [shop]);

  const handleProviderChange = (provider) => {
    setActiveTab(provider);
    const updatedData = { ...paymentData, provider };
    setPaymentData(updatedData);
    // Notify parent of changes
    onUpdate({ paymentSettings: updatedData });
  };

  const handleInputChange = (provider, field, value) => {
    const updatedData = {
      ...paymentData,
      [provider]: {
        ...paymentData[provider],
        [field]: value
      }
    };
    setPaymentData(updatedData);
    // Notify parent of changes
    onUpdate({ paymentSettings: updatedData });
  };

  const handleToggleChange = (field, value) => {
    const updatedData = { ...paymentData, [field]: value };
    setPaymentData(updatedData);
    // Notify parent of changes
    onUpdate({ paymentSettings: updatedData });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 dark:text-gray-100">
            <FaCreditCard className="text-blue-600 dark:text-blue-400" />
            Payment Integration
            {isPremium && <FaCrown className="text-yellow-500" size={16} />}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isPremium 
              ? 'Accept direct payments from Flutterwave or Paystack'
              : 'Upgrade to Premium to accept direct payments'}
          </p>
        </div>
      </div>

      {!isPremium && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaLock className="text-yellow-600 dark:text-yellow-500 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                Premium Feature
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Payment integration is exclusive to Premium plan members. Upgrade now to accept direct payments 
                from Flutterwave or Paystack and increase your sales.
              </p>
              <button className="btn-primary mt-3 text-sm">
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentData.enabled && isPremium && (
        <>
          {/* Payment Provider Selection */}
          <div className="mb-6">
            <label className="label mb-3">Select Payment Provider</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flutterwave */}
              <button
                type="button"
                onClick={() => handleProviderChange('flutterwave')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTab === 'flutterwave'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SiFlutter className="text-3xl text-orange-500" />
                  <div className="text-left">
                    <h4 className="font-semibold dark:text-gray-100">Flutterwave</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Accept payments via Flutterwave</p>
                  </div>
                </div>
              </button>

              {/* Paystack */}
              <button
                type="button"
                onClick={() => handleProviderChange('paystack')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeTab === 'paystack'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FaCreditCard className="text-3xl text-blue-500" />
                  <div className="text-left">
                    <h4 className="font-semibold dark:text-gray-100">Paystack</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Accept payments via Paystack</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Flutterwave Settings */}
          {activeTab === 'flutterwave' && (
            <div className="space-y-4 mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                  How to get your Flutterwave credentials:
                </h4>
                <ol className="text-sm text-orange-700 dark:text-orange-400 space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener noreferrer" className="underline">Flutterwave Dashboard</a></li>
                  <li>Navigate to Settings → API Keys</li>
                  <li>Copy your Public Key or Payment Link</li>
                  <li>Paste it below</li>
                </ol>
              </div>

              <div>
                <label className="label">
                  Public Key (Optional)
                  <span className="text-xs text-gray-500 ml-2">- For custom integration</span>
                </label>
                <input
                  type="text"
                  value={paymentData.flutterwave.publicKey}
                  onChange={(e) => handleInputChange('flutterwave', 'publicKey', e.target.value)}
                  placeholder="FLWPUBK-xxxxxxxxxxxxx"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Payment Link (Recommended)
                  <span className="text-xs text-gray-500 ml-2">- Easiest to setup</span>
                </label>
                <input
                  type="url"
                  value={paymentData.flutterwave.paymentLink}
                  onChange={(e) => handleInputChange('flutterwave', 'paymentLink', e.target.value)}
                  placeholder="https://flutterwave.com/pay/yourlink"
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Create a payment link from your Flutterwave dashboard and paste it here
                </p>
              </div>
            </div>
          )}

          {/* Paystack Settings */}
          {activeTab === 'paystack' && (
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  How to get your Paystack credentials:
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://dashboard.paystack.com" target="_blank" rel="noopener noreferrer" className="underline">Paystack Dashboard</a></li>
                  <li>Navigate to Settings → API Keys & Webhooks</li>
                  <li>Copy your Public Key or create a Payment Page Link</li>
                  <li>Paste it below</li>
                </ol>
              </div>

              <div>
                <label className="label">
                  Public Key (Optional)
                  <span className="text-xs text-gray-500 ml-2">- For custom integration</span>
                </label>
                <input
                  type="text"
                  value={paymentData.paystack.publicKey}
                  onChange={(e) => handleInputChange('paystack', 'publicKey', e.target.value)}
                  placeholder="pk_live_xxxxxxxxxxxxx"
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Payment Page Link (Recommended)
                  <span className="text-xs text-gray-500 ml-2">- Easiest to setup</span>
                </label>
                <input
                  type="url"
                  value={paymentData.paystack.paymentLink}
                  onChange={(e) => handleInputChange('paystack', 'paymentLink', e.target.value)}
                  placeholder="https://paystack.com/pay/yourpage"
                  className="input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Create a payment page from your Paystack dashboard and paste the link here
                </p>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="label">Currency</label>
              <select
                value={paymentData.currency}
                onChange={(e) => handleToggleChange('currency', e.target.value)}
                className="input"
              >
                <option value="NGN">🇳🇬 Nigerian Naira (NGN)</option>
                <option value="USD">🇺🇸 US Dollar (USD)</option>
                <option value="GHS">🇬🇭 Ghanaian Cedi (GHS)</option>
                <option value="KES">🇰🇪 Kenyan Shilling (KES)</option>
                <option value="ZAR">🇿🇦 South African Rand (ZAR)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FaWhatsapp className="text-green-500 text-2xl" />
                <div>
                  <h4 className="font-semibold dark:text-gray-100">Allow WhatsApp Negotiation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Let customers still negotiate via WhatsApp if they prefer
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggleChange('allowWhatsAppNegotiation', !paymentData.allowWhatsAppNegotiation)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  paymentData.allowWhatsAppNegotiation ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    paymentData.allowWhatsAppNegotiation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Info Section */}
      {paymentData.enabled && isPremium && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaExternalLinkAlt className="text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                How it works
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                When payment integration is enabled, your customers will see a &quot;Pay Now&quot; button on your 
                storefront. Clicking it will redirect them to your payment provider to complete the transaction 
                securely. {paymentData.allowWhatsAppNegotiation && 'They can still contact you via WhatsApp if they prefer to negotiate.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettings;
