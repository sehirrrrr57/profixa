import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { BlockchainNetworkId, Transaction } from '../../types/index';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  ShieldAlert,
  Info,
  Share2,
  AlertCircle,
  Download,
} from 'lucide-react';

interface NetworkOption {
  id: BlockchainNetworkId;
  name: string;
  badge: string;
  standard: string;
  desc: string;
  withdrawalFee: number;
  prefixExample: string;
  officialAddress: string;
  warningText: string;
  brandColor: string;
}

const SUPPORTED_USDT_NETWORKS: NetworkOption[] = [
  {
    id: 'trx',
    name: 'Tron',
    badge: 'TRC-20',
    standard: 'TRC20',
    desc: 'Ultra-low cost TRON TRC-20 network transfer',
    withdrawalFee: 1.0,
    prefixExample: 'TRC-20 (starts with T)',
    officialAddress: 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe',
    warningText: 'Only send Tron assets to this address. Other assets will be lost forever.',
    brandColor: '#EF0027',
  },
  {
    id: 'bep20',
    name: 'BNB Smart Chain',
    badge: 'BEP-20',
    standard: 'BEP20',
    desc: 'Binance Smart Chain ecosystem with rapid block times',
    withdrawalFee: 0.5,
    prefixExample: 'BEP-20 (starts with 0x)',
    officialAddress: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
    warningText: 'Only send BNB Smart Chain assets to this address. Other assets will be lost forever.',
    brandColor: '#F3BA2F',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    badge: 'ERC-20',
    standard: 'ERC20',
    desc: 'Ethereum Mainnet decentralized ERC-20 transfer',
    withdrawalFee: 3.5,
    prefixExample: 'ERC-20 (starts with 0x)',
    officialAddress: '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
    warningText: 'Only send Ethereum assets to this address. Other assets will be lost forever.',
    brandColor: '#627EEA',
  },
];

/**
 * Generates an authentic high-resolution QR code with the official centered network logo
 * (Tron, BNB Smart Chain, or Ethereum) with high error correction (30% redundancy).
 */
const generateBrandedQrCode = async (
  address: string,
  network: BlockchainNetworkId
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const size = 280; // Compact, high-density crisp resolution
  canvas.width = size;
  canvas.height = size;

  // Generate base QR with ErrorCorrectionLevel H (High 30%) and zero margin to remove wasted white space
  await QRCode.toCanvas(canvas, address, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 0,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const center = size / 2;
    const badgeSize = 56;
    const radius = 13;

    // Outer white shield container
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(
      center - (badgeSize + 8) / 2,
      center - (badgeSize + 8) / 2,
      badgeSize + 8,
      badgeSize + 8,
      radius + 3
    );
    ctx.fill();
    ctx.restore();

    if (network === 'trx' || network === 'tron') {
      // 1. Tron Red Badge
      ctx.fillStyle = '#EF0027';
      ctx.beginPath();
      ctx.roundRect(center - badgeSize / 2, center - badgeSize / 2, badgeSize, badgeSize, radius);
      ctx.fill();

      // Tron stylized white diamond/triangle
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const s = badgeSize * 0.58;
      const ox = center;
      const oy = center - 1;

      // Outer diamond
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.48);
      ctx.lineTo(ox + s * 0.44, oy - s * 0.16);
      ctx.lineTo(ox, oy + s * 0.54);
      ctx.lineTo(ox - s * 0.44, oy - s * 0.16);
      ctx.closePath();
      ctx.stroke();

      // Center vertical seam
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.48);
      ctx.lineTo(ox, oy + s * 0.54);
      ctx.stroke();

      // Center horizontal seam
      ctx.beginPath();
      ctx.moveTo(ox - s * 0.44, oy - s * 0.16);
      ctx.lineTo(ox + s * 0.44, oy - s * 0.16);
      ctx.stroke();
    } else if (network === 'bep20') {
      // 2. Binance Dark Badge
      ctx.fillStyle = '#181A20';
      ctx.beginPath();
      ctx.roundRect(center - badgeSize / 2, center - badgeSize / 2, badgeSize, badgeSize, radius);
      ctx.fill();

      // Yellow Binance Cube
      ctx.fillStyle = '#F3BA2F';
      const ox = center;
      const oy = center;
      const s = badgeSize * 0.52;

      // Center diamond
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.32);
      ctx.lineTo(ox + s * 0.32, oy);
      ctx.lineTo(ox, oy + s * 0.32);
      ctx.lineTo(ox - s * 0.32, oy);
      ctx.closePath();
      ctx.fill();

      // Top diamond
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.65);
      ctx.lineTo(ox + s * 0.16, oy - s * 0.45);
      ctx.lineTo(ox, oy - s * 0.52);
      ctx.lineTo(ox - s * 0.16, oy - s * 0.45);
      ctx.closePath();
      ctx.fill();

      // Bottom diamond
      ctx.beginPath();
      ctx.moveTo(ox, oy + s * 0.65);
      ctx.lineTo(ox + s * 0.16, oy + s * 0.45);
      ctx.lineTo(ox, oy + s * 0.52);
      ctx.lineTo(ox - s * 0.16, oy + s * 0.45);
      ctx.closePath();
      ctx.fill();

      // Left diamond
      ctx.beginPath();
      ctx.moveTo(ox - s * 0.65, oy);
      ctx.lineTo(ox - s * 0.45, oy - s * 0.16);
      ctx.lineTo(ox - s * 0.52, oy);
      ctx.lineTo(ox - s * 0.45, oy + s * 0.16);
      ctx.closePath();
      ctx.fill();

      // Right diamond
      ctx.beginPath();
      ctx.moveTo(ox + s * 0.65, oy);
      ctx.lineTo(ox + s * 0.45, oy - s * 0.16);
      ctx.lineTo(ox + s * 0.52, oy);
      ctx.lineTo(ox + s * 0.45, oy + s * 0.16);
      ctx.closePath();
      ctx.fill();
    } else if (network === 'ethereum') {
      // 3. Ethereum Blue Badge
      ctx.fillStyle = '#627EEA';
      ctx.beginPath();
      ctx.roundRect(center - badgeSize / 2, center - badgeSize / 2, badgeSize, badgeSize, radius);
      ctx.fill();

      const ox = center;
      const oy = center;
      const s = badgeSize * 0.62;

      // Top Crystal Half (Left white, Right light blue)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.48);
      ctx.lineTo(ox + s * 0.28, oy);
      ctx.lineTo(ox, oy + s * 0.14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#C0CBF6';
      ctx.beginPath();
      ctx.moveTo(ox, oy - s * 0.48);
      ctx.lineTo(ox - s * 0.28, oy);
      ctx.lineTo(ox, oy + s * 0.14);
      ctx.closePath();
      ctx.fill();

      // Bottom Crystal Half
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(ox, oy + s * 0.2);
      ctx.lineTo(ox + s * 0.28, oy + s * 0.06);
      ctx.lineTo(ox, oy + s * 0.48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#C0CBF6';
      ctx.beginPath();
      ctx.moveTo(ox, oy + s * 0.2);
      ctx.lineTo(ox - s * 0.28, oy + s * 0.06);
      ctx.lineTo(ox, oy + s * 0.48);
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/png');
};

export const WalletView: React.FC = () => {
  const { user, balances, refreshBalances } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetworkId>('trx');

  // Deposit address data
  const [depositData, setDepositData] = useState<{
    address: string;
    qrCode: string;
    minDeposit: number;
    requiredConfirmations: number;
  } | null>(null);
  const [isLoadingDeposit, setIsLoadingDeposit] = useState(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  // Manual Tx Hash submission state
  const [manualTxHash, setManualTxHash] = useState('');
  const [manualAmount, setManualAmount] = useState<string>('50');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  // Withdrawal state (Exclusively Aptos USDT)
  const [withdrawNetwork, setWithdrawNetwork] = useState<BlockchainNetworkId>('aptos');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Recent Wallet Transactions
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Load user transactions
  const loadTransactions = async () => {
    setIsLoadingTx(true);
    try {
      const res = await api.getTransactions();
      if (res.success) {
        setRecentTransactions(res.transactions.slice(0, 10));
      }
    } catch (e) {
      console.warn('Failed to load transactions:', e);
    } finally {
      setIsLoadingTx(false);
    }
  };

  // Load deposit address on network change
  const fetchDepositAddress = async (net: BlockchainNetworkId) => {
    setIsLoadingDeposit(true);
    try {
      const currentNet = SUPPORTED_USDT_NETWORKS.find((n) => n.id === net) || SUPPORTED_USDT_NETWORKS[0];
      const address = currentNet.officialAddress;

      // Generate the branded QR code with the centered network logo
      const qrDataUrl = await generateBrandedQrCode(address, net);

      setDepositData({
        address,
        qrCode: qrDataUrl,
        minDeposit: 5,
        requiredConfirmations: net === 'trx' ? 19 : net === 'bep20' ? 15 : 12,
      });

      // Synchronize with backend API in background
      api.getDepositAddress('USDT', net).catch(() => {});
    } catch (err: any) {
      console.error('Error generating deposit address QR:', err);
    } finally {
      setIsLoadingDeposit(false);
    }
  };

  useEffect(() => {
    fetchDepositAddress(selectedNetwork);
  }, [selectedNetwork]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedAddress(true);
    showToast('success', 'Address Copied!', 'USDT deposit address copied to clipboard.');
    setTimeout(() => setHasCopiedAddress(false), 3000);
  };

  const handleShare = async () => {
    const currentNet = SUPPORTED_USDT_NETWORKS.find((n) => n.id === selectedNetwork) || SUPPORTED_USDT_NETWORKS[0];
    const textToShare = `My Profixa USDT (${currentNet.name} - ${currentNet.badge}) Deposit Address:\n${depositData?.address || currentNet.officialAddress}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receive USDT (${currentNet.name})`,
          text: textToShare,
        });
      } catch (e) {
        // user dismissed share sheet
      }
    } else {
      copyToClipboard(depositData?.address || currentNet.officialAddress);
    }
  };

  // Submit Deposit -> Creates PENDING deposit for Admin approval
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Invalid Amount', 'Please specify a positive deposit amount.');
      return;
    }

    if (amt < (depositData?.minDeposit || 5)) {
      showToast('error', 'Minimum Deposit Notice', `Minimum deposit amount is $${depositData?.minDeposit || 5} USDT.`);
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const res = await api.submitDeposit({
        asset: 'USDT',
        network: selectedNetwork,
        amount: amt,
        txHash: manualTxHash.trim() || undefined,
        senderAddress: depositData?.address,
      });

      showToast(
        'success',
        'Deposit Request Queued',
        `Your deposit of $${amt.toFixed(2)} USDT is waiting for Admin confirmation. Your balance will be credited as soon as Admin confirms.`
      );
      setManualTxHash('');
      await refreshBalances();
      await loadTransactions();
    } catch (err: any) {
      showToast('error', 'Deposit Submission Failed', err.message);
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Handle Withdrawal
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid numeric withdrawal amount.');
      return;
    }

    if (user?.kycStatus !== 'APPROVED') {
      showToast('error', 'KYC Required', 'Identity verification is required before initiating withdrawals. Please complete KYC.');
      return;
    }

    const cleanAddr = withdrawAddress.trim();
    if (!cleanAddr) {
      showToast('error', 'Address Required', 'Please enter your personal Aptos USDT destination wallet address.');
      return;
    }

    // Strictly enforce Aptos address format (must start with 0x)
    if (!cleanAddr.startsWith('0x') || cleanAddr.length < 16) {
      showToast(
        'error',
        'Invalid Aptos Address',
        'Withdrawal is strictly supported on USDT (Aptos Network) only. Aptos addresses must start with "0x".'
      );
      return;
    }

    if (cleanAddr.startsWith('T') || cleanAddr.startsWith('t')) {
      showToast(
        'error',
        'Wrong Network Address',
        'You entered a TRON (TRC-20) address. Withdrawals are exclusively supported on the Aptos network. Please enter your Aptos (0x...) USDT address.'
      );
      return;
    }

    if (!withdrawPassword) {
      showToast('error', 'Password Required', 'Please enter your account password to authorize this withdrawal.');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await api.withdraw({
        asset: 'USDT',
        network: 'aptos',
        destinationAddress: cleanAddr,
        amount: amt,
        password: withdrawPassword,
      });

      showToast(
        'success',
        'Withdrawal Request Submitted',
        `Your withdrawal of $${amt.toFixed(2)} USDT via Aptos Network has been queued for Admin verification.`
      );
      setWithdrawAddress('');
      setWithdrawAmount('');
      setWithdrawPassword('');
      await refreshBalances();
      await loadTransactions();
    } catch (err: any) {
      showToast('error', 'Withdrawal Request Notice', err.message);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const usdtBalance = balances?.USDT;
  const availableBalance = usdtBalance?.available || 0;
  const lockedBalance = usdtBalance?.locked || 0;
  const pendingBalance = usdtBalance?.pending || 0;
  const totalBalance = availableBalance + lockedBalance;

  const currentNetConfig = SUPPORTED_USDT_NETWORKS.find((n) => n.id === selectedNetwork) || SUPPORTED_USDT_NETWORKS[0];
  const netWithdrawalFee = 0.50; // Aptos Network Gas Fee ($0.50 USDT)
  const platformFee = 0.50; // Platform Verification & Settlement Fee
  const totalFees = netWithdrawalFee + platformFee;
  const netWithdrawalAmount = Math.max(0, (parseFloat(withdrawAmount) || 0) - totalFees);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
              <Wallet className="w-5 h-5 text-[#451A03]" />
            </span>
            <span>Tether (USDT) Asset Wallet</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deposit and withdraw Tether (USDT) securely across Tron (TRC-20), BNB Smart Chain (BEP-20), and Ethereum (ERC-20).
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await refreshBalances();
            await loadTransactions();
            showToast('info', 'Refreshed', 'Wallet balances and transaction records updated.');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Wallet</span>
        </button>
      </div>

      {/* USDT Unified Balance Portfolio Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#EADBCE] shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-[#FDF8F5] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Primary Asset • Tether (USDT)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF7F5] border border-[#EADBCE] text-[10px] font-bold text-[#451A03]">
                TRC-20 • BEP-20 • ERC-20
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
                ${totalBalance.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-400">USDT</span>
            </div>
            <p className="text-xs text-slate-500">
              Equivalent Value: ≈ ${(totalBalance * 1.0).toFixed(2)} USD (Pegged 1:1 Stable Asset)
            </p>
          </div>

          {/* Quick Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Balance</span>
              <span className="text-sm font-black text-slate-900 font-mono">${availableBalance.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Locked in Plans</span>
              <span className="text-sm font-black text-[#451A03] font-mono">${lockedBalance.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE] col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Admin Review</span>
              <span className="text-sm font-black text-amber-600 font-mono">${pendingBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Container (Deposit & Withdrawal) */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-2xs overflow-hidden">
        {/* Tab Controls */}
        <div className="flex border-b border-[#EADBCE] bg-[#FAF7F5]">
          <button
            type="button"
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'deposit'
                ? 'border-[#451A03] text-[#451A03] bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-[#451A03]'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-[#451A03]" />
            <span>Deposit USDT</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'border-[#451A03] text-[#451A03] bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-[#451A03]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#451A03]" />
            <span>Withdraw USDT</span>
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* DEPOSIT TAB                                                       */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'deposit' && (
            <div className="space-y-6 pt-1">
              {/* Network Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2.5">
                  Select USDT Deposit Network
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SUPPORTED_USDT_NETWORKS.map((net) => {
                    const isSelected = selectedNetwork === net.id;
                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setSelectedNetwork(net.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-[#451A03] bg-[#FDF8F5] shadow-xs ring-1 ring-[#451A03]'
                            : 'border-[#EADBCE] bg-white hover:bg-[#FAF7F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: net.brandColor }}
                          >
                            {net.id === 'trx' && (
                              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white">
                                <path d="M28.4 8.7L3.6 4.2l9.7 23.6 15.1-19.1zm-4.7 2.1l-8 10.1-4.7-11.4 12.7 1.3z" />
                              </svg>
                            )}
                            {net.id === 'bep20' && (
                              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-[#181A20]">
                                <path d="M16 4.3l3.6 3.6-7.2 7.2-3.6-3.6L16 4.3zm6.6 6.6l3.6 3.6-3.6 3.6-3.6-3.6 3.6-3.6zm-13.2 0l3.6 3.6-3.6 3.6-3.6-3.6 3.6-3.6zM16 17.5l3.6 3.6-3.6 3.6-3.6-3.6 3.6-3.6zm-6.6 6.6l3.6 3.6-3.6 3.6L5.8 27.7l3.6-3.6zm13.2 0l3.6 3.6-3.6 3.6-3.6-3.6 3.6-3.6z" />
                              </svg>
                            )}
                            {net.id === 'ethereum' && (
                              <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white">
                                <path d="M16 3l-8 13.3 8 4.7 8-4.7L16 3zm0 19.8l-8-4.7 8 11 8-11-8 4.7z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">{net.name}</span>
                            <span className="text-[10px] text-slate-500">{net.badge}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#451A03] text-white'
                              : 'bg-[#FAF7F5] text-slate-600 border border-[#EADBCE]'
                          }`}
                        >
                          {net.standard}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Authentic Mobile Wallet Receive USDT Card (Compact, centered, clean) */}
              <div className="max-w-sm mx-auto bg-white rounded-2xl border border-[#EADBCE] p-4 sm:p-5 shadow-2xs space-y-3">
                {/* Header & Network Pill */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Receive USDT</h3>

                  {/* Network Badge Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F5] text-xs font-bold text-slate-800 border border-[#EADBCE]">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center p-0.5 shrink-0"
                      style={{ backgroundColor: currentNetConfig.brandColor }}
                    >
                      {currentNetConfig.id === 'trx' && (
                        <svg viewBox="0 0 32 32" className="w-2.5 h-2.5 fill-white">
                          <path d="M28.4 8.7L3.6 4.2l9.7 23.6 15.1-19.1zm-4.7 2.1l-8 10.1-4.7-11.4 12.7 1.3z" />
                        </svg>
                      )}
                      {currentNetConfig.id === 'bep20' && (
                        <div className="w-1.5 h-1.5 bg-[#181A20] rotate-45" />
                      )}
                      {currentNetConfig.id === 'ethereum' && (
                        <svg viewBox="0 0 32 32" className="w-2.5 h-2.5 fill-white">
                          <path d="M16 3l-8 13.3 8 4.7 8-4.7L16 3zm0 19.8l-8-4.7 8 11 8-11-8 4.7z" />
                        </svg>
                      )}
                    </div>
                    <span>{currentNetConfig.name} ({currentNetConfig.badge})</span>
                  </div>
                </div>

                {/* The Clean White Card containing QR Code & Address only */}
                <div className="bg-white rounded-xl flex flex-col items-center justify-center text-center">
                  {isLoadingDeposit || !depositData?.qrCode ? (
                    <div className="w-48 h-48 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#451A03]" />
                      <span>Generating QR code...</span>
                    </div>
                  ) : (
                    <img
                      src={depositData.qrCode}
                      alt="USDT Deposit QR"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto block rounded-lg shadow-2xs"
                    />
                  )}

                  {/* Address cleanly placed right under QR inside the card */}
                  <div className="mt-3 w-full bg-[#FAF7F5] p-2.5 rounded-xl border border-[#EADBCE]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">
                      Deposit Address ({currentNetConfig.badge})
                    </span>
                    <p className="font-mono font-bold text-xs text-slate-900 break-all select-all leading-tight">
                      {depositData?.address || currentNetConfig.officialAddress}
                    </p>
                  </div>
                </div>

                {/* Warning Callout Box */}
                <div className="p-2.5 rounded-xl bg-[#FDF3EB] border border-[#F5DEC8] flex items-start gap-2 text-[11px] text-[#78350F]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{currentNetConfig.warningText}</span>
                </div>

                {/* Copy and Share Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(depositData?.address || currentNetConfig.officialAddress)}
                    className="h-10 rounded-xl bg-[#FAF7F5] hover:bg-[#F5EDE8] border border-[#EADBCE] text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    {hasCopiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
                    <span>{hasCopiedAddress ? 'Copied' : 'Copy Address'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="h-10 rounded-xl bg-[#FAF7F5] hover:bg-[#F5EDE8] border border-[#EADBCE] text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Deposit Confirmation & Verification Form */}
              <form onSubmit={handleSubmitDeposit} className="p-6 bg-white rounded-2xl border border-[#EADBCE] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <ArrowDownLeft className="w-4 h-4 text-[#451A03]" />
                  <span>Submit Deposit Confirmation (TxID)</span>
                </div>
                <p className="text-xs text-slate-500">
                  After sending USDT to the address above, enter the deposit amount and your transaction hash (TxID). Once submitted, your deposit appears on the Admin Confirmation Desk for verification.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Deposit Amount (USDT) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        min={depositData?.minDeposit || 5}
                        step="any"
                        required
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="50"
                        className="w-full h-10 pl-7 pr-3 text-xs font-bold bg-[#FAF7F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Transaction Hash / TxID (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualTxHash}
                      onChange={(e) => setManualTxHash(e.target.value)}
                      placeholder="e.g. 0x8a92f0... or Tronscan hash"
                      className="w-full h-10 px-3 text-xs font-mono bg-[#FAF7F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDeposit}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-4 h-4 text-white" />
                  <span>{isSubmittingDeposit ? 'Submitting to Admin Desk...' : 'Submit Deposit for Admin Confirmation'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* WITHDRAWAL TAB (EXCLUSIVELY USDT APTOS NETWORK)                   */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawal} className="space-y-6 pt-2">
              {/* Exclusive Aptos Network Notice & Information Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-[#FAF7F5] border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#451A03] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      APT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">Tether (USDT) • Aptos Network</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          Active & Exclusive
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Rapid blockchain settlement with ultra-low gas fee ($0.50 USDT)
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Network</span>
                    <span className="text-xs font-black text-[#451A03] font-mono">Aptos (0x...)</span>
                  </div>
                </div>

                {/* Important Bilingual Notice */}
                <div className="p-3 bg-white/95 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1.5 shadow-2xs">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Exclusive Withdrawal Policy:</span>
                  </p>
                  <p className="text-[11px] text-slate-700 leading-relaxed pl-5.5">
                    Withdrawals on Profixa are strictly and exclusively processed on the <strong>USDT (Aptos Network)</strong>. Paste your personal Aptos USDT address below. Other networks (TRC-20 / BEP-20 / ERC-20) are NOT supported for withdrawals.
                  </p>
                  <p className="text-[11px] text-[#78350F] leading-relaxed pl-5.5 font-bold">
                    (رقم نکالنے (Withdrawal) کے لیے صرف اور صرف <strong>USDT (Aptos نیٹ ورک)</strong> کا ایڈریس لگے گا۔ باقی تمام نیٹ ورکس ودڈراول کے لیے ختم کر دیے گئے ہیں۔ برائے مہربانی اپنا ذاتی Aptos ایڈریس ہی پیسٹ کریں۔)
                  </p>
                </div>
              </div>

              {/* Destination Address Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Your Personal USDT (Aptos) Destination Wallet Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x... (Paste your Aptos USDT wallet address)"
                    className="w-full h-11 px-4 text-xs font-mono bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aptos addresses begin with <strong className="text-slate-900">0x</strong>. Ensure this is your personal Aptos USDT address (e.g. from Petra Wallet, Pontem, OKX, Binance Aptos deposit, or Trust Wallet Aptos).
                </p>
              </div>

              {/* Amount Input & Available Balance */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Withdrawal Amount (USDT) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.max(0, availableBalance - totalFees).toFixed(2))}
                    className="text-[11px] font-bold text-[#451A03] hover:underline cursor-pointer"
                  >
                    Max Available: ${availableBalance.toFixed(2)}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    required
                    min={5}
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Min $5.00 USDT"
                    className="w-full h-11 pl-8 pr-4 text-xs font-bold bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Security Authorization Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Account Password Authorization *
                </label>
                <input
                  type="password"
                  required
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter your account password to authorize this withdrawal"
                  className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
                />
              </div>

              {/* Fee Breakdown Card */}
              <div className="p-4 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Aptos Network Gas Fee:</span>
                  <span className="font-bold text-slate-900">${netWithdrawalFee.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Verification & Settlement:</span>
                  <span className="font-bold text-slate-900">${platformFee.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EADBCE] font-bold text-slate-900">
                  <span>Net Estimated Payout:</span>
                  <span className="text-[#451A03] font-black text-sm">
                    ${netWithdrawalAmount.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Submit Withdrawal Button */}
              <button
                type="submit"
                disabled={isSubmittingWithdraw}
                className="w-full py-3.5 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white font-bold text-sm shadow-md shadow-[#451A03]/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span>
                  {isSubmittingWithdraw
                    ? 'Processing Authorization...'
                    : 'Submit Withdrawal Request (USDT Aptos)'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#451A03]" />
            <h3 className="text-sm font-bold text-slate-900">Recent Wallet Ledger Records</h3>
          </div>
          <span className="text-xs text-slate-400">Real-time Accounting Ledger</span>
        </div>

        {isLoadingTx ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading wallet ledger...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No transactions found. Deposits and payouts will appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADBCE] text-slate-400 font-medium">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Asset</th>
                  <th className="pb-3">Network</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBCE]">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF7F5] transition-colors">
                    <td className="py-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        {tx.type === 'DEPOSIT' && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
                        {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />}
                        {tx.type === 'REWARD' && <span className="text-amber-600 font-bold">★</span>}
                        {tx.type === 'BONUS' && <span className="text-indigo-600 font-bold">🎁</span>}
                        <span>{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{tx.asset}</td>
                    <td className="py-3 uppercase text-slate-500 font-mono text-[11px]">
                      {tx.network || 'Internal'}
                    </td>
                    <td className="py-3 font-mono font-bold">
                      <span
                        className={
                          tx.type === 'DEPOSIT' || tx.type === 'REWARD' || tx.type === 'BONUS'
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }
                      >
                        {tx.type === 'WITHDRAWAL' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED' || tx.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'PENDING' || tx.status === 'PROCESSING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {tx.txHash ? (
                        <span className="truncate max-w-[120px] inline-block" title={tx.txHash}>
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                        </span>
                      ) : (
                        '—'
                      )}
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
