import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { ArrowUpRight, Check, X, RefreshCw, AlertCircle, Clock, Copy } from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminWithdrawals();
      if (res.success) setWithdrawals(res.withdrawals);
    } catch (err) {
      console.warn('Failed to load withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAddress = async (addr: string, id: string) => {
    if (!addr || addr === 'N/A') return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedId(id);
      showToast('success', 'Address Copied', 'Withdrawal destination address copied to clipboard.');
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      showToast('error', 'Copy failed', 'Please copy manually.');
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleProcess = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(id);
    try {
      const res = await api.processWithdrawal(id, action);
      showToast(
        'success',
        `Withdrawal ${action === 'APPROVE' ? 'Approved & Dispatched' : 'Rejected & Refunded'}`,
        res.message || 'Status updated.'
      );
      await loadWithdrawals();
    } catch (err: any) {
      showToast('error', 'Action failed', err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filtered = withdrawals.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.status === filter;
  });

  const pendingCount = withdrawals.filter((tx) => tx.status === 'PENDING').length;
  const confirmedCount = withdrawals.filter((tx) => tx.status === 'CONFIRMED').length;
  const rejectedCount = withdrawals.filter((tx) => tx.status === 'REJECTED').length;

  const tabLabels: Record<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED', string> = {
    ALL: `All (${withdrawals.length})`,
    PENDING: `Pending (${pendingCount})`,
    CONFIRMED: `Confirmed (${confirmedCount})`,
    REJECTED: `Rejected (${rejectedCount})`,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
              <ArrowUpRight className="w-5 h-5 text-[#451A03]" />
            </span>
            <span>Withdrawal Approvals Desk (TRC20 • Aptos • BEP20)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit and process outgoing user withdrawals across TRON (TRC20), Aptos, and BNB Smart Chain (BEP20). Approving confirms on-chain dispatch. Rejecting automatically refunds the user.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending Review</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadWithdrawals}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-white p-1 border border-[#EADBCE] shadow-2xs max-w-lg gap-1">
        {(['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[#451A03] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#FDF8F5]'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {isLoading ? 'Loading withdrawals...' : `No ${filter.toLowerCase()} withdrawals in the queue.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#EADBCE] text-slate-600 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Asset & Network</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Destination Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBCE]">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FDF8F5] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tx.userName || 'Member User'}</div>
                      <div className="text-[11px] text-slate-400">{tx.userEmail || tx.userId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#451A03]">{tx.asset}</span>
                      <span className="ml-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#FAF7F5] border border-[#EADBCE] text-slate-700">
                        {tx.network?.toUpperCase() || 'APTOS'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-[11px] text-slate-800 bg-[#FAF7F5] px-2 py-1 rounded-md border border-[#EADBCE] max-w-[210px] truncate select-all"
                          title={tx.destinationAddress || tx.toAddress || 'N/A'}
                        >
                          {tx.destinationAddress || tx.toAddress || 'N/A'}
                        </span>
                        {(tx.destinationAddress || tx.toAddress) && (
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(tx.destinationAddress || tx.toAddress, tx.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-[#EADBCE] hover:border-[#451A03] hover:text-[#451A03] text-slate-700 font-bold text-[10px] transition-colors shadow-2xs cursor-pointer shrink-0"
                            title="Copy destination address to clipboard"
                          >
                            {copiedId === tx.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#451A03]" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={tx.status === 'CONFIRMED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {tx.status === 'CONFIRMED' ? 'Approved & Dispatched' : tx.status === 'PENDING' ? 'Pending Approval' : 'Rejected & Refunded'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {tx.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleProcess(tx.id, 'APPROVE')}
                            disabled={isProcessing === tx.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm & Send</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcess(tx.id, 'REJECT')}
                            disabled={isProcessing === tx.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject & Refund</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Processed</span>
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
