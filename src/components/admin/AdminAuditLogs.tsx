import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RefreshCw, Search, Shield } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      const res = await api.getAdminAuditLogs();
      if (res.success) setLogs(res.auditLogs || res.logs || []);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
      (l.adminEmail && l.adminEmail.toLowerCase().includes(search.toLowerCase())) ||
      ((l.targetType || l.targetEntity || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142033] tracking-tight">Administrative Audit Logs</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Immutable tracking of all operational actions, KYC approvals, manual adjustments, and role updates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, administrator, or target entity..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#142033] outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#667085] font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="py-3.5 px-4 text-[#667085] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#142033] block">{log.adminEmail}</span>
                    <span className="text-[10px] text-[#667085] font-mono">{log.adminId.substring(0, 8)}...</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="neutral" size="sm">{log.action}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#1769E0]">
                    {log.targetType || log.targetEntity || 'System'}: {log.targetId ? `${log.targetId.substring(0, 8)}...` : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-[#475467] max-w-xs truncate text-[11px]">
                    {log.metadata
                      ? JSON.stringify(log.metadata)
                      : log.beforeState || log.afterState
                      ? `${log.beforeState || ''} → ${log.afterState || ''}`
                      : 'Audit record logged'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
