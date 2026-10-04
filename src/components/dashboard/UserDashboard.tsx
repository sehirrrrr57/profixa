import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';
import {
  Wallet,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';

export interface UserDashboardProps {
  onNavigateView?: (view: string) => void;
  onNavigate?: (view: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigateView, onNavigate }) => {
  const navigate = onNavigateView || onNavigate || (() => {});
  const { user, balances, refreshBalances } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [rewardsHub, setRewardsHub] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [hubRes, txRes] = await Promise.allSettled([
        api.getRewardsHub(),
        api.getTransactions(),
      ]);

      if (hubRes.status === 'fulfilled' && hubRes.value.success) {
        setRewardsHub(hubRes.value);
      }
      if (txRes.status === 'fulfilled' && txRes.value.success) {
        setRecentTransactions(txRes.value.transactions.slice(0, 5));
      }
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleClaimToday = async () => {
    setIsClaiming(true);
    try {
      const res = await api.claimReward();
      showToast(
        'success',
        isUrdu ? 'ریوارڈ کلیم ہو گیا!' : 'Daily Return Claimed!',
        res.message || (isUrdu ? 'رقم والیٹ میں کریڈٹ ہو چکی ہے۔' : 'Credited to your available balance.')
      );
      await Promise.all([loadDashboardData(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', isUrdu ? 'کلیم نہ ہو سکا' : 'Claim Failed', err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const usdtTotal = (balances?.USDT.available || 0) + (balances?.USDT.locked || 0);
  const totalValuation = usdtTotal.toFixed(2);
  const availableValuation = (balances?.USDT.available || 0).toFixed(2);

  return (
    <div className="space-y-6 pb-12">
      {/* ----------------------------------------------------------------- */}
      {/* 1. WELCOME BONUS BANNER - Dark Brown Theme & Condition Notice      */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-[#FDF8F5] rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start sm:items-center gap-3.5 relative">
          <div className="w-12 h-12 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-[#451A03] animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-slate-900">
                🎁 $1.00 Welcome Bonus Active
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#451A03] text-white">
                Credited in Wallet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              <strong className="text-[#451A03]">Notice:</strong> Every new user receives a $1.00 welcome bonus in their balance. This bonus can only be withdrawn after activating at least one earning plan.
            </p>
            <p className="text-xs text-[#5C2B14] font-semibold mt-1" dir={isUrdu ? 'rtl' : 'ltr'}>
              نوٹ: یہ $1 کا ویلکم بونس آپ کے والیٹ میں موجود ہے، مگر یہ صرف تب ودڈرا ہوگا جب آپ کوئی ایک پلان ایکٹیو کریں گے۔
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => navigate('plans')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white text-xs font-bold transition-all shadow-md shadow-[#451A03]/20 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>{isUrdu ? 'پلان ایکٹیو کریں' : 'Activate a Plan →'}</span>
          </button>
        </div>
      </div>

      {/* Header Welcome & KYC Reminder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#EADBCE] shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.nav.dashboard}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-bold text-slate-800">{user?.fullName}</span>. Here is your portfolio overview.
          </p>
        </div>

        {user?.kycStatus !== 'APPROVED' && (
          <div className="flex items-center gap-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                {user?.kycStatus === 'PENDING_REVIEW' ? 'KYC In Review' : 'KYC Verification Required'}
              </span>
              <span className="text-slate-500 text-[11px]">
                {user?.kycStatus === 'PENDING_REVIEW'
                  ? 'Our compliance team is auditing your identity documents.'
                  : 'Complete KYC to unlock full withdrawals.'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('kyc')}
              className="ml-auto text-xs shrink-0 border-[#EADBCE] text-[#451A03] hover:bg-[#FDF8F5]"
            >
              {user?.kycStatus === 'PENDING_REVIEW' ? 'Check Status' : 'Verify'}
            </Button>
          </div>
        )}
      </div>

      {/* Primary Financial Metric Cards with Dark Brown Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">Total Portfolio</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${totalValuation}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Aggregated Available + Locked</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Asset: Tether (USDT)</span>
            <span className="text-slate-500 font-semibold">TRC20 • Aptos • BEP20</span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.dashboard.availableBalance}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${availableValuation}
            </p>
            <p className="text-[11px] text-[#451A03] font-semibold mt-0.5">Includes $1.00 Welcome Bonus</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('wallet')}
              className="w-full h-8 text-xs font-bold rounded-lg bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#451A03]" />
              <span>Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('wallet')}
              className="w-full h-8 text-xs font-bold rounded-lg bg-[#451A03] hover:bg-[#341402] text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Locked in Plans */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.dashboard.lockedInPlans}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${(balances?.USDT.locked || 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Accruing daily cycle returns</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Active Cycles</span>
            <button
              onClick={() => navigate('plans')}
              className="font-bold text-[#451A03] hover:underline cursor-pointer"
            >
              View Plans →
            </button>
          </div>
        </div>

        {/* Total Rewards Accrued */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.dashboard.totalRewards}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${(rewardsHub?.totalRewardsAccrued || 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Directly credited to ledger</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Streak: {rewardsHub?.currentStreak || 0} Days</span>
            <button
              onClick={() => navigate('rewards')}
              className="font-bold text-[#451A03] hover:underline cursor-pointer"
            >
              Rewards Hub →
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Plan & Daily Claim Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Reward Action Widget */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#451A03]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.rewards.dailyStreak}</h3>
                <p className="text-xs text-slate-500">Automated daily returns reward protocol</p>
              </div>
            </div>
            {rewardsHub?.activePlan ? (
              <Badge variant="success" size="sm" dot>Plan Active</Badge>
            ) : (
              <Badge variant="neutral" size="sm">No Active Plan</Badge>
            )}
          </div>

          {rewardsHub?.activePlan ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{rewardsHub.activePlan.planName}</span>
                  <span className="text-[#451A03] font-bold">
                    {rewardsHub.activePlan.daysCompleted} / {rewardsHub.activePlan.cycleDays} Days
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#F5EDE8] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#451A03] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(rewardsHub.activePlan.daysCompleted / rewardsHub.activePlan.cycleDays) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Principal: ${rewardsHub.activePlan.amount} {rewardsHub.activePlan.asset}</span>
                  <span>Accrued: ${rewardsHub.activePlan.totalRewardAccrued.toFixed(2)}</span>
                </div>
              </div>

              {/* Claim Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Today's Scheduled Return</p>
                  <p className="text-xl font-black text-slate-900">
                    ${rewardsHub.availableToClaimAmount > 0 ? rewardsHub.availableToClaimAmount.toFixed(2) : (rewardsHub.activePlan.amount === 5 ? '1.57' : (rewardsHub.activePlan.amount * 2.2 / rewardsHub.activePlan.cycleDays).toFixed(2))} {rewardsHub.activePlan.asset}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClaimToday}
                  disabled={!rewardsHub.canClaimToday || isClaiming}
                  className="px-5 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isClaiming
                    ? 'Claiming...'
                    : rewardsHub.canClaimToday
                    ? (isUrdu ? 'آج کا ریوارڈ کلیم کریں' : 'Claim Daily Return')
                    : 'Claimed For Today'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7 text-[#451A03]" />
              </div>
              <p className="text-sm font-bold text-slate-900">No Active Reward Plans Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Activate our $5 starter plan (or higher) to earn $11 total return over 7 days and unlock your $1.00 welcome bonus for withdrawal.
              </p>
              <button
                type="button"
                onClick={() => navigate('plans')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Browse Reward Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('wallet')}
                className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#78350F] text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-4 h-4 text-[#451A03]" />
                </div>
                <p className="text-xs font-bold text-slate-900">Deposit USDT</p>
                <p className="text-[10px] text-slate-500">TRC20 • Aptos • BEP20</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('wallet')}
                className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#78350F] text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-[#451A03]" />
                </div>
                <p className="text-xs font-bold text-slate-900">Withdraw</p>
                <p className="text-[10px] text-slate-500">To External Wallet</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('plans')}
                className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#78350F] text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4 text-[#451A03]" />
                </div>
                <p className="text-xs font-bold text-slate-900">Activate Plan</p>
                <p className="text-[10px] text-slate-500">$5 yields $11</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('kyc')}
                className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#78350F] text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4 text-[#451A03]" />
                </div>
                <p className="text-xs font-bold text-slate-900">KYC Verification</p>
                <p className="text-[10px] text-slate-500">AML Compliance</p>
              </button>

              <button
                type="button"
                onClick={() => navigate('referrals')}
                className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-[#FDF8F5] to-amber-50/50 border border-[#EADBCE] hover:border-[#78350F] text-left transition-all group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Gift className="w-4 h-4 text-[#451A03]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Referral Program & Network</p>
                    <p className="text-[10px] text-slate-500">Earn up to 10% instant USDT bonuses on friend activations</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#451A03] group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.dashboard.recentTransactions}</h3>
            <p className="text-xs text-slate-500">Latest cryptographic and ledger events</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('transactions')}
            className="text-xs font-bold text-[#451A03] hover:underline transition-colors"
          >
            {t.transactions.viewDetails} →
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADBCE] text-slate-400 font-semibold">
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Asset</th>
                  <th className="pb-3 px-2">Amount</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBCE]">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FDF8F5]">
                    <td className="py-3 px-2 font-bold text-slate-900">{tx.type}</td>
                    <td className="py-3 px-2 font-semibold text-[#451A03]">{tx.asset}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {tx.type === 'WITHDRAWAL' || tx.type === 'PLAN_LOCK' ? '-' : '+'}
                      {tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          tx.status === 'CONFIRMED' || tx.status === 'COMPLETED'
                            ? 'success'
                            : tx.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-slate-500">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
