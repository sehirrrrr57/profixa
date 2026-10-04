import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { ArrowDownLeft, Check, X, RefreshCw, AlertCircle, Clock, ShieldCheck, User } from 'lucide-react';

export const AdminDeposits: React.FC = () => {
  const { showToast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeposits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDeposits();
      if (res.success) setDeposits(res.deposits);
    } catch (err) {
      console.warn('Failed to load deposits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleProcess = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(id);
    try {
      const res = await api.processDeposit(id, action);
      showToast(
        'success',
        `Deposit ${action === 'APPROVE' ? 'Approved & Credited' : 'Rejected'}`,
        res.message || `The user's balance and status have been updated.`
      );
      await loadDeposits();
    } catch (err: any) {
      showToast('error', 'Action failed', err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filtered = deposits.filter((tx) => {
    if (filter === 'ALL') return true;
    return tx.status === filter;
  });

  const pendingCount = deposits.filter((tx) => tx.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
              <ArrowDownLeft className="w-5 h-5 text-[#451A03]" />
            </span>
            <span>Deposit Approvals Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming user deposits across TRX, Aptos, and BEP-20. When approved, balance is instantly credited to that user's dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingCount} Pending Confirmation</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadDeposits}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-white p-1 border border-[#EADBCE] shadow-2xs max-w-md gap-1">
        {(['PENDING', 'CONFIRMED', 'REJECTED', 'ALL'] as const).map((tab) => (
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
            {tab === 'PENDING' ? `Pending (${pendingCount})` : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {isLoading ? 'Loading deposits...' : `No ${filter.toLowerCase()} deposits in the queue.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#EADBCE] text-slate-600 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Asset & Network</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Tx Hash / Proof</th>
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
                        {tx.network?.toUpperCase() || 'TRX'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      +${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[140px] truncate" title={tx.txHash}>
                      {tx.txHash || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={tx.status === 'CONFIRMED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {tx.status === 'CONFIRMED' ? 'Confirmed & Credited' : tx.status === 'PENDING' ? 'Pending Approval' : 'Rejected'}
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
                            <span>Confirm & Credit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcess(tx.id, 'REJECT')}
                            disabled={isProcessing === tx.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
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
