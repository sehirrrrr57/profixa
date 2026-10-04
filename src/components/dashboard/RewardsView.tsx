import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { Award, Flame, Gift, CheckCircle2, Clock, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';

export const RewardsView: React.FC = () => {
  const { refreshBalances } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [hubData, setHubData] = useState<any>(null);
  const [bonusData, setBonusData] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);

  const loadData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([api.getRewardsHub(), api.getBonusStatus()]);
      if (hRes.success) setHubData(hRes);
      if (bRes.success) setBonusData(bRes);
    } catch (err) {
      console.warn('Error loading rewards data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimDaily = async () => {
    setIsClaiming(true);
    try {
      const res = await api.claimReward();
      showToast(
        'success',
        isUrdu ? 'ریوارڈ کلیم ہو گیا!' : 'Reward Claimed!',
        res.message || (isUrdu ? 'رقم والیٹ میں شامل کر دی گئی ہے۔' : 'Added to your wallet available balance.')
      );
      await Promise.all([loadData(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', isUrdu ? 'کلیم نہ ہو سکا' : 'Claim Failed', err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  const activePlan = hubData?.activePlan;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.rewards.title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t.rewards.subtitle}</p>
      </div>

      {/* Metric Highlights with Dark Brown Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.rewards.dailyStreak}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {hubData?.currentStreak || 0} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Consistent reward claim history</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.rewards.totalEarned}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            ${(hubData?.totalRewardsAccrued || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-[#451A03] font-semibold mt-1">Available in wallet</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">Active Plan</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 truncate">
            {activePlan ? activePlan.planName : 'None Active'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {activePlan ? `${activePlan.daysCompleted}/${activePlan.cycleDays} Days Finished` : 'Activate a plan to earn'}
          </p>
        </div>
      </div>

      {/* Main Claim Engine Card */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#451A03]" />
              <span>Daily Reward Engine</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Claim daily allocations funded through our professional cryptocurrency market trading.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClaimDaily}
            disabled={!hubData?.canClaimToday || isClaiming}
            className="px-6 py-3 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#451A03]/25 cursor-pointer"
          >
            {hubData?.canClaimToday
              ? `Claim $${(hubData?.availableToClaimAmount || (activePlan ? activePlan.amount * 2.2 / activePlan.cycleDays : 1.57)).toFixed(2)} USDT`
              : isUrdu
              ? 'آج کا کلیم مکمل'
              : 'Already Claimed Today'}
          </button>
        </div>

        {/* Days Progress Calendar Grid */}
        {activePlan ? (
          <div className="mt-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activePlan.planName} — Daily Return Schedule ({activePlan.cycleDays} Days)
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              {activePlan.dailyRewards.map((dayItem: any) => {
                const isCompleted = dayItem.status === 'COMPLETED';
                const isAvailable = dayItem.status === 'AVAILABLE';

                return (
                  <div
                    key={dayItem.day}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isAvailable
                        ? 'bg-[#FDF8F5] border-[#451A03] text-[#451A03] ring-2 ring-[#451A03]/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase">Day {dayItem.day}</p>
                    <p className="text-xs font-black my-1">${dayItem.amount.toFixed(2)}</p>
                    <span className="text-[10px] font-semibold block">
                      {isCompleted ? '✓ Claimed' : isAvailable ? 'Ready' : 'Upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No active plan. Activate our $5 plan (or higher) to earn $11 total return over 7 days with daily claims.
          </div>
        )}
      </div>

      {/* Welcome Bonus Information Box */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03] flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-[#451A03]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">
                $1.00 Welcome Registration Bonus
              </h4>
              <Badge variant="success" size="sm" dot>Credited</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Every registered user receives a $1.00 USDT welcome bonus. Note: This bonus is safely saved in your account balance and unlocks for withdrawal once you activate at least one earning plan.
            </p>
            <p className="text-[11px] text-[#5C2B14] font-semibold mt-1" dir={isUrdu ? 'rtl' : 'ltr'}>
              اہم نوٹ: یہ بونس صرف تب ودڈرا ہو سکے گا جب آپ کوئی ایک پلان ایکٹیو کریں گے۔
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
