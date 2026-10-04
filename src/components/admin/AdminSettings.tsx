import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { Settings, Shield, AlertTriangle, Save, Sliders, CheckCircle2 } from 'lucide-react';
import { SystemSettings } from '../../types/index';

export const AdminSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      if (res.success && res.settings) {
        setSettings({
          maintenanceMode: res.settings.maintenanceMode ?? false,
          allowNewRegistrations: res.settings.allowNewRegistrations ?? true,
          minDepositUSDT: res.settings.minDepositUSDT ?? 5,
          minDepositUSDC: res.settings.minDepositUSDC ?? 5,
          withdrawalPlatformFeeUSDT: res.settings.withdrawalPlatformFeeUSDT ?? 1.0,
          withdrawalPlatformFeeUSDC: res.settings.withdrawalPlatformFeeUSDC ?? 1.0,
          requireAdminWithdrawalApproval: res.settings.requireAdminWithdrawalApproval ?? true,
          blockchainProviderMode: res.settings.blockchainProviderMode ?? 'mock',
          depositAddresses: {
            trx: res.settings.depositAddresses?.trx || 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe',
            bep20: res.settings.depositAddresses?.bep20 || '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
            ethereum: res.settings.depositAddresses?.ethereum || '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85',
            aptos: res.settings.depositAddresses?.aptos || '0x8fa9c44b36021fdb934ce3c8524a1b02de29ea75f458e0a1334c26788db3d4ee',
          },
          welcomeBonusConfig: {
            isEnabled: res.settings.welcomeBonusConfig?.isEnabled ?? true,
            maxAmount: res.settings.welcomeBonusConfig?.maxAmount ?? 1.0,
            requiresKYC: res.settings.welcomeBonusConfig?.requiresKYC ?? true,
            requiresEmailVerification: res.settings.welcomeBonusConfig?.requiresEmailVerification ?? false,
            minDepositRequired: res.settings.welcomeBonusConfig?.minDepositRequired ?? 0,
            description: res.settings.welcomeBonusConfig?.description ?? 'Up to $1.00 welcome bonus.',
          },
        });
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await api.updateAdminSettings(settings);
      showToast('success', 'Settings Saved', res.message || 'System parameters updated successfully.');
      await loadSettings();
    } catch (err: any) {
      showToast('error', 'Failed to save settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
            <Sliders className="w-5 h-5 text-[#451A03]" />
          </span>
          <span>System & Platform Parameters</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure minimum deposits, withdrawal platform fees, welcome bonuses, and operational switches.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Maintenance & Registration Switches */}
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Platform Operational Switches</h3>
          
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Maintenance Mode</span>
                <Badge variant={settings.maintenanceMode ? 'danger' : 'success'} size="sm">
                  {settings.maintenanceMode ? 'Active (Restricted)' : 'Operational'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Restrict user operations for scheduled blockchain maintenance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.maintenanceMode
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 border border-[#EADBCE] hover:bg-[#F5EDE8]'
              }`}
            >
              {settings.maintenanceMode ? 'Disable' : 'Enable'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Allow New Registrations</span>
                <Badge variant={settings.allowNewRegistrations ? 'success' : 'danger'} size="sm">
                  {settings.allowNewRegistrations ? 'Open' : 'Closed'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enable or pause onboarding new client member accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, allowNewRegistrations: !settings.allowNewRegistrations })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.allowNewRegistrations
                  ? 'bg-[#451A03] text-white'
                  : 'bg-white text-slate-700 border border-[#EADBCE] hover:bg-[#F5EDE8]'
              }`}
            >
              {settings.allowNewRegistrations ? 'Enabled' : 'Paused'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Require Admin Approval on Withdrawals</span>
                <Badge variant={settings.requireAdminWithdrawalApproval ? 'warning' : 'neutral'} size="sm">
                  {settings.requireAdminWithdrawalApproval ? 'Strict Review' : 'Auto'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All Aptos withdrawals must be approved in Admin Desk before on-chain dispatch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, requireAdminWithdrawalApproval: !settings.requireAdminWithdrawalApproval })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.requireAdminWithdrawalApproval
                  ? 'bg-[#451A03] text-white'
                  : 'bg-white text-slate-700 border border-[#EADBCE] hover:bg-[#F5EDE8]'
              }`}
            >
              {settings.requireAdminWithdrawalApproval ? 'Enforced' : 'Off'}
            </button>
          </div>
        </div>

        {/* Financial Limits & Fees Card */}
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Financial Limits & Platform Fees</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Min Deposit USDT ($)
              </label>
              <input
                type="number"
                min="1"
                value={settings.minDepositUSDT}
                onChange={(e) => setSettings({ ...settings, minDepositUSDT: parseFloat(e.target.value) || 0 })}
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Withdrawal Platform Fee USDT ($)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.withdrawalPlatformFeeUSDT}
                onChange={(e) => setSettings({ ...settings, withdrawalPlatformFeeUSDT: parseFloat(e.target.value) || 0 })}
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Platform Deposit Addresses (USDT Networks) */}
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Platform USDT Deposit Addresses & Vaults</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured recipient addresses and QR codes for user deposits across the 3 supported networks.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                TRON (TRC20) USDT Address *
              </label>
              <input
                type="text"
                value={settings.depositAddresses?.trx || 'TF87mPXTDpV3d6CTJ4x8Ubzy3e2gJirJNe'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    depositAddresses: {
                      ...settings.depositAddresses,
                      trx: e.target.value.trim(),
                      aptos: settings.depositAddresses?.aptos || '0x8fa9c44b36021fdb934ce3c8524a1b02de29ea75f458e0a1334c26788db3d4ee',
                      bep20: settings.depositAddresses?.bep20 || '0x328A94De712A8Fe6B688EbA071E57C3eB59d64F7',
                    },
                  })
                }
                className="w-full h-11 px-4 font-mono text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                BNB Smart Chain (BEP20) USDT Address *
              </label>
              <input
                type="text"
                value={settings.depositAddresses?.bep20 || '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    depositAddresses: {
                      ...settings.depositAddresses,
                      bep20: e.target.value.trim(),
                    },
                  })
                }
                className="w-full h-11 px-4 font-mono text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ethereum (ERC20) USDT Address *
              </label>
              <input
                type="text"
                value={settings.depositAddresses?.ethereum || '0x2Edb4F3f21ab754d78EC66dF0e1DCf7E4B8bCC85'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    depositAddresses: {
                      ...settings.depositAddresses,
                      ethereum: e.target.value.trim(),
                    },
                  })
                }
                className="w-full h-11 px-4 font-mono text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Welcome Bonus Engine Configuration */}
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Welcome Registration Bonus Engine</h3>
              <p className="text-xs text-slate-500 mt-0.5">Complimentary bonus credited on registration</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  welcomeBonusConfig: {
                    ...settings.welcomeBonusConfig,
                    isEnabled: !settings.welcomeBonusConfig?.isEnabled,
                  },
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.welcomeBonusConfig?.isEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-[#EADBCE]'
              }`}
            >
              {settings.welcomeBonusConfig?.isEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Bonus Amount per User ($ USDT)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={settings.welcomeBonusConfig?.maxAmount || 1.0}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  welcomeBonusConfig: {
                    ...settings.welcomeBonusConfig,
                    maxAmount: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
