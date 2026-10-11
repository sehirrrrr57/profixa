import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { Transaction } from '../../types/index';
import {
  ArrowLeftRight,
  Download,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const loadTransactions = async () => {
    try {
      const res = await api.getTransactions({
        type: typeFilter,
        asset: assetFilter,
        status: statusFilter,
        search: searchQuery,
      });
      if (res.success) setTransactions(res.transactions);
    } catch (err) {
      console.warn('Failed to load transactions:', err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, assetFilter, statusFilter, searchQuery]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('profixa_token') || localStorage.getItem('cryptic_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/transactions/export', { headers });
      if (!res.ok) throw new Error('Failed to export transactions CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profixa_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.warn('Export CSV failed:', e);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142033] tracking-tight">{t.transactions.title}</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">{t.transactions.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4 text-[#1769E0]" />}
        >
          {t.transactions.exportCsv}
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, hash, or description..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#142033] outline-none focus:border-[#1769E0]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl text-[#142033] outline-none font-medium"
        >
          <option value="ALL">All Types</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="REWARD">Reward</option>
          <option value="PLAN_LOCK">Plan Commitment</option>
          <option value="PLAN_RELEASE">Plan Release</option>
          <option value="BONUS">Welcome Bonus</option>
          <option value="FEE">Network Fee</option>
        </select>

        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className="h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl text-[#142033] outline-none font-medium"
        >
          <option value="ALL">Asset: USDT (Tether)</option>
          <option value="USDT">USDT Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl text-[#142033] outline-none font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#667085]">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#667085] font-semibold">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Asset & Network</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tx Hash / Ref</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#142033]">
                      <span className="flex items-center gap-1.5">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#142033]">{tx.asset}</span>
                      {tx.network && (
                        <span className="text-[10px] text-[#667085] block uppercase">
                          {tx.network}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={
                          tx.type === 'WITHDRAWAL' || tx.type === 'PLAN_LOCK' || tx.type === 'FEE'
                            ? 'text-[#D64545]'
                            : 'text-[#159A6B]'
                        }
                      >
                        {tx.type === 'WITHDRAWAL' || tx.type === 'PLAN_LOCK' || tx.type === 'FEE'
                          ? '-'
                          : '+'}
                        ${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#667085]">
                      {tx.txHash ? `${tx.txHash.substring(0, 10)}...` : tx.id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-xs font-semibold text-[#1769E0] hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Transaction Audit Record"
          subtitle="Cryptographic verification and ledger entry details."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#667085]">Event ID:</span>
                <span className="font-mono text-[#142033]">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Classification:</span>
                <span className="font-bold text-[#142033]">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Asset & Amount:</span>
                <span className="font-extrabold text-[#142033]">
                  {selectedTx.amount.toFixed(4)} {selectedTx.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Network:</span>
                <span className="font-semibold text-[#142033] uppercase">{selectedTx.network || 'Internal Ledger'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Network & Platform Fee:</span>
                <span className="font-semibold text-[#142033]">${selectedTx.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Verification Status:</span>
                <Badge variant={selectedTx.status === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                  {selectedTx.status}
                </Badge>
              </div>
            </div>

            {selectedTx.txHash && (
              <div>
                <label className="block text-[#667085] mb-1 font-semibold">
                  Blockchain Transaction Hash
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedTx.txHash}
                    className="w-full h-9 px-3 font-mono bg-[#F7F9FC] border border-[#E5EAF0] rounded-lg text-[11px] text-[#142033] outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyHash(selectedTx.txHash!)}
                    icon={copiedHash ? <Check className="w-3.5 h-3.5 text-[#159A6B]" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedHash ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5EAF0] flex justify-end">
              <Button variant="primary" size="md" onClick={() => setSelectedTx(null)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
