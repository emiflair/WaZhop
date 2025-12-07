import { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiGift, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardLayout from '../../components/DashboardLayout';

const ReferralProgram = () => {
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching referral stats...');
      
      // Add cache-busting header to prevent 304 responses
      const response = await api.get('/referrals/stats', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📥 Full response object:', response);
      console.log('📥 Response status:', response?.status);
      console.log('📥 Response data type:', typeof response?.data);
      console.log('📥 Response data:', response?.data);
      console.log('📥 Response data keys:', response?.data ? Object.keys(response.data) : 'no data');
      
      // Handle different response formats
      let data = response.data || response;
      
      // If data is the axios response object itself, extract data
      if (data && data.status && data.config) {
        console.log('⚠️ Got response object instead of data, extracting...');
        data = data.data;
      }
      
      console.log('📦 Extracted data:', data);
      
      // Check if we got data
      if (!data || Object.keys(data).length === 0) {
        console.error('❌ Empty or no data after extraction');
        toast.error('No data received from server');
        setReferralData(null);
        setLoading(false);
        return;
      }
      
      // Initialize stats if missing
      if (!data.stats) {
        console.log('⚠️ Stats missing, initializing defaults');
        data.stats = {
          totalReferrals: 0,
          freeReferred: 0,
          proReferred: 0,
          premiumReferred: 0,
          rewardsEarned: 0,
          rewardsUsed: 0
        };
      }
      
      // Initialize referredUsers if missing
      if (!data.referredUsers) {
        data.referredUsers = [];
      }
      
      console.log('✅ Setting referral data:', data);
      setReferralData(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Referral fetch error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Error response:', err.response);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: err.config?.url
      });
      
      // Show user-friendly error
      const errorMsg = err.response?.data?.message || err.message || 'Network error';
      toast.error(`Failed to load: ${errorMsg}`);
      
      // Set default data instead of null to prevent error screen
      setReferralData({
        referralCode: 'ERROR',
        referralLink: `Error: ${errorMsg}`,
        stats: {
          totalReferrals: 0,
          freeReferred: 0,
          proReferred: 0,
          premiumReferred: 0,
          rewardsEarned: 0,
          rewardsUsed: 0
        },
        referredUsers: []
      });
      setLoading(false);
    }
  };  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const claimRewards = async () => {
    if ((referralData.stats.rewardsEarned - referralData.stats.rewardsUsed) < 30) {
      toast.error('Need at least 30 days of rewards (5 referrals) to claim');
      return;
    }

    setClaiming(true);
    try {
      const response = await api.post('/referrals/claim');
      toast.success(response.data.message);
      fetchReferralStats(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!referralData) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={fetchReferralStats}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const availableRewards = referralData.stats.rewardsEarned - referralData.stats.rewardsUsed;
  const progressToNextReward = (referralData.stats.totalReferrals % 5) * 20; // 5 referrals = 100%

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-800 dark:to-accent-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FiGift size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold">Referral Program</h1>
          </div>
          <p className="text-primary-100 dark:text-primary-200">
            Invite friends and earn free Pro plan days! Get 30 days for every 5 referrals.
          </p>
        </div>

      {/* Referral Link Card */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Your Referral Link</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Share this link with friends. When they sign up, you both benefit!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 font-mono text-sm break-all">
            {referralData.referralLink}
          </div>
          <button
            onClick={copyReferralLink}
            className="btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {copied ? (
              <>
                <FiCheck size={18} />
                Copied!
              </>
            ) : (
              <>
                <FiCopy size={18} />
                Copy Link
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Your Referral Code:</strong> <span className="font-mono text-lg">{referralData.referralCode}</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiUsers size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {referralData.stats.totalReferrals}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiTrendingUp size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {referralData.stats.proReferred + referralData.stats.premiumReferred}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Paid Referrals</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiAward size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {availableRewards}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Days Available</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiGift size={24} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {referralData.stats.rewardsUsed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Days Claimed</div>
        </div>
      </div>

      {/* Rewards Progress */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Progress to Next Reward</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{referralData.stats.totalReferrals % 5} / 5 referrals</span>
            <span>+30 days Pro</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-600 to-accent-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressToNextReward}%` }}
            />
          </div>
        </div>

        {availableRewards >= 30 && (
          <button
            onClick={claimRewards}
            disabled={claiming}
            className="btn btn-primary w-full sm:w-auto"
          >
            {claiming ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Claiming...</span>
              </>
            ) : (
              <>
                <FiGift size={18} />
                <span className="ml-2">Claim {Math.floor(availableRewards / 30) * 30} Days</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* How It Works */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">How Referral Rewards Work</h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <strong className="text-gray-900 dark:text-gray-100">Share your link:</strong> Send your unique referral link to friends via WhatsApp, Instagram, or any platform.
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <strong className="text-gray-900 dark:text-gray-100">Earn rewards:</strong> Get 30 days of Pro plan for every 5 friends who sign up using your link.
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <strong className="text-gray-900 dark:text-gray-100">Bonus rewards:</strong> Earn extra days when your referrals upgrade to Pro (+15 days) or Premium (+30 days).
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              4
            </div>
            <div>
              <strong className="text-gray-900 dark:text-gray-100">Claim anytime:</strong> Once you have 30+ days, click &quot;Claim&quot; to activate your free Pro plan time.
            </div>
          </div>
        </div>
      </div>

      {/* Referral List */}
      {referralData.referredUsers && referralData.referredUsers.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Your Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                </tr>
              </thead>
              <tbody>
                {referralData.referredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.plan === 'premium' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        user.plan === 'pro' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default ReferralProgram;
