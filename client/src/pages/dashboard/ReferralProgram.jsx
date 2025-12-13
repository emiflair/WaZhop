import { useState, useEffect, useMemo } from 'react';
import {
  FiCopy,
  FiCheck,
  FiGift,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiDollarSign,
  FiShield,
  FiLayers,
  FiClock,
  FiArrowRight,
  FiUnlock,
  FiBarChart2,
  FiInfo,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardLayout from '../../components/DashboardLayout';

const defaultStats = {
  totalReferrals: 0,
  freeReferred: 0,
  proReferred: 0,
  premiumReferred: 0,
  rewardsEarned: 0,
  rewardsUsed: 0
};

const defaultEarnings = {
  summary: {
    totalEarned: 0,
    totalPaidOut: 0,
    withdrawableBalance: 0,
    lockedAmount: 0,
    monthlyEarnings: 0,
    activePremiumReferrals: 0,
    pendingActivation: 0,
    commissionPercent: 5,
    perReferralCommission: 900,
    minimumPayout: 20000,
    currency: 'NGN'
  },
  records: [],
  payoutRequests: []
};

const buildEmptyReferralState = (overrides = {}) => ({
  referralCode: 'N/A',
  referralLink: '',
  stats: { ...defaultStats },
  referredUsers: [],
  earnings: {
    summary: { ...defaultEarnings.summary },
    records: [],
    payoutRequests: []
  },
  ...overrides
});

const formatCurrency = (value = 0, currency = 'NGN') => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0
}).format(value);

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';

const statusStyles = {
  pending_activation: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200'
};

const payoutStatusStyles = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300'
};

const tabs = [
  { id: 'rewards', label: 'Rewards' },
  { id: 'earnings', label: 'Earnings' }
];

const EarningsRewardsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [referralData, setReferralData] = useState(buildEmptyReferralState());
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState('rewards');
  const [calculatorReferrals, setCalculatorReferrals] = useState(5);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await api.get('/referrals/stats', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        params: { _t: Date.now() }
      });

      let data = response?.data || response;
      if (data && data.status && data.config && typeof data.data !== 'undefined') {
        data = data.data;
      }

      if (!data || Object.keys(data).length === 0) {
        toast.error('No data received from server, showing defaults');
        setReferralData(buildEmptyReferralState());
        setLoading(false);
        return;
      }

      if (!data.stats) {
        data.stats = { ...defaultStats };
      }

      if (!data.referredUsers) {
        data.referredUsers = [];
      }

      if (!data.earnings) {
        data.earnings = {
          summary: { ...defaultEarnings.summary },
          records: [],
          payoutRequests: []
        };
      } else {
        data.earnings = {
          summary: { ...defaultEarnings.summary, ...(data.earnings.summary || {}) },
          records: data.earnings.records || [],
          payoutRequests: data.earnings.payoutRequests || []
        };
      }

      setReferralData(data);
      setHasLoaded(true);
      setLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Network error';
      toast.error(`Failed to load: ${errorMsg}`);
      setLoadError(errorMsg);
      setReferralData(buildEmptyReferralState({
        referralCode: 'ERROR',
        referralLink: `Error: ${errorMsg}`
      }));
      setHasLoaded(true);
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData?.referralLink) return;
    navigator.clipboard.writeText(referralData.referralLink);
    setCopied(true);
    toast.success('Referral link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const claimRewards = async () => {
    const available = (referralData?.stats?.rewardsEarned || 0) - (referralData?.stats?.rewardsUsed || 0);
    if (available < 30) {
      toast.error('Need at least 30 days of rewards (5 referrals) to claim');
      return;
    }

    setClaiming(true);
    try {
      const response = await api.post('/referrals/claim');
      toast.success(response.data.message);
      fetchReferralStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  };

  const handlePayoutSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(payoutAmount);
    if (!parsedAmount || Number.isNaN(parsedAmount)) {
      toast.error('Enter a valid payout amount');
      return;
    }

    const withdrawable = referralData?.earnings?.summary?.withdrawableBalance || 0;
    const minimum = referralData?.earnings?.summary?.minimumPayout || defaultEarnings.summary.minimumPayout;

    if (parsedAmount < minimum) {
      toast.error(`Minimum payout is ${formatCurrency(minimum)}`);
      return;
    }

    if (parsedAmount > withdrawable) {
      toast.error('Requested amount exceeds withdrawable balance');
      return;
    }

    setRequesting(true);
    try {
      const response = await api.post('/referrals/payout-request', {
        amount: parsedAmount,
        notes: payoutNotes?.trim() || undefined
      });

      toast.success(response.data?.message || 'Payout request submitted');
      setPayoutAmount('');
      setPayoutNotes('');

      if (response.data?.earnings) {
        setReferralData((prev) => (prev ? { ...prev, earnings: response.data.earnings } : prev));
      } else {
        fetchReferralStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit payout request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading && !hasLoaded) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const stats = referralData?.stats || defaultStats;
  const availableRewards = stats.rewardsEarned - stats.rewardsUsed;
  const progressToNextReward = (stats.totalReferrals % 5) * 20;
  const earningsSummary = referralData?.earnings?.summary || defaultEarnings.summary;
  const earningsRecords = referralData?.earnings?.records || [];
  const payoutRequests = referralData?.earnings?.payoutRequests || [];
  const withdrawableBalance = earningsSummary.withdrawableBalance || 0;
  const canRequestPayout = withdrawableBalance >= (earningsSummary.minimumPayout || defaultEarnings.summary.minimumPayout);
  const minimumPayout = earningsSummary.minimumPayout || defaultEarnings.summary.minimumPayout;
  const perReferralCommissionValue = earningsSummary.perReferralCommission || defaultEarnings.summary.perReferralCommission;
  const calculatorMonthly = calculatorReferrals * perReferralCommissionValue;
  const calculatorYearly = calculatorMonthly * 12;
  const calculatorPayoutMonths = calculatorMonthly > 0 ? Math.ceil(minimumPayout / calculatorMonthly) : null;

  const rewardHighlights = useMemo(() => ([
    {
      icon: <FiUsers size={22} />,
      label: 'Total Referrals',
      value: stats.totalReferrals,
      accent: 'from-primary-500/10 to-primary-500/0'
    },
    {
      icon: <FiTrendingUp size={22} />,
      label: 'Paid Customers',
      value: stats.proReferred + stats.premiumReferred,
      accent: 'from-accent-500/10 to-accent-500/0'
    },
    {
      icon: <FiAward size={22} />,
      label: 'Reward Days Available',
      value: availableRewards,
      accent: 'from-purple-500/10 to-purple-500/0'
    },
    {
      icon: <FiGift size={22} />,
      label: 'Days Claimed',
      value: stats.rewardsUsed,
      accent: 'from-emerald-500/10 to-emerald-500/0'
    }
  ]), [stats, availableRewards]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {loadError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-600 dark:text-amber-300"><FiAlertCircle size={20} /></div>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Showing cached referral data</p>
                <p className="text-sm text-amber-700/90 dark:text-amber-200/80">{loadError}. We keep the page alive with your last known stats—tap refresh anytime to retry.</p>
              </div>
            </div>
            <div>
              <button
                onClick={fetchReferralStats}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:text-amber-100 dark:border-amber-400/60 dark:hover:bg-amber-400/10"
              >
                <FiArrowRight size={16} /> Retry now
              </button>
            </div>
          </div>
        )}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-primary-900 text-white p-6">
          <div className="absolute inset-y-0 right-0 w-64 opacity-20 bg-[radial-gradient(circle_at_top,_#5eead4,_transparent_55%)]" />
          <div className="relative">
            <p className="uppercase tracking-[0.35em] text-xs text-white/70 mb-2">Growth Hub</p>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4">Earnings & Rewards</h1>
            <p className="text-white/80 max-w-2xl">
              Invite friends and earn 5% every month. Earn recurring income from every Premium subscriber you refer — and keep stacking free Pro days with the very same link.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur">
                <FiShield /> Anti-fraud protected
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur">
                <FiLayers /> 5% lifetime commission
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur">
                <FiClock /> ₦20k minimum payout
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Your Referral Link</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invite friends and earn 5% every month. Earn recurring income from every Premium subscriber you refer — plus free Pro days.</p>
            </div>
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Referral URL · https://wazhop.ng/register?ref=XXXX</p>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800/80 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 font-mono text-sm break-all">
                {referralData.referralLink}
              </div>
              <button
                onClick={copyReferralLink}
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-lg">
                <span className="uppercase text-[11px] tracking-wide text-primary-700 dark:text-primary-300">Referral Code</span>
                <span className="font-mono text-base text-gray-900 dark:text-gray-50">{referralData.referralCode}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <FiLayers className="text-gray-500" /> {earningsSummary.commissionPercent || 5}% monthly commission on Premium renewals
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[180px] px-4 py-3 text-sm font-semibold border-b ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-500'
                    : 'text-gray-500 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'rewards' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-primary-500">Rewards</p>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">🎁 Free Pro Rewards</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Invite friends and earn free Pro plan days. Keep the existing progress bar, claim flow, and auto-upgrade behavior—now showcased beside cash earnings.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rewardHighlights.map((item) => (
                    <div key={item.label} className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                      <div className="relative">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-900/5 dark:bg-white/10 text-primary-600 dark:text-primary-200 mb-3">
                          {item.icon}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Progress to next 30 days</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Every 5 signups unlocks a free month.</p>
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{stats.totalReferrals % 5} / 5 referrals</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4">
                      <div className="h-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all" style={{ width: `${progressToNextReward}%` }} />
                    </div>
                    {availableRewards >= 30 && (
                      <button onClick={claimRewards} disabled={claiming} className="btn btn-primary mt-5 inline-flex items-center gap-2">
                        {claiming ? <LoadingSpinner size="sm" /> : <FiGift size={18} />}
                        {claiming ? 'Claiming...' : `Claim ${Math.floor(availableRewards / 30) * 30} days`}
                      </button>
                    )}
                  </div>

                  <div className="card space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">How rewards stack</h3>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex gap-3"><span className="text-primary-500">•</span> Free to Pro referral → +15 days</li>
                      <li className="flex gap-3"><span className="text-primary-500">•</span> Free to Premium referral → +30 days</li>
                      <li className="flex gap-3"><span className="text-primary-500">•</span> 5 signups (any plan) → +30 days</li>
                      <li className="flex gap-3"><span className="text-primary-500">•</span> Claim to extend or upgrade instantly</li>
                    </ul>
                  </div>
                </div>

                {referralData.referredUsers?.length > 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent referrals</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last 10 signups through your link.</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                            <th className="py-3">Seller</th>
                            <th className="py-3">Plan</th>
                            <th className="py-3">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralData.referredUsers.slice(0, 10).map((user) => (
                            <tr key={user._id} className="border-b border-gray-50 dark:border-gray-800/70">
                              <td className="py-3 text-gray-900 dark:text-gray-100">{user.name}</td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.plan === 'premium'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200'
                                    : user.plan === 'pro'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200'
                                }`}>
                                  {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Premium earnings</p>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">💰 Earn 5% Every Month</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Get paid when your referrals subscribe to Premium. Commissions renew automatically each month as long as the subscription is active.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Total earnings</span>
                      <FiDollarSign className="text-primary-500" />
                    </div>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(earningsSummary.totalEarned, earningsSummary.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lifetime commissions generated by Premium referrals.</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Monthly earnings</span>
                      <FiTrendingUp className="text-primary-500" />
                    </div>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(earningsSummary.monthlyEarnings, earningsSummary.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">5% of ₦18,000 per active Premium referral.</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Active Premium referrals</span>
                      <FiUsers className="text-primary-500" />
                    </div>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{earningsSummary.activePremiumReferrals}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recurring earnings continue while they stay subscribed.</p>
                  </div>
                  <div className="card">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Withdrawable balance</span>
                      <FiUnlock className="text-primary-500" />
                    </div>
                    <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(withdrawableBalance, earningsSummary.currency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min payout {formatCurrency(minimumPayout, earningsSummary.currency)} · locked funds auto-release after 7 days.</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="card lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Earnings pipeline</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Referral · Plan · Commission · Status · Lifetime earnings.</p>
                      </div>
                      <span className="text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1"><FiDollarSign /> {earningsSummary.commissionPercent}% recurring</span>
                    </div>
                    {earningsRecords.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No Premium referrals yet. Share your link — every upgrade instantly locks in 5% of ₦18,000 per month.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                              <th className="py-3">Referral</th>
                              <th className="py-3">Plan</th>
                              <th className="py-3">Commission</th>
                              <th className="py-3">Status</th>
                              <th className="py-3">Lifetime</th>
                            </tr>
                          </thead>
                          <tbody>
                            {earningsRecords.map((record) => (
                              <tr key={record.referralId} className="border-b border-gray-50 dark:border-gray-800/70">
                                <td className="py-3">
                                  <p className="text-gray-900 dark:text-gray-100 font-medium">{record.referredName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{record.referredEmail || '—'}</p>
                                </td>
                                <td className="py-3">
                                  <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{record.plan || 'premium'}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">₦18,000 / month</p>
                                </td>
                                <td className="py-3">
                                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{record.commissionPercent || earningsSummary.commissionPercent}%</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(record.monthlyCommissionValue, earningsSummary.currency)} / month</p>
                                </td>
                                <td className="py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[record.status] || 'bg-gray-100 text-gray-700'}`}>
                                    {record.status.replace('_', ' ')}
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start {formatDate(record.earningsStartDate)}</p>
                                </td>
                                <td className="py-3">
                                  <p className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrency(record.totalEarned, earningsSummary.currency)}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending {formatCurrency(record.pendingAmount, earningsSummary.currency)}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="card space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Request payout</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hit ₦20,000 withdrawable balance and submit a manual payout request. We review every request to keep the system fair.</p>
                    <form onSubmit={handlePayoutSubmit} className="space-y-3">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount (NGN)</label>
                        <input
                          type="number"
                          min={minimumPayout}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          placeholder={minimumPayout?.toString() || '20000'}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes (optional)</label>
                        <textarea
                          value={payoutNotes}
                          onChange={(e) => setPayoutNotes(e.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          placeholder="Bank, preferred contact, etc"
                        />
                      </div>
                      <button type="submit" disabled={!canRequestPayout || requesting} className="btn btn-primary w-full inline-flex items-center justify-center gap-2">
                        {requesting ? <LoadingSpinner size="sm" /> : <FiArrowRight size={18} />}
                        {requesting ? 'Submitting...' : `Request ${formatCurrency(Number(payoutAmount) || minimumPayout, earningsSummary.currency)}`}
                      </button>
                      {!canRequestPayout && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">Reach {formatCurrency(minimumPayout, earningsSummary.currency)} withdrawable balance to unlock payouts.</p>
                      )}
                    </form>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">Payout flow</p>
                      <p>Pending → Processing (14 days) → Paid</p>
                      <p>Method: bank transfer (coming soon). We will email you during each step.</p>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Payout history</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Manual review • 3-5 business days</span>
                    </div>
                    {payoutRequests.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No payout requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {payoutRequests.map((request) => (
                          <div key={request.requestId} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(request.amount, earningsSummary.currency)}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payoutStatusStyles[request.status] || 'bg-gray-100 text-gray-700'}`}>
                                {request.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requested {formatDate(request.requestedAt)} · ETA {formatDate(request.estimatedPayoutDate)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Activation tracker</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{earningsSummary.pendingActivation} Premium referrals are completing their 7-day anti-fraud window before commissions unlock.</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                      <p className="flex gap-2"><FiShield className="text-primary-500" /> No self-referrals. Locked amount releases once the Premium payment clears for 7 days.</p>
                      <p className="flex gap-2"><FiClock className="text-primary-500" /> Earnings pause instantly if a subscription cancels, so you only get paid on real revenue.</p>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">How earnings & rewards work</h3>
                    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <FiInfo className="text-primary-500 mt-0.5" />
                      <div className="space-y-2">
                        <p>Share your referral link. When someone subscribes to Premium, you automatically earn 5% ({formatCurrency(perReferralCommissionValue, earningsSummary.currency)}) every month for as long as they stay subscribed.</p>
                        <p>Free Pro rewards stay exactly the same: 5 total referrals unlock +30 days, Premium upgrades still grant +30 days instantly, and you still claim them manually.</p>
                        <p>Earnings calculation, balance tracking, and subscription monitoring are automatic—only payout approval is manual.</p>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                      <li>• One referral URL powers everything: rewards and recurring earnings.</li>
                      <li>• Earnings stop the moment a Premium seller cancels.</li>
                      <li>• Minimum payout remains {formatCurrency(minimumPayout, earningsSummary.currency)}.</li>
                    </ul>
                  </div>

                  <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiBarChart2 className="text-primary-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Example earnings calculator</h3>
                      </div>
                      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{calculatorReferrals} Premium referrals</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={calculatorReferrals}
                      onChange={(e) => setCalculatorReferrals(Number(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly income</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(calculatorMonthly, earningsSummary.currency)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Yearly income</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(calculatorYearly, earningsSummary.currency)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Months to ₦20k payout</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">{calculatorPayoutMonths ? `${calculatorPayoutMonths} mo${calculatorPayoutMonths > 1 ? 's' : ''}` : '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
                      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
                        <p className="font-semibold">5 referrals</p>
                        <p>{formatCurrency(perReferralCommissionValue * 5, earningsSummary.currency)} / month · reach payout in {Math.ceil(minimumPayout / (perReferralCommissionValue * 5))} months.</p>
                      </div>
                      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
                        <p className="font-semibold">10 referrals</p>
                        <p>Steady {formatCurrency(perReferralCommissionValue * 10, earningsSummary.currency)} monthly income.</p>
                      </div>
                      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
                        <p className="font-semibold">15+ referrals</p>
                        <p>Unlock payouts almost every month and stack long-term income.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EarningsRewardsDashboard;
