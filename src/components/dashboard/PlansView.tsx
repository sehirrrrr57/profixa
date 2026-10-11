import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { RewardPlan, UserPlan } from '../../types/index';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Check,
  Gift,
  TrendingUp,
  Sparkles,
  Zap,
  Info,
  Calendar,
  Lock,
} from 'lucide-react';

export const PlansView: React.FC = () => {
  const { balances, refreshBalances } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [plans, setPlans] = useState<RewardPlan[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RewardPlan | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [claimingPlanId, setClaimingPlanId] = useState<string | null>(null);
  const [advancingPlanId, setAdvancingPlanId] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const loadPlans = async () => {
    try {
      const [pRes, uRes] = await Promise.all([api.getPlans(), api.getUserPlans()]);
      if (pRes.success) setPlans(pRes.plans);
      if (uRes.success) setUserPlans(uRes.userPlans);
    } catch (err) {
      console.warn('Error loading plans:', err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleActivate = async () => {
    if (!selectedPlan) return;
    setIsActivating(true);
    try {
      const res = await api.activatePlan(selectedPlan.id);
      showToast(
        'success',
        isUrdu ? 'پلان کامیابی سے ایکٹیو ہو گیا' : 'Plan Activated Successfully',
        res.message || (isUrdu ? 'پہلے دن کا ڈیلی کلیم فورا دستیاب ہے!' : 'Day 1 reward is immediately ready to claim!')
      );
      setSelectedPlan(null);
      await Promise.all([loadPlans(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', isUrdu ? 'پلان ایکٹیو نہ ہو سکا' : 'Activation Failed', err.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleClaimDaily = async (plan: UserPlan) => {
    setClaimingPlanId(plan.id);
    try {
      const res = await api.claimReward(plan.id);
      showToast(
        'success',
        isUrdu ? 'ڈیلی ریوارڈ کلیم ہو گیا!' : 'Daily Return Claimed!',
        res.message || (isUrdu ? 'رقم آپ کے مین بیلنس میں جمع ہو چکی ہے۔' : 'Amount credited to your available wallet balance.')
      );
      await Promise.all([loadPlans(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', isUrdu ? 'کلیم نہ ہو سکا' : 'Claim Failed', err.message);
    } finally {
      setClaimingPlanId(null);
    }
  };

  const handleAdvanceDay = async (planId: string) => {
    setAdvancingPlanId(planId);
    try {
      const res = await api.advancePlanDay(planId);
      showToast(
        'info',
        isUrdu ? 'اگلا دن کھل گیا (ٹیسٹنگ)' : 'Next Day Unlocked (Sandbox Test)',
        res.message
      );
      await Promise.all([loadPlans(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', 'Advance Failed', err.message);
    } finally {
      setAdvancingPlanId(null);
    }
  };

  const activeUserPlans = userPlans.filter((p) => p.status === 'ACTIVE');
  const availableWalletTotal = balances?.USDT.available || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EADBCE] shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
              <Layers className="w-5 h-5 text-[#451A03]" />
            </span>
            <span>{isUrdu ? 'انویسٹمنٹ اور ڈیلی ریوارڈ پلانز' : 'Crypto Trading & Daily Reward Plans'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isUrdu
              ? 'اپنے پسندیدہ پلان کو ایکٹیو کریں اور کرپٹو ٹریڈنگ کے منافع سے روزانہ کلیم حاصل کریں۔'
              : 'Choose your preferred plan. Returns are funded through algorithmic crypto market trading.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-xs">
            <span className="text-slate-500 block text-[11px]">{isUrdu ? 'دستیاب بیلنس:' : 'Available Balance:'}</span>
            <span className="font-black text-[#451A03] text-base">
              ${availableWalletTotal.toFixed(2)} USDT
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FDF8F5] border border-[#451A03] text-[#451A03] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#451A03]" />
            <span>{isUrdu ? 'ٹریڈنگ پالیسی' : 'Trading Policy'}</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* TRADING & PROFIT POLICY NOTICE BANNER                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white border border-[#EADBCE] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-6 h-6 text-[#451A03]" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {isUrdu ? 'کرپٹو ٹریڈنگ اور منافع کی واپسی کی پالیسی' : 'Crypto Trading & Guaranteed Return Policy'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#451A03] text-white">
                Guaranteed + Risk Management
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {isUrdu
                ? 'ہم آپ کے جمع کردہ فنڈز سے پروفیشنل کرپٹو ٹریڈنگ کرتے ہیں جس کا منافع ڈیلی کلیم کے طور پر واپس دیا جاتا ہے۔ $5 پلان پر ویک اینڈ / 7 دنوں کے اختتام پر مکمل $11.00 ریٹرن ملتا ہے۔ جس دن پلان ایکٹیو کریں گے اسی دن سے ڈے 1 شروع ہوگا۔'
                : 'All deposited funds are traded across high-liquidity crypto markets. For example, our $5 plan yields a total of $11.00 at the end of the 7-day cycle ($1.57/day claimable). Day 1 starts immediately on activation.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPolicyModal(true)}
          className="shrink-0 px-4 py-2 text-xs font-bold text-[#451A03] hover:text-[#341402] hover:underline cursor-pointer"
        >
          {isUrdu ? 'پالیسی تفصیلات پڑھیں →' : 'Read Full Policy →'}
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ACTIVE USER PLANS - WITH LIVE DAILY CLAIM BUTTON                   */}
      {/* ----------------------------------------------------------------- */}
      {activeUserPlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {isUrdu ? `آپ کے فعال پلانز (${activeUserPlans.length})` : `Your Active Reward Cycles (${activeUserPlans.length})`}
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              {isUrdu ? 'روزانہ کلیم کریں اور مین بیلنس میں شامل کریں' : 'Claim daily return to credit available wallet'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeUserPlans.map((up) => {
              const availableDay = up.dailyRewards.find((d) => d.status === 'AVAILABLE');
              const completedDaysCount = up.dailyRewards.filter((d) => d.status === 'COMPLETED').length;
              const targetTotalReturn = up.dailyRewards.reduce((sum, d) => sum + d.amount, 0);
              const progressPct = Math.round((completedDaysCount / up.cycleDays) * 100);

              return (
                <div
                  key={up.id}
                  className="bg-white rounded-2xl border-2 border-[#451A03] shadow-md p-6 space-y-5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#451A03] uppercase tracking-wider block">
                        Active Investment Cycle
                      </span>
                      <h4 className="text-lg font-black text-slate-900 mt-0.5">{up.planName}</h4>
                    </div>
                    <Badge variant="success" size="sm" dot>
                      Cycle Active
                    </Badge>
                  </div>

                  {/* Financial Return Summary */}
                  <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Invested</span>
                      <span className="text-base font-black text-slate-900">${up.amount} {up.asset}</span>
                    </div>
                    <div className="border-x border-[#EADBCE]">
                      <span className="text-[10px] text-[#451A03] uppercase font-bold block">Total Return</span>
                      <span className="text-base font-black text-[#451A03]">${targetTotalReturn.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold block">Total Claimed</span>
                      <span className="text-base font-black text-emerald-600">${up.totalRewardAccrued.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Cycle Progress & Calendar Tracker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#451A03]" />
                        <span>Day {completedDaysCount} of {up.cycleDays} Completed</span>
                      </span>
                      <span className="font-bold text-[#451A03]">{progressPct}% Complete</span>
                    </div>
                    <div className="w-full bg-[#F5EDE8] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#451A03] h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Days Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {up.dailyRewards.map((dr) => (
                      <span
                        key={dr.day}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          dr.status === 'COMPLETED'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : dr.status === 'AVAILABLE'
                            ? 'bg-[#451A03] border-[#451A03] text-white shadow-xs animate-pulse'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        D{dr.day}: ${dr.amount.toFixed(2)} {dr.status === 'COMPLETED' ? '✓' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons: Live Daily Claim & Advance Day */}
                  <div className="pt-2 border-t border-[#EADBCE] flex flex-col sm:flex-row items-center gap-3">
                    {availableDay ? (
                      <button
                        type="button"
                        onClick={() => handleClaimDaily(up)}
                        disabled={claimingPlanId === up.id}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white font-bold text-xs shadow-md shadow-[#451A03]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>
                          {claimingPlanId === up.id
                            ? 'Claiming Return...'
                            : isUrdu
                            ? `آج کا منافع کلیم کریں (+$${availableDay.amount.toFixed(2)} USDT)`
                            : `Claim Day ${availableDay.day} Return: +$${availableDay.amount.toFixed(2)} USDT`}
                        </span>
                      </button>
                    ) : (
                      <div className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-xs font-bold text-[#5C2B14] flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isUrdu
                            ? 'آج کا کلیم مکمل! اگلا دن کل کھلے گا۔'
                            : "Today's reward claimed! Next day unlocks tomorrow."}
                        </span>
                      </div>
                    )}

                    {/* Sandbox Fast-Forward Helper */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceDay(up.id)}
                      disabled={advancingPlanId === up.id}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white hover:bg-[#FDF8F5] border border-[#EADBCE] text-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title="Advance to next day to test claiming all 7 days to reach full return"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#451A03]" />
                      <span>{advancingPlanId === up.id ? 'Advancing...' : '⚡ Advance 24h'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* AVAILABLE PLANS CATALOG                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isUrdu ? 'دستیاب انویسٹمنٹ اور ریوارڈ کیٹلاگ' : 'Available Reward Catalog & Investment Tiers'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isUrdu
              ? 'ہر پلان کا ایک مخصوص دورانیہ اور روزانہ کلیم کا فارمولا ہے۔ رقم براہ راست آپ کے والیٹ سے کٹے گی۔'
              : 'Each tier provides a calibrated daily claim yield based on professional crypto trading arbitrage.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((p) => {
            const hasSufficientBalance = (balances?.[p.asset]?.available || 0) >= p.amount;
            const targetReturn = (p as any).totalReturn || p.amount * 2.2;
            const dailyClaimAmt = ((p as any).dailyReturn || targetReturn / p.cycleDays).toFixed(2);
            const is5DollarStarter = p.amount === 5;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-2xs hover:shadow-lg transition-all space-y-5 relative ${
                  is5DollarStarter
                    ? 'border-2 border-[#451A03] ring-2 ring-[#451A03]/10'
                    : 'border-[#EADBCE] hover:border-[#78350F]'
                }`}
              >
                {is5DollarStarter && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#451A03] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                    ⭐ User Choice ($5 → $11)
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-[#451A03] bg-[#FDF8F5] border border-[#EADBCE] px-2.5 py-0.5 rounded-lg">
                      {p.asset}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#451A03]" />
                      <span>{p.cycleDays} Days</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-1">{p.name}</h4>

                  {/* Big Price Tag */}
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">${p.amount}</span>
                    <span className="text-xs font-bold text-[#451A03]">{p.asset}</span>
                  </div>

                  {/* Returns Breakdown Table */}
                  <div className="space-y-2 text-xs py-3 border-y border-[#EADBCE]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Return:</span>
                      <span className="font-black text-[#451A03] text-sm">${targetReturn.toFixed(2)} {p.asset}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Daily Claim:</span>
                      <span className="font-extrabold text-slate-900">${dailyClaimAmt} / day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Net Profit:</span>
                      <span className="font-bold text-emerald-600">+${(targetReturn - p.amount).toFixed(2)} {p.asset}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Start Date:</span>
                      <span className="font-semibold text-slate-700">Immediate (Day 1)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 leading-snug">
                    {isUrdu
                      ? `7 دنوں کے اختتام پر مکمل $${targetReturn.toFixed(2)} کی واپسی روزانہ کلیم کے ساتھ۔`
                      : `Receive $${dailyClaimAmt} daily for ${p.cycleDays} days, totaling $${targetReturn.toFixed(2)}.`}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(p)}
                    className="w-full py-3 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white font-bold text-xs shadow-sm shadow-[#451A03]/20 transition-all cursor-pointer"
                  >
                    {isUrdu ? `پلان منتخب کریں ($${p.amount})` : `Activate Plan ($${p.amount})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* PLAN ACTIVATION MODAL                                             */}
      {/* ----------------------------------------------------------------- */}
      {selectedPlan && (
        <Modal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          title={`Activate ${selectedPlan.name}`}
          subtitle="Confirm your principal commitment to this crypto trading cycle."
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="p-4 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Principal Commitment:</span>
                <span className="font-bold text-slate-900">${selectedPlan.amount} {selectedPlan.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Your Available Balance:</span>
                <span className="font-bold text-[#451A03]">
                  ${(balances?.[selectedPlan.asset]?.available || 0).toFixed(2)} {selectedPlan.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cycle Duration:</span>
                <span className="font-bold text-slate-900">{selectedPlan.cycleDays} Days (Starts Today)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EADBCE]">
                <span className="text-slate-600 font-bold">Guaranteed Total Return:</span>
                <span className="font-black text-[#451A03] text-sm">
                  ${((selectedPlan as any).totalReturn || selectedPlan.amount * 2.2).toFixed(2)} {selectedPlan.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Daily Return To Claim:</span>
                <span className="font-bold text-emerald-700">
                  ${(((selectedPlan as any).totalReturn || selectedPlan.amount * 2.2) / selectedPlan.cycleDays).toFixed(2)} / day
                </span>
              </div>
            </div>

            {/* Trading Policy notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Crypto Trading & Risk Management Protocol</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Your committed funds are utilized in algorithmic crypto market arbitrage. All profit distributions are guaranteed by our platform reserve fund with institutional risk management stop-loss rules.
              </p>
              <p className="text-[11px] text-amber-900 font-semibold pt-0.5" dir="rtl">
                آپ کے پیسوں سے ہم کرپٹو ٹریڈنگ کریں گے اور منافع روزانہ کلیم کے ذریعے دیں گے۔ رسک مینجمنٹ فالو کی جاتی ہے۔
              </p>
            </div>

            {/* Insufficient funds warning */}
            {(balances?.[selectedPlan.asset]?.available || 0) < selectedPlan.amount && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Insufficient balance. You need ${(selectedPlan.amount - (balances?.[selectedPlan.asset]?.available || 0)).toFixed(2)} more in your wallet to activate this plan.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={isActivating || (balances?.[selectedPlan.asset]?.available || 0) < selectedPlan.amount}
                className="px-6 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white font-bold text-xs shadow-md shadow-[#451A03]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isActivating ? 'Activating Plan...' : `Confirm & Lock $${selectedPlan.amount}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TRADING POLICY DETAILS MODAL                                      */}
      {/* ----------------------------------------------------------------- */}
      {showPolicyModal && (
        <Modal
          isOpen={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
          title="Crypto Trading, Return & Risk Management Policy"
          subtitle="Official Platform Terms & Operating Guidelines"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#451A03]" />
                <span>1. How Your Funds Are Traded (فنڈز کی کرپٹو ٹریڈنگ)</span>
              </h4>
              <p className="leading-relaxed">
                All client principal committed to active reward plans is pooled into high-liquidity cryptocurrency trading operations. Our trading desk executes spot market strategies, liquidity pool arbitrage, and quantitative cross-exchange arbitrage between tier-1 crypto venues.
              </p>
              <p className="leading-relaxed text-[#5C2B14] font-medium" dir="rtl">
                آپ لوگوں کے پیسوں سے ہم پروفیشنل کرپٹو ٹریڈنگ (Crypto Trading) کرتے ہیں اور اس سے حاصل ہونے والا تمام منافع روزانہ کلیم کی صورت میں واپس دیا جاتا ہے۔
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#EADBCE] space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#451A03]" />
                <span>2. The $5 → $11 Formula & Daily Claim Option ($11 کا فارمولا)</span>
              </h4>
              <p className="leading-relaxed">
                Under our starter tier, activating a $5.00 USDT plan yields a total return of <strong>$11.00 USDT</strong> by the end of the 7-day weekend cycle. Daily return claims ($1.5714/day) begin immediately on Day 1 (the exact day of plan activation). Every plan follows this proportional daily claim formula.
              </p>
              <p className="leading-relaxed text-[#5C2B14] font-medium" dir="rtl">
                $5 والا پلان ایکٹیو کرنے پر ویک اینڈ کے اختتام تک کل $11 کا ریٹرن ملتا ہے۔ روزانہ کلیم کرنے کا آپشن ملتا ہے تاکہ آخری دن تک تمام کلیمز کے بعد آپ کے پورے $11 بن چکے ہوں۔
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#451A03]" />
                <span>3. Guaranteed Payouts with Strict Risk Management (گارنٹی اور رسک مینجمنٹ)</span>
              </h4>
              <p className="leading-relaxed">
                Daily reward payouts are fully guaranteed and supported by our platform liquidity reserve. At the same time, we strictly enforce institutional risk management protocols: maximum loss per trade capped at 1.5%, multi-sig cold storage preservation, and dynamic position hedging.
              </p>
              <p className="leading-relaxed text-[#5C2B14] font-medium" dir="rtl">
                ریوارڈز ویسے تو گارنٹیڈ ہیں، لیکن ہم محفوظ ٹریڈنگ کے لیے سخت رسک مینجمنٹ (Risk Management) فالو کرتے ہیں تاکہ سرمایہ ہر لحاظ سے محفوظ رہے۔
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
