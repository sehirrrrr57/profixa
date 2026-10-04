import React, { useState } from 'react';
import { useTranslation } from '../locales';
import { Logo } from './Logo';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Lock,
  Layers,
  Clock,
  ChevronDown,
  DollarSign,
  ChevronRight,
  Award,
  Wallet,
  Coins,
  FileCheck2,
  Gift,
  HelpCircle,
} from 'lucide-react';

export interface LandingPageProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onSelectPlanClick?: (amount: number) => void;
  onOpenLegal?: (slug: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onSignupClick,
  onOpenAuth,
  onOpenLegal,
}) => {
  const { t, language } = useTranslation();
  const isUrdu = language === 'ur';

  const [calculatorAmount, setCalculatorAmount] = useState<number>(5);
  const selectedAsset = 'USDT';

  const handleSignup = () => {
    if (onOpenAuth) onOpenAuth('REGISTER');
    else if (onSignupClick) onSignupClick();
  };

  const handleLogin = () => {
    if (onOpenAuth) onOpenAuth('LOGIN');
    else if (onLoginClick) onLoginClick();
  };

  const scrollToPlans = () => {
    const el = document.getElementById('plans');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // High-yield trading return plans according to user's exact specification:
  // $5 plan yields $11 total return at weekend/7 days end ($1.5714/day)
  const plans = [
    { id: 'p1', amount: 5, cycle: '7 Days', totalReturn: 11.0, daily: 1.5714, name: isUrdu ? '$5 اسٹارٹر' : '$5 Starter', tag: 'Weekend 2.2x' },
    { id: 'p2', amount: 10, cycle: '7 Days', totalReturn: 22.0, daily: 3.1428, name: isUrdu ? '$10 بیسک' : '$10 Basic', tag: 'Popular' },
    { id: 'p3', amount: 20, cycle: '14 Days', totalReturn: 48.0, daily: 3.4285, name: isUrdu ? '$20 اسٹینڈرڈ' : '$20 Standard', tag: 'Value' },
    { id: 'p4', amount: 45, cycle: '14 Days', totalReturn: 112.5, daily: 8.0357, name: isUrdu ? '$45 گروتھ' : '$45 Growth', popular: true, tag: 'Most Popular' },
    { id: 'p5', amount: 75, cycle: '21 Days', totalReturn: 202.5, daily: 9.6428, name: isUrdu ? '$75 ایڈوانسڈ' : '$75 Advanced', tag: 'High Yield' },
    { id: 'p6', amount: 100, cycle: '30 Days', totalReturn: 300.0, daily: 10.0, name: isUrdu ? '$100 پریمیئر' : '$100 Premier', tag: 'Elite 3x' },
    { id: 'p7', amount: 500, cycle: '30 Days', totalReturn: 1750.0, daily: 58.3333, name: isUrdu ? '$500 ادارہ جاتی' : '$500 Institutional', tag: 'Max 3.5x' },
  ];

  // Dynamic calculation for interactive reward simulator
  const activePlanForCalc = plans.slice().reverse().find((p) => calculatorAmount >= p.amount) || plans[0];
  const totalReturn = activePlanForCalc.totalReturn;
  const dailyReward = activePlanForCalc.daily;

  const faqs = [
    {
      q: isUrdu ? '$5 والے پلان سے کتنی واپسی ملے گی؟' : 'What is the total payout for the $5 Starter Plan?',
      a: isUrdu
        ? 'اگر آپ $5 کا پلان ایکٹیو کریں گے تو 7 دن (ہفتے کے اختتام) پر آپ کو کل $11.00 کا ریٹرن ملے گا۔ آپ روزانہ $1.5714 کلیم کر سکیں گے اور پہلے ہی دن سے آپ کا کلیم شروع ہو جائے گا۔'
        : 'Activating the $5 Starter Plan yields a total return of $11.00 at the end of the 7-day cycle. You can claim $1.5714 daily, beginning right away on Day 1.',
    },
    {
      q: isUrdu ? 'پلیٹ فارم یہ منافع کہاں سے پیدا کرتا ہے؟' : 'How does Profixa generate these returns?',
      a: isUrdu
        ? 'ہمارے ماہرین آپ کے جمع کردہ فنڈز سے کرپٹو مارکیٹ میں اسپاٹ اور آربٹریج ٹریڈنگ کرتے ہیں۔ حاصل ہونے والا ٹریڈنگ منافع روزانہ کلیم کے ذریعے آپ کے اکاؤنٹ میں بھیجا جاتا ہے، جس میں مکمل رسک مینجمنٹ فالو کی جاتی ہے۔'
        : 'User pooled funds are deployed into professional cryptocurrency spot trading, cross-exchange arbitrage, and market making. Profits are returned directly to your ledger while applying strict risk management.',
    },
    {
      q: isUrdu ? 'کیا ہر نئے یوزر کو $1 کا ویلکم بونس ملتا ہے؟' : 'Does every new user receive a $1.00 Welcome Bonus?',
      a: isUrdu
        ? 'جی ہاں! اکاؤنٹ بناتے ہی $1 کا بونس فوراً آپ کے اکاؤنٹ میں کریڈٹ ہو جاتا ہے۔ یہ بونس آپ کا کوئی بھی ایک پلان ایکٹیو ہونے کے بعد ودڈرا ہو سکے گا۔'
        : 'Yes! Every new user instantly receives a $1.00 USDT welcome bonus upon registration. It unlocks for withdrawal as soon as you activate any earning plan.',
    },
    {
      q: isUrdu ? 'کیا ڈیلی کلیم اسی دن شروع ہوتا ہے؟' : 'Does daily claim start on the very first day?',
      a: isUrdu
        ? 'جی بالکل! جس دن آپ پلان ایکٹیو کریں گے، اسی دن سے آپ کا پہلا دن شروع ہو جائے گا اور آپ اپنا پہلا یومیہ کلیم فوری حاصل کر سکیں گے۔'
        : 'Yes, absolutely! The moment you activate your plan, Day 1 starts immediately, making your first daily payout available right away.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-[#F5EDE8] selection:text-[#451A03]">
      {/* ------------------------------------------------------------------- */}
      {/* HERO SECTION - Crisp White Canvas with Dark Brown Accents           */}
      {/* ------------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-[#EADBCE] bg-gradient-to-b from-[#FDF8F5]/60 via-white to-white">
        {/* Soft dark brown ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#F5EDE8] rounded-full blur-3xl opacity-70" />
          <div className="absolute -top-20 right-1/4 w-96 h-96 bg-[#FAF1EC] rounded-full blur-3xl opacity-70" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Welcome Bonus Notice Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF8F5] border border-[#EADBCE] shadow-2xs mb-6 text-xs font-bold text-[#451A03]">
            <Gift className="w-4 h-4 text-[#451A03] animate-bounce" />
            <span>
              {isUrdu
                ? '🎁 تمام نئے صارفین کے لیے $1.00 مفت ویلکم بونس!'
                : '🎁 $1.00 Free Welcome Bonus for Every New User!'}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#451A03] text-white px-2 py-0.5 rounded-full">
              Instant
            </span>
          </div>

          {/* Bilingual Primary Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
            <span className="block">Smarter Crypto Rewards</span>
            <span className="block mt-2 bg-gradient-to-r from-[#451A03] via-[#78350F] to-[#92400E] bg-clip-text text-transparent font-black">
              سمارٹر کرپٹو ریوارڈز
            </span>
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 leading-relaxed mb-6 font-normal">
            {isUrdu
              ? 'پیشہ ورانہ کرپٹو ٹریڈنگ کے ذریعے منافع کی روزانہ واپسی۔ $5 لگائیں اور 7 دنوں میں $11 کا مکمل ریٹرن حاصل کریں۔'
              : 'Institutional cryptocurrency trading engine. Active plans generate daily profits — start with $5 and receive $11.00 total return by week end.'}
          </p>

          {/* Trading & Profit Policy Callout */}
          <div className="max-w-xl mx-auto mb-8 p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-xs text-[#451A03] flex items-center justify-center gap-2 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#451A03] shrink-0" />
            <span>
              {isUrdu
                ? 'پالیسی: آپ کے فنڈز سے کرپٹو ٹریڈنگ کی جاتی ہے اور منافع واپس دیا جاتا ہے۔ رسک مینجمنٹ لاگو ہے۔'
                : 'Policy: Platform pools funds for crypto trading and distributes daily profits with strict risk management.'}
            </span>
            <button
              onClick={() => onOpenLegal && onOpenLegal('trading-profit-policy')}
              className="font-bold underline ml-1 hover:text-black"
            >
              Read Policy →
            </button>
          </div>

          {/* Hero Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
            <button
              type="button"
              onClick={handleSignup}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] transition-all duration-150 shadow-lg shadow-[#451A03]/25 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-[#EADBCE]" />
              <span>{isUrdu ? 'اکاؤنٹ بنائیں (مفت)' : 'Create Account (Free)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={scrollToPlans}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-[#451A03] bg-white hover:bg-[#FDF8F5] active:bg-[#F5EDE8] border border-[#EADBCE] transition-all shadow-xs cursor-pointer"
            >
              <Layers className="w-5 h-5 text-[#451A03]" />
              <span>{isUrdu ? 'پلانز دیکھیں ($5 سے $11)' : 'Explore Plans ($5 → $11)'}</span>
            </button>
          </div>

          {/* Key Trust Badges with Dark Brown Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto pt-6 border-t border-[#EADBCE]">
            <div className="p-3.5 rounded-xl bg-white border border-[#EADBCE] shadow-2xs flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-[#451A03]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">$1 Free Bonus</span>
                <span className="text-[11px] text-slate-500">Every New User</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EADBCE] shadow-2xs flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#451A03]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">$5 → $11 Weekend</span>
                <span className="text-[11px] text-slate-500">Daily Payouts</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EADBCE] shadow-2xs flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#451A03]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Risk Guard</span>
                <span className="text-[11px] text-slate-500">Cold Vaults</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EADBCE] shadow-2xs flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#451A03]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Day 1 Claim</span>
                <span className="text-[11px] text-slate-500">Starts Instantly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* INTERACTIVE REWARD CALCULATOR SECTION                                */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-[#FDF8F5]/50 border-b border-[#EADBCE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#451A03] bg-[#FDF8F5] px-3 py-1 rounded-full border border-[#EADBCE]">
              Trading Return Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {isUrdu ? 'اپنے یومیہ کلیم اور منافع کا تخمینہ لگائیں' : 'Estimate Your Daily Return & Payouts'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {isUrdu
                ? '$5 پلان پر 7 دن بعد کل $11 ریٹرن ملتا ہے۔ نیچے چیک کریں۔'
                : 'Select an investment tier to calculate daily claims and guaranteed returns.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selected Plan Principal</span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  ${calculatorAmount} <span className="text-base font-bold text-[#451A03]">{selectedAsset}</span>
                </div>
              </div>

              {/* Asset Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF8F5] rounded-xl border border-[#EADBCE]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-extrabold text-[#451A03]">Tether (USDT)</span>
                <span className="text-[10px] text-slate-400 font-semibold">• TRC20, Aptos, BEP20</span>
              </div>
            </div>

            {/* Plan Selector Buttons in Calculator */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCalculatorAmount(p.amount)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
                    calculatorAmount === p.amount
                      ? 'bg-[#451A03] text-white border-[#451A03] shadow-xs'
                      : 'bg-white border-[#EADBCE] text-slate-700 hover:border-[#78350F]'
                  }`}
                >
                  ${p.amount}
                </button>
              ))}
            </div>

            {/* Calculations Grid with Dark Brown Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Clock className="w-4 h-4 text-[#451A03]" />
                  <span>Cycle Duration</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {activePlanForCalc.cycle}
                </div>
                <div className="text-xs text-[#451A03] font-bold mt-0.5">
                  Tier: {activePlanForCalc.name}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#451A03]" />
                  <span>Daily Claimable</span>
                </div>
                <div className="text-lg font-black text-[#451A03]">
                  +${dailyReward.toFixed(2)} {selectedAsset}/day
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Starts immediately on Day 1
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Award className="w-4 h-4 text-[#451A03]" />
                  <span>Total Cycle Payout</span>
                </div>
                <div className="text-lg font-black text-emerald-700">
                  ${totalReturn.toFixed(2)} {selectedAsset}
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-0.5">
                  {activePlanForCalc.tag} Return
                </div>
              </div>
            </div>

            {/* Action button in calculator */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSignup}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-[#451A03] hover:bg-[#341402] transition-all shadow-md shadow-[#451A03]/20 cursor-pointer"
              >
                <span>{isUrdu ? `$${calculatorAmount} کا پلان ایکٹیو کریں (کل منافع: $${totalReturn})` : `Start with $${calculatorAmount} (Total: $${totalReturn.toFixed(2)})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* PLANS OVERVIEW SECTION - White Cards with Dark Brown Highlights     */}
      {/* ------------------------------------------------------------------- */}
      <section id="plans" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#451A03] bg-[#FDF8F5] px-3 py-1 rounded-full border border-[#EADBCE]">
            Official Trading Return Plans
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            {isUrdu ? '$5 پر $11 منافع والے ریوارڈ پلانز' : 'Choose Your Investment Plan'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-2">
            {isUrdu
              ? 'ہر پلان پر روزانہ کلیم دستیاب ہوتا ہے اور آخری دن تک آپ کا پورا منافع مکمل ہو جاتا ہے۔'
              : 'Daily claims deliver your guaranteed return evenly across the cycle, starting Day 1.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => {
            const isPopular = p.popular;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl bg-white p-5 border transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 ${
                  isPopular
                    ? 'border-[#451A03] ring-2 ring-[#451A03]/20 shadow-md'
                    : 'border-[#EADBCE] shadow-2xs hover:border-[#78350F]'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#451A03] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FDF8F5] text-[#451A03] border border-[#EADBCE]">
                      {p.tag}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{p.cycle}</span>
                  </div>

                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-slate-900">${p.amount}</span>
                    <span className="text-xs font-bold text-[#451A03]">USDT</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mb-3">{p.name}</h3>

                  <div className="space-y-2 py-3 border-y border-[#EADBCE] text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#451A03]" />
                        Total Return:
                      </span>
                      <span className="font-black text-emerald-700">${p.totalReturn.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#451A03]" />
                        Daily Claim:
                      </span>
                      <span className="font-bold text-[#451A03]">${p.daily.toFixed(2)}/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#451A03]" />
                        Claim Start:
                      </span>
                      <span className="font-semibold text-slate-800">Day 1 Immediately</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleSignup}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPopular
                        ? 'bg-[#451A03] text-white hover:bg-[#341402] shadow-sm shadow-[#451A03]/20'
                        : 'bg-[#FDF8F5] text-[#451A03] hover:bg-[#F5EDE8] border border-[#EADBCE]'
                    }`}
                  >
                    <span>{isUrdu ? 'پلان منتخب کریں' : 'Activate Plan'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* FAQ SECTION - White Cards with Dark Brown Icons                     */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-16 md:py-20 bg-[#FDF8F5]/30 border-t border-[#EADBCE]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#451A03] bg-[#FDF8F5] px-3 py-1 rounded-full border border-[#EADBCE]">
              Questions & Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {isUrdu ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white border border-[#EADBCE] shadow-2xs space-y-2"
              >
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-[#451A03] shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 pl-7 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* FOOTER - Crisp White with Dark Brown Accents & Legal Links          */}
      {/* ------------------------------------------------------------------- */}
      <footer className="py-10 bg-white border-t border-[#EADBCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" variant="light" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <button
              onClick={() => onOpenLegal && onOpenLegal('trading-profit-policy')}
              className="text-[#451A03] font-bold hover:underline"
            >
              Trading & Profit Policy
            </button>
            <button
              onClick={() => onOpenLegal && onOpenLegal('privacy-policy')}
              className="hover:text-[#451A03] transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal && onOpenLegal('terms-and-conditions')}
              className="hover:text-[#451A03] transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal && onOpenLegal('risk-disclosure')}
              className="hover:text-[#451A03] transition-colors"
            >
              Risk Disclosure
            </button>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Profixa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
