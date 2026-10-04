import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';

export const AdminLedger: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const loadLedger = async () => {
    try {
      const res = await api.getAdminLedger();
      if (res.success) setEntries(res.ledger || res.entries || []);
    } catch (err) {
      console.warn('Failed to load ledger:', err);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const safeEntries = Array.isArray(entries) ? entries : [];
  const filteredEntries = safeEntries.filter((e) => {
    const matchesSearch =
      (e.id && e.id.toLowerCase().includes(search.toLowerCase())) ||
      (e.userId && e.userId.toLowerCase().includes(search.toLowerCase())) ||
      (e.referenceId && e.referenceId.toLowerCase().includes(search.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'ALL' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142033] tracking-tight">Immutable Financial Ledger</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Strict append-only double-entry audit records. Balances are derived dynamically by aggregating entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" size="sm" dot>Append-Only Verified</Badge>
          <Button variant="outline" size="sm" onClick={loadLedger} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-xs flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Entry ID, User ID or Ref..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#142033] outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl text-[#142033] outline-none font-medium"
        >
          <option value="ALL">All Ledger Events</option>
          <option value="DEPOSIT">DEPOSIT</option>
          <option value="WITHDRAWAL">WITHDRAWAL</option>
          <option value="REWARD">REWARD</option>
          <option value="PLAN_LOCK">PLAN_LOCK</option>
          <option value="PLAN_RELEASE">PLAN_RELEASE</option>
          <option value="FEE">FEE</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
          <option value="BONUS">BONUS</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#667085] font-semibold">
                <th className="py-3 px-4">Entry ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Idempotency Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0] font-mono text-[11px]">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#142033]">{e.id.substring(0, 10)}...</td>
                  <td className="py-3 px-4 text-[#667085]">
                    {new Date(e.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-[#1769E0]">{e.userId.substring(0, 8)}...</td>
                  <td className="py-3 px-4 font-sans font-bold">
                    <Badge variant="neutral" size="sm">{e.type}</Badge>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold">{e.asset}</td>
                  <td className="py-3 px-4 font-bold">
                    <span
                      className={
                        e.type === 'WITHDRAWAL' || e.type === 'PLAN_LOCK' || e.type === 'FEE'
                          ? 'text-[#D64545]'
                          : 'text-[#159A6B]'
                      }
                    >
                      {e.type === 'WITHDRAWAL' || e.type === 'PLAN_LOCK' || e.type === 'FEE' ? '-' : '+'}
                      ${e.amount.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#667085]">{e.referenceId || 'N/A'}</td>
                  <td className="py-3 px-4 text-[#98A2B3] max-w-[140px] truncate">{e.idempotencyKey}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
