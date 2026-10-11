import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { CryptoAsset, User } from '../../types/index';
import { Search, Ban, CheckCircle2, DollarSign, ShieldAlert, User as UserIcon, RefreshCw } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Adjustment form state
  const [adjAsset, setAdjAsset] = useState<CryptoAsset>('USDT');
  const [adjAmount, setAdjAmount] = useState<string>('10');
  const [adjReason, setAdjReason] = useState<string>('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleSuspend = async (user: User) => {
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    try {
      const res = await api.toggleSuspendUser(user.id, `Administrative ${action} action`);
      showToast('success', `User ${res.isSuspended ? 'Suspended' : 'Unsuspended'}`, `Account status updated for ${user.email}`);
      await loadUsers();
    } catch (err: any) {
      showToast('error', 'Action failed', err.message);
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjustment) return;
    const amt = parseFloat(adjAmount);
    if (isNaN(amt) || !adjReason || adjReason.trim().length < 5) {
      showToast('error', 'Validation Error', 'Numeric amount and detailed reason are required.');
      return;
    }

    setIsSubmittingAdj(true);
    try {
      const res = await api.manualAdjustment(selectedUserForAdjustment.id, {
        asset: adjAsset,
        amount: amt,
        reason: adjReason,
      });
      showToast('success', 'Adjustment Applied', res.message);
      setSelectedUserForAdjustment(null);
      setAdjReason('');
      await loadUsers();
    } catch (err: any) {
      showToast('error', 'Adjustment failed', err.message);
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Administration & Accounts Desk</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          View all registered platform members, audit accounts, perform financial ledger balance adjustments, and manage security status.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EADBCE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#451A03]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by name or email..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl text-slate-900 outline-none focus:border-[#451A03]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            Total Accounts: <span className="font-bold text-slate-900">{users.length}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Accounts
          </Button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F5] border-b border-[#EADBCE] text-slate-600 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Available Balance</th>
                <th className="py-3 px-4">Total Deposited</th>
                <th className="py-3 px-4">Referral Info</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBCE]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#FDF8F5] transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{u.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-black text-slate-900 text-xs">
                      ${(u.balance !== undefined ? u.balance : 0).toFixed(2)} USDT
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {(u.totalDeposited && u.totalDeposited > 0) ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ${u.totalDeposited.toFixed(2)} USDT
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">No Deposits</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-mono text-[11px] text-slate-800 font-semibold">
                        Code: <span className="text-[#451A03] font-bold">{u.referralCode || '—'}</span>
                      </div>
                      {u.referredByName && (
                        <div className="text-[10px] text-slate-500">
                          Invited by: <span className="font-semibold text-slate-700">{u.referredByName}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        u.kycStatus === 'APPROVED'
                          ? 'success'
                          : u.kycStatus === 'PENDING_REVIEW'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {u.kycStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isSuspended ? (
                      <Badge variant="danger" size="sm">Suspended</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedUserForAdjustment(u)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FDF8F5] hover:bg-[#F5EDE8] border border-[#EADBCE] text-[#451A03] font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Adjust Balance
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(u)}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        u.isSuspended
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Balance Adjustment Modal */}
      {selectedUserForAdjustment && (
        <Modal
          isOpen={!!selectedUserForAdjustment}
          onClose={() => setSelectedUserForAdjustment(null)}
          title="Manual Ledger Balance Adjustment"
          subtitle={`Adjust ledger entry for ${selectedUserForAdjustment.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleManualAdjustment} className="space-y-4">
            <div className="p-3.5 bg-[#E8A317]/10 border border-[#E8A317]/25 rounded-xl text-xs text-[#B87A05]">
              Warning: Direct balance adjustments record an immutable 'ADJUSTMENT' ledger entry and write an administrative audit log with your signature.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#142033] mb-1">Select Asset</label>
              <select
                value={adjAsset}
                onChange={(e) => setAdjAsset(e.target.value as CryptoAsset)}
                className="w-full h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl font-bold"
              >
                <option value="USDT">USDT (Tether)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#142033] mb-1">
                Adjustment Amount (Positive to credit, Negative to debit)
              </label>
              <input
                type="number"
                step="any"
                required
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="w-full h-10 px-3 text-xs bg-white border border-[#E5EAF0] rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#142033] mb-1">
                Administrative Justification Reason (Required for Audit)
              </label>
              <textarea
                required
                rows={3}
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Detailed explanation: e.g. Customer support reimbursement for unconfirmed gas reorg..."
                className="w-full p-3 text-xs bg-white border border-[#E5EAF0] rounded-xl outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setSelectedUserForAdjustment(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmittingAdj}>
                Post Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
