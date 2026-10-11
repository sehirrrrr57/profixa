import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { useToast } from '../ui/Toast';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { ReferralSummary, ReferredUser } from '../../types';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  QrCode,
  Award,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Send,
  Layers,
  HelpCircle,
  Download,
} from 'lucide-react';

export interface ReferralViewProps {
  onNavigate?: (view: string) => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onNavigate }) => {
  const { user, refreshBalances } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const fallbackReferralCode = (
    user?.referralCode ||
    user?.username ||
    user?.email?.split('@')[0] ||
    user?.id?.slice(0, 8) ||
    'PROFIXA'
  ).toUpperCase();

  const fallbackReferralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${fallbackReferralCode}`
    : `https://profixa.io/?ref=${fallbackReferralCode}`;

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const res = await api.getReferralSummary();
      if (res && res.success) {
        setSummary(res);
        generateQr(res.referralLink || fallbackReferralLink);
      } else {
        generateQr(fallbackReferralLink);
      }
    } catch (err) {
      console.warn('Error loading referral summary:', err);
      generateQr(fallbackReferralLink);
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async (text: string) => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: {
          dark: '#451A03',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Failed to generate QR code', e);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  const referralCode = summary?.referralCode || fallbackReferralCode;
  const referralLink = summary?.referralLink || fallbackReferralLink;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      showToast(
        'success',
        isUrdu ? 'لنک کاپی ہو گیا!' : 'Invitation Link Copied!',
        isUrdu ? 'اپنے دوستوں کو شیئر کریں اور بونس حاصل کریں۔' : 'Share with your partners to start accumulating referral bonuses.'
      );
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      showToast('error', 'Copy failed', 'Please copy link manually.');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      showToast(
        'success',
        isUrdu ? 'کوڈ کاپی ہو گیا!' : 'Referral Code Copied!',
        `Code: ${referralCode}`
      );
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      showToast('error', 'Copy failed', 'Please copy code manually.');
    }
  };

  const handleShareNative = async () => {
    const shareData = {
      title: 'Join Profixa - Smart Crypto Rewards',
      text: `Join Profixa and earn daily crypto returns on USDT! Register using my invitation code: ${referralCode}`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User dismissed share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join Profixa and earn daily crypto returns on USDT! Register using my invitation link:\n${referralLink}\nReferral Code: ${referralCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `Join Profixa and earn daily crypto returns on USDT! Register using my code: ${referralCode}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const handleClaimBonus = async () => {
    if ((summary?.pendingBonus || 0) <= 0) return;
    setIsClaiming(true);
    try {
      const res = await api.claimReferralBonus();
      showToast(
        'success',
        isUrdu ? 'بونس والیٹ میں منتقل ہو گیا!' : 'Commission Credited to Wallet!',
        res.message || (isUrdu ? 'کمیشن آپ کے والیٹ بیلنس میں شامل کر دیا گیا ہے۔' : 'Credited to your available USDT balance.')
      );
      await Promise.all([loadReferralData(), refreshBalances()]);
    } catch (err: any) {
      showToast('error', 'Claim Failed', err.message || 'Unable to claim referral commission.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Filter and search referred users
  const rawList: ReferredUser[] = summary?.referredUsers || [];
  const filteredUsers = rawList.filter((u) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'ACTIVE'
        ? u.hasActivePlan
        : !u.hasActivePlan;

    const matchesSearch =
      searchQuery.trim() === '' ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.activePlanName && u.activePlanName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const totalReferrals = summary?.totalReferrals ?? rawList.length;
  const activeReferrals = summary?.activeReferrals ?? rawList.filter((u) => u.hasActivePlan).length;
  const totalBonusEarned = summary?.totalBonusEarned ?? rawList.reduce((acc, u) => acc + (u.bonusEarned || 0), 0);
  const pendingBonus = summary?.pendingBonus ?? 0;
  const commissionRate = summary?.commissionRate ?? 5.0;
  const currentTier = summary?.currentTier ?? 'Bronze Member';

  return (
    <div className="space-y-6 pb-12">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HEADER SECTION                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#451A03]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.referrals.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t.referrals.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Claim Pending Bonus Button */}
        <div className="flex items-center gap-3">
          {pendingBonus > 0 && (
            <button
              type="button"
              onClick={handleClaimBonus}
              disabled={isClaiming}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>
                {isClaiming
                  ? 'Crediting...'
                  : `${isUrdu ? 'بونس کلیم کریں' : 'Claim'} $${pendingBonus.toFixed(2)} USDT`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareNative}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] text-xs font-bold transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#451A03]" />
            <span>{isUrdu ? 'شیئر کریں' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. INVITATION LINK & CODE CARD (HERO CALLOUT)                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white to-[#FDF8F5] p-6 sm:p-8 rounded-2xl border border-[#EADBCE] shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#451A03]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative">
          {/* Left Column: Link generator & copy inputs */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#451A03] text-white text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Earn up to 10% USDT Commission</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {isUrdu ? 'اپنا منفرد دعوتی لنک دوستوں کو بھیجیں' : 'Your Unique Partner Invitation Link'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                {isUrdu
                  ? 'جب بھی کوئی صارف آپ کے لنک سے شامل ہو کر کوئی ارننگ پلان ایکٹیو کرے گا، آپ کو فوری لائف ٹائم کمیشن بونس ملے گا۔'
                  : 'Invite friends and partners with your personal link to earn instant lifetime USDT commission on every earning plan they activate.'}
              </p>
            </div>

            {/* Input & Copy Row for Full Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {t.referrals.uniqueLink}
              </label>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#EADBCE] shadow-2xs">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-800 font-mono select-all outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-lg bg-[#451A03] hover:bg-[#341402] text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'کاپی لنک' : 'Copy Link')}</span>
                </button>
              </div>
            </div>

            {/* Code & Social Share Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#EADBCE] shadow-2xs">
                <span className="text-xs text-slate-500 font-semibold">{t.referrals.referralCode}:</span>
                <span className="text-xs sm:text-sm font-black text-[#451A03] font-mono tracking-wider">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-[#451A03] transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Share Channels */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] text-xs font-bold transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isUrdu ? 'کیو آر کوڈ' : 'View QR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Mini QR Preview Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#EADBCE] shadow-2xs text-center">
            {qrDataUrl ? (
              <div className="p-2 bg-white rounded-lg border border-[#EADBCE] shadow-2xs cursor-pointer group" onClick={() => setShowQrModal(true)}>
                <img
                  src={qrDataUrl}
                  alt="Referral QR Code"
                  className="w-36 h-36 object-contain rounded transition-transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="w-36 h-36 bg-[#FDF8F5] rounded-lg animate-pulse" />
            )}
            <p className="text-xs font-bold text-slate-800 mt-2.5">
              {t.referrals.scanQR}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Instant mobile registration on camera scan
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. PERFORMANCE STATS CARDS                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invited */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.referrals.totalReferrals}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalReferrals}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct Network Members</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Tier 1 Partners</span>
            <span className="text-[#451A03] font-bold">100% Direct</span>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.referrals.activeMembers}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeReferrals}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {totalReferrals > 0 ? `${Math.round((activeReferrals / totalReferrals) * 100)}% Conversion Rate` : 'No members yet'}
            </p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">With Active Plan</span>
            <span className="text-slate-700 font-semibold">{activeReferrals} / {totalReferrals}</span>
          </div>
        </div>

        {/* Total Commission Earned */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.referrals.totalCommission}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${totalBonusEarned.toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">USDT direct wallet credits</p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Unclaimed: ${pendingBonus.toFixed(2)}</span>
            {pendingBonus > 0 ? (
              <button
                type="button"
                onClick={handleClaimBonus}
                className="font-bold text-[#451A03] hover:underline cursor-pointer"
              >
                Claim →
              </button>
            ) : (
              <span className="text-slate-400">All Claimed</span>
            )}
          </div>
        </div>

        {/* Current Affiliate Tier */}
        <div className="bg-white p-5 rounded-2xl border border-[#EADBCE] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wide">{t.referrals.currentTier}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#451A03]" />
            </div>
          </div>
          <div className="my-3">
            <p className="text-xl sm:text-2xl font-black text-[#451A03] tracking-tight">
              {currentTier}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {commissionRate}% Lifetime Commission Rate
            </p>
          </div>
          <div className="pt-2 border-t border-[#EADBCE] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Tier Status</span>
            <span className="text-emerald-700 font-bold uppercase">Active Tier</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. TIER MILESTONES & REWARDS ARCHITECTURE                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-[#EADBCE] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Partner Commission Tiers</h3>
            <p className="text-xs text-slate-500">Automated rank promotion as your network expands</p>
          </div>
          <span className="text-xs font-bold text-[#451A03] bg-[#FDF8F5] px-3 py-1 rounded-lg border border-[#EADBCE]">
            Current Rate: {commissionRate}% Commission
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Bronze Member */}
          <div className={`p-4 rounded-xl border transition-all ${totalReferrals < 5 ? 'bg-[#FDF8F5] border-[#451A03] shadow-xs ring-1 ring-[#451A03]' : 'bg-white border-[#EADBCE]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">Bronze Member</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">5.0%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">1 - 4 Total Referrals</p>
            <ul className="text-[11px] text-slate-600 mt-3 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>5% Direct Plan Commission</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant Invitation Link & QR</span>
              </li>
            </ul>
          </div>

          {/* Silver Partner */}
          <div className={`p-4 rounded-xl border transition-all ${totalReferrals >= 5 && totalReferrals < 15 ? 'bg-[#FDF8F5] border-[#451A03] shadow-xs ring-1 ring-[#451A03]' : 'bg-white border-[#EADBCE]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">Silver Partner</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-900">7.5%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">5 - 14 Total Referrals</p>
            <ul className="text-[11px] text-slate-600 mt-3 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>7.5% Direct Plan Commission</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Priority Partner Support</span>
              </li>
            </ul>
          </div>

          {/* Gold Ambassador */}
          <div className={`p-4 rounded-xl border transition-all ${totalReferrals >= 15 ? 'bg-[#FDF8F5] border-[#451A03] shadow-xs ring-1 ring-[#451A03]' : 'bg-white border-[#EADBCE]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">Gold Ambassador</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">10.0%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">15+ Total Referrals</p>
            <ul className="text-[11px] text-slate-600 mt-3 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>10% Maximum Plan Commission</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>VIP Dedicated Account Desk</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. REFERRED NETWORK DISPLAY TABLE                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.referrals.networkTableTitle}</h3>
            <p className="text-xs text-slate-500">{t.referrals.networkTableSubtitle}</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FDF8F5] rounded-xl border border-[#EADBCE]">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white text-[#451A03] shadow-2xs border border-[#EADBCE]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.referrals.allMembers} ({rawList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filter === 'ACTIVE'
                  ? 'bg-white text-[#451A03] shadow-2xs border border-[#EADBCE]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.referrals.activeOnly} ({rawList.filter((u) => u.hasActivePlan).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filter === 'PENDING'
                  ? 'bg-white text-[#451A03] shadow-2xs border border-[#EADBCE]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.referrals.pendingOnly} ({rawList.filter((u) => !u.hasActivePlan).length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.referrals.searchMembers}
            className="w-full h-10 pl-10 pr-4 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none transition-colors"
          />
        </div>

        {/* Table Content */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-[#451A03]" />
            </div>
            <p className="text-sm font-bold text-slate-900">
              {searchQuery ? 'No matching members found' : t.referrals.noReferralsYet}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery ? 'Try adjusting your search criteria.' : t.referrals.noReferralsDesc}
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'دعوتی لنک کاپی کریں' : 'Copy Invitation Link'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADBCE] text-slate-400 font-semibold">
                  <th className="pb-3 px-3">{t.referrals.member}</th>
                  <th className="pb-3 px-3">Deposit Status</th>
                  <th className="pb-3 px-3">{t.referrals.planStatus}</th>
                  <th className="pb-3 px-3">Plan Amount</th>
                  <th className="pb-3 px-3">{t.referrals.kyc}</th>
                  <th className="pb-3 px-3">{t.referrals.bonusEarned}</th>
                  <th className="pb-3 px-3">{t.referrals.joinedDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBCE]">
                {filteredUsers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#FDF8F5] transition-colors">
                    {/* Member Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center font-bold text-[#451A03] text-xs shrink-0">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Deposit Status */}
                    <td className="py-3 px-3">
                      {member.hasDeposited ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Deposited (${(member.totalDeposited || 0).toFixed(2)})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>No Deposit</span>
                        </span>
                      )}
                    </td>

                    {/* Plan Status */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${member.hasActivePlan ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="font-semibold text-slate-800">
                          {member.activePlanName || 'No Active Plan'}
                        </span>
                      </div>
                    </td>

                    {/* Plan Amount */}
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {member.planAmount && member.planAmount > 0 ? `$${member.planAmount.toFixed(2)} USDT` : '—'}
                    </td>

                    {/* KYC Status */}
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          member.kycStatus === 'APPROVED'
                            ? 'success'
                            : member.kycStatus === 'PENDING_REVIEW'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {member.kycStatus}
                      </Badge>
                    </td>

                    {/* Bonus Credited */}
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        +${(member.bonusEarned || 0).toFixed(2)} USDT
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(member.joinedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* QR CODE FULL MODAL                                                */}
      {/* ----------------------------------------------------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">Invitation QR Code</h3>
            <p className="text-xs text-slate-500">
              Partners can scan this code with their phone camera to instantly sign up with your referral code.
            </p>

            <div className="p-4 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] inline-block mx-auto">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Referral QR Code"
                  className="w-48 h-48 mx-auto rounded"
                />
              )}
            </div>

            <div className="bg-[#FAF7F5] p-2.5 rounded-xl border border-[#EADBCE] font-mono text-xs text-slate-800 break-all">
              {referralLink}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {copiedLink ? 'Copied Link!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
