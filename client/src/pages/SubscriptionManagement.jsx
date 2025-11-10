import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCheck, FiRefreshCw, FiCreditCard, FiAlertCircle } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SubscriptionManagement = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Fetch subscription status
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.data);
      } else {
        toast.error(data.message || 'Failed to load subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle manual renewal
  const handleRenew = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/subscription/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSubscription(data.data);
        // Update user context
        updateUser({ ...user, plan: data.data.plan, planExpiry: data.data.planExpiry });
      } else {
        toast.error(data.message || 'Failed to renew subscription');
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast.error('Failed to renew subscription');
    } finally {
      setProcessing(false);
    }
  };

  // Toggle auto-renewal
  const handleToggleAutoRenew = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/subscription/auto-renew`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ autoRenew: !subscription.autoRenew })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSubscription({ ...subscription, autoRenew: data.data.autoRenew });
      } else {
        toast.error(data.message || 'Failed to update auto-renewal');
      }
    } catch (error) {
      console.error('Error toggling auto-renewal:', error);
      toast.error('Failed to update auto-renewal');
    } finally {
      setProcessing(false);
    }
  };

  // Cancel subscription
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You can continue using it until the expiry date.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${API_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSubscription(data.data);
      } else {
        toast.error(data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanFeatures = (plan) => {
    switch (plan) {
      case 'premium':
        return [
          'Unlimited products',
          'Up to 3 shops',
          'All themes + custom colors',
          'Payment integration',
          'Custom domain',
          '24/7 Priority support',
          '1TB storage'
        ];
      case 'pro':
        return [
          'Up to 100 products',
          'Up to 2 shops',
          '10 premium themes',
          'Inventory management',
          'Custom subdomain',
          'Priority support',
          '65GB storage'
        ];
      default:
        return [
          '1 shop',
          'Up to 10 products',
          '1 default theme',
          'Basic features',
          'Standard support'
        ];
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Subscription Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your subscription, billing, and auto-renewal settings
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className={`${getPlanColor(subscription?.plan)} p-6 text-white`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Current Plan</p>
                <h2 className="text-3xl font-bold capitalize mt-1">
                  {subscription?.plan || 'Free'} Plan
                </h2>
              </div>
              {subscription?.subscriptionStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  subscription.subscriptionStatus === 'active' ? 'bg-green-500' :
                  subscription.subscriptionStatus === 'expired' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}>
                  {subscription.subscriptionStatus.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Expiry Information */}
            {subscription?.plan !== 'free' && subscription?.planExpiry && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Subscription Status</span>
                  {subscription.isExpired ? (
                    <span className="flex items-center text-red-500 font-semibold">
                      <FiAlertCircle className="mr-1" /> Expired
                    </span>
                  ) : (
                    <span className="flex items-center text-green-500 font-semibold">
                      <FiCheck className="mr-1" /> Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Expiry Date</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(subscription.planExpiry).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className={`font-bold text-lg ${
                    subscription.daysRemaining <= 7 ? 'text-red-500' :
                    subscription.daysRemaining <= 15 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {subscription.daysRemaining} days
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        subscription.daysRemaining <= 7 ? 'bg-red-500' :
                        subscription.daysRemaining <= 15 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (subscription.daysRemaining / 30) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Renewal Toggle */}
            {subscription?.plan !== 'free' && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Auto-Renewal
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically renew your subscription before it expires
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoRenew}
                    disabled={processing}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      subscription.autoRenew ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        subscription.autoRenew ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Plan Features */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Plan Features
              </h3>
              <ul className="space-y-2">
                {getPlanFeatures(subscription?.plan).map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <FiCheck className="text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {subscription?.plan !== 'free' && !subscription?.isExpired && (
                <>
                  <button
                    onClick={handleRenew}
                    disabled={processing}
                    className="flex-1 sm:flex-none px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <FiRefreshCw className="mr-2" />
                    Renew Now
                  </button>

                  {subscription?.subscriptionStatus !== 'cancelled' && (
                    <button
                      onClick={handleCancel}
                      disabled={processing}
                      className="flex-1 sm:flex-none px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
              >
                {subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Billing History */}
        {subscription?.lastBillingDate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Billing History
            </h3>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Last Payment
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(subscription.lastBillingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <FiCreditCard className="text-2xl text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {subscription?.subscriptionStatus === 'cancelled' && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Your subscription is cancelled but you can continue using {subscription.plan} features until {new Date(subscription.planExpiry).toLocaleDateString()}. After that, you&apos;ll be downgraded to the free plan.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
