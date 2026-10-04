import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Users,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  DollarSign,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateAdminView: (view: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateAdminView }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminOverview();
      if (res.success) setData(res);
    } catch (err) {
      console.warn('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const metrics = data?.metrics;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142033] tracking-tight">Admin Operations Console</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            System overview, platform liabilities, blockchain confirmations, and compliance queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="md" dot>
            Provider: {data?.systemStatus?.provider || 'Mock Sandbox'}
          </Badge>
          <Badge variant="neutral" size="md">
            Ledger Entries: {data?.systemStatus?.totalLedgerEntries || 0}
          </Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-semibold">Registered Accounts</span>
            <Users className="w-4 h-4 text-[#1769E0]" />
          </div>
          <p className="text-3xl font-extrabold text-[#142033]">{metrics?.totalUsers || 0}</p>
          <p className="text-[11px] text-[#159A6B] font-semibold">
            {metrics?.verifiedUsers || 0} KYC Verified
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-semibold">Pending KYC Reviews</span>
            <ShieldCheck className="w-4 h-4 text-[#E8A317]" />
          </div>
          <p className="text-3xl font-extrabold text-[#142033]">{metrics?.pendingKycCount || 0}</p>
          <button
            onClick={() => onNavigateAdminView('admin-kyc')}
            className="text-[11px] font-bold text-[#1769E0] hover:underline block"
          >
            Review KYC Queue →
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-semibold">Total Deposits Volume</span>
            <ArrowDownLeft className="w-4 h-4 text-[#159A6B]" />
          </div>
          <p className="text-3xl font-extrabold text-[#142033]">${metrics?.totalDepositsVolume || 0}</p>
          <p className="text-[11px] text-[#667085]">Across USDT networks (TRC20 • Aptos • BEP20)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5EAF0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-semibold">Withdrawals Volume</span>
            <ArrowUpRight className="w-4 h-4 text-[#D64545]" />
          </div>
          <p className="text-3xl font-extrabold text-[#142033]">${metrics?.totalWithdrawalsVolume || 0}</p>
          <span className="text-[11px] text-[#B87A05] font-semibold">
            {metrics?.pendingWithdrawalsCount || 0} Pending Approvals
          </span>
        </div>
      </div>

      {/* Active Liabilities & Risk Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5EAF0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#142033]">Reward Liability Calculation</h3>
            <Badge variant="teal" size="sm">Calculated from Ledger</Badge>
          </div>
          <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#667085]">Active Running Plans:</span>
              <span className="font-bold text-[#142033]">{metrics?.activePlansCount || 0} Active</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#667085]">Projected Platform Reward Liability:</span>
              <span className="font-extrabold text-[#159A6B]">${metrics?.rewardLiability || 0} USD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#667085]">Platform Solvency Status:</span>
              <span className="font-bold text-[#159A6B]">100% Fully Backed Ledger</span>
            </div>
          </div>
        </div>

        {/* Quick Administrative Tasks */}
        <div className="bg-white p-6 rounded-2xl border border-[#EADBCE] shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Direct Action Desk</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateAdminView('admin-users')}
              className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#451A03] text-left transition-all cursor-pointer"
            >
              <Users className="w-5 h-5 text-[#451A03] mb-2" />
              <p className="text-xs font-bold text-slate-900">User Accounts List</p>
              <p className="text-[10px] text-slate-500">Balance adjustments, roles</p>
            </button>
            <button
              onClick={() => onNavigateAdminView('admin-deposits')}
              className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#451A03] text-left transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-5 h-5 text-[#451A03] mb-2" />
              <p className="text-xs font-bold text-slate-900">Deposit Approvals</p>
              <p className="text-[10px] text-slate-500">Confirm & credit user deposits</p>
            </button>
            <button
              onClick={() => onNavigateAdminView('admin-withdrawals')}
              className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#451A03] text-left transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-5 h-5 text-[#451A03] mb-2" />
              <p className="text-xs font-bold text-slate-900">Withdrawal Approvals</p>
              <p className="text-[10px] text-slate-500">Audit & send Aptos payouts</p>
            </button>
            <button
              onClick={() => onNavigateAdminView('admin-kyc')}
              className="p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] hover:border-[#451A03] text-left transition-all cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-[#451A03] mb-2" />
              <p className="text-xs font-bold text-slate-900">KYC Review Desk</p>
              <p className="text-[10px] text-slate-500">Audit uploaded IDs & selfies</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
