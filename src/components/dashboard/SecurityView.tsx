import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { Lock, Shield, Plus, Trash2, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { CryptoAsset, BlockchainNetworkId } from '../../types/index';

export const SecurityView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA toggle
  const [isToggling2FA, setIsToggling2FA] = useState(false);

  // Connected wallets
  const [wallets, setWallets] = useState<any[]>([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAsset, setNewWalletAsset] = useState<CryptoAsset>('USDT');
  const [newWalletNet, setNewWalletNet] = useState<BlockchainNetworkId>('polygon');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [isAddingWallet, setIsAddingWallet] = useState(false);

  const loadWallets = async () => {
    try {
      const res = await api.getConnectedWallets();
      if (res.success) setWallets(res.wallets);
    } catch (err) {
      console.warn('Failed to load wallets:', err);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      showToast('success', 'Password Updated', 'Your security password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Password update failed', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setIsToggling2FA(true);
    try {
      const res = await api.toggle2FA();
      showToast('success', '2FA Updated', res.message);
      await refreshUser();
    } catch (err: any) {
      showToast('error', '2FA toggle failed', err.message);
    } finally {
      setIsToggling2FA(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingWallet(true);
    try {
      await api.addConnectedWallet({
        asset: newWalletAsset,
        network: newWalletNet,
        address: newWalletAddress,
        label: newWalletLabel,
      });
      showToast('success', 'Wallet Connected', 'Address saved for fast withdrawals.');
      setNewWalletAddress('');
      setNewWalletLabel('');
      setShowAddWallet(false);
      await loadWallets();
    } catch (err: any) {
      showToast('error', 'Failed to add wallet', err.message);
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    try {
      await api.removeConnectedWallet(id);
      showToast('info', 'Wallet Removed');
      await loadWallets();
    } catch (err: any) {
      showToast('error', 'Failed to delete wallet', err.message);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142033] tracking-tight">{t.nav.securitySettings}</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Configure multi-factor authentication, change password, and manage withdrawal destinations.
        </p>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1769E0]/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[#1769E0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#142033]">Two-Factor Authentication (2FA)</h3>
              <Badge variant={user?.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-[#667085] mt-1 max-w-md">
              Protect your account by requiring an additional verification factor on sign-in and withdrawals.
            </p>
          </div>
        </div>
        <Button
          variant={user?.twoFactorEnabled ? 'danger' : 'primary'}
          size="sm"
          onClick={handleToggle2FA}
          isLoading={isToggling2FA}
        >
          {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </Button>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EAF0]">
          <KeyRound className="w-5 h-5 text-[#1769E0]" />
          <h3 className="text-sm font-bold text-[#142033]">Change Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[#142033] mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 text-xs bg-white border border-[#E5EAF0] rounded-xl focus:border-[#1769E0] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142033] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 text-xs bg-white border border-[#E5EAF0] rounded-xl focus:border-[#1769E0] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142033] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 text-xs bg-white border border-[#E5EAF0] rounded-xl focus:border-[#1769E0] outline-none"
            />
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Connected Withdrawal Wallets */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EAF0]">
          <div>
            <h3 className="text-sm font-bold text-[#142033]">Saved Withdrawal Addresses</h3>
            <p className="text-xs text-[#667085]">Pre-verified destinations for faster withdrawals</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddWallet(!showAddWallet)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Address
          </Button>
        </div>

        {showAddWallet && (
          <form onSubmit={handleAddWallet} className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] space-y-3">
            <h4 className="text-xs font-bold text-[#142033]">Connect New Withdrawal Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">Asset</label>
                <select
                  value={newWalletAsset}
                  onChange={(e) => setNewWalletAsset(e.target.value as CryptoAsset)}
                  className="w-full h-9 px-3 text-xs bg-white border border-[#E5EAF0] rounded-lg"
                >
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#667085] mb-1">Network</label>
                <select
                  value={newWalletNet}
                  onChange={(e) => setNewWalletNet(e.target.value as BlockchainNetworkId)}
                  className="w-full h-9 px-3 text-xs bg-white border border-[#E5EAF0] rounded-lg"
                >
                  <option value="trx">TRON (TRC-20)</option>
                  <option value="aptos">Aptos Network</option>
                  <option value="bep20">BNB Smart Chain (BEP-20)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">Wallet Address</label>
              <input
                type="text"
                required
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="0x... or T..."
                className="w-full h-9 px-3 text-xs font-mono bg-white border border-[#E5EAF0] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#667085] mb-1">Label (e.g. Ledger Cold Storage)</label>
              <input
                type="text"
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                placeholder="My Hardware Wallet"
                className="w-full h-9 px-3 text-xs bg-white border border-[#E5EAF0] rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddWallet(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isAddingWallet}>
                Save Address
              </Button>
            </div>
          </form>
        )}

        <div className="divide-y divide-[#E5EAF0]">
          {wallets.length === 0 ? (
            <p className="py-4 text-xs text-[#667085] text-center">No saved withdrawal addresses.</p>
          ) : (
            wallets.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#142033]">{w.label}</span>
                    <Badge variant="neutral" size="sm">{w.asset} ({w.network})</Badge>
                  </div>
                  <p className="text-[11px] font-mono text-[#667085] mt-0.5">{w.address}</p>
                </div>
                <button
                  onClick={() => handleDeleteWallet(w.id)}
                  className="p-1.5 text-[#D64545] hover:bg-[#D64545]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
