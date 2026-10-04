import React, { useEffect } from 'react';
import { Logo } from './Logo';
import { useTranslation } from '../locales';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Award,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  User,
  Lock,
  FileText,
  LifeBuoy,
  LogOut,
  Users,
  ShieldAlert,
  Sliders,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  History,
  LayoutGrid,
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export type UserView =
  | 'dashboard'
  | 'plans'
  | 'rewards'
  | 'wallet'
  | 'referrals'
  | 'transactions'
  | 'kyc'
  | 'profile'
  | 'security'
  | 'privacy-terms'
  | 'legal'
  | 'support';

export type AdminView =
  | 'admin-overview'
  | 'admin-users'
  | 'admin-kyc'
  | 'admin-plans'
  | 'admin-rewards'
  | 'admin-deposits'
  | 'admin-withdrawals'
  | 'admin-transactions'
  | 'admin-bonuses'
  | 'admin-content'
  | 'admin-audit'
  | 'admin-settings';

export interface SidebarProps {
  currentView?: string;
  activeView?: string;
  onSelectView: (view: string) => void;
  isAdminMode?: boolean;
  onToggleAdminMode?: (isAdmin: boolean) => void;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  isOpen?: boolean;
  onCloseMobile: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeView,
  onSelectView,
  isAdminMode,
  onToggleAdminMode,
  isOpenMobile,
  isMobileOpen,
  isOpen,
  onCloseMobile,
  onClose,
}) => {
  const { t, language } = useTranslation();
  const { user, logout, balances } = useAuth();

  const active = activeView || currentView || 'dashboard';
  const open = isOpen ?? isMobileOpen ?? isOpenMobile ?? false;
  const handleClose = onClose || onCloseMobile;

  const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'KYC_REVIEWER', 'SUPPORT', 'FINANCE'].includes(user.role);
  const effectiveAdminMode = isAdminMode !== undefined ? isAdminMode : (isStaff || active.startsWith('admin-'));

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const userNavItems: { id: UserView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="w-5 h-5 text-[#451A03]" /> },
    { id: 'plans', label: t.nav.plans, icon: <Layers className="w-5 h-5 text-[#451A03]" /> },
    { id: 'rewards', label: t.nav.rewards, icon: <Award className="w-5 h-5 text-[#451A03]" /> },
    { id: 'wallet', label: t.nav.wallet, icon: <Wallet className="w-5 h-5 text-[#451A03]" /> },
    { id: 'referrals', label: t.nav.referrals, icon: <Gift className="w-5 h-5 text-[#451A03]" /> },
    { id: 'transactions', label: t.nav.transactions, icon: <ArrowLeftRight className="w-5 h-5 text-[#451A03]" /> },
    { id: 'kyc', label: t.nav.kyc, icon: <ShieldCheck className="w-5 h-5 text-[#451A03]" /> },
    { id: 'profile', label: t.nav.profile, icon: <User className="w-5 h-5 text-[#451A03]" /> },
    { id: 'legal', label: 'Trading & Profit Policy', icon: <TrendingUp className="w-5 h-5 text-[#451A03]" /> },
    { id: 'support', label: t.nav.support, icon: <LifeBuoy className="w-5 h-5 text-[#451A03]" /> },
  ];

  const adminNavItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'admin-overview', label: t.admin.overviewTab, icon: <LayoutGrid className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-users', label: t.admin.usersTab, icon: <Users className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-kyc', label: t.admin.kycTab, icon: <ShieldAlert className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-deposits', label: t.admin.depositsTab, icon: <ArrowDownToLine className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-withdrawals', label: t.admin.withdrawalsTab, icon: <ArrowUpFromLine className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-transactions', label: t.admin.ledgerTab, icon: <History className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-audit', label: t.admin.auditTab, icon: <DollarSign className="w-5 h-5 text-[#451A03]" /> },
    { id: 'admin-settings', label: t.admin.settingsTab, icon: <Sliders className="w-5 h-5 text-[#451A03]" /> },
  ];

  const activeItems = effectiveAdminMode ? adminNavItems : userNavItems;

  const handleItemClick = (id: string) => {
    onSelectView(id);
    handleClose();
  };

  return (
    <>
      {/* Backdrop for Smooth Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity duration-200"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 z-50 w-72 max-w-[85vw] bg-white border-r rtl:border-r-0 rtl:border-l border-[#EADBCE] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        {/* Brand Header with Close Button */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#EADBCE] shrink-0 bg-white">
          <Logo size="md" variant="light" onClick={() => handleItemClick(effectiveAdminMode ? 'admin-overview' : 'dashboard')} />
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] transition-all cursor-pointer"
            title="Close sidebar / بند کریں"
          >
            <X className="w-5 h-5 text-[#451A03]" />
          </button>
        </div>

        {/* Welcome Bonus Notice Card inside Sidebar (For regular members) */}
        {!isStaff && (
          <div className="p-3 mx-3 mt-3 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#EADBCE] flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-[#451A03]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#451A03] block">$1.00 Welcome Bonus</span>
                <span className="text-[10px] text-slate-500">Unlocks upon plan activation</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin / Client Mode Switcher if user has staff privileges */}
        {isStaff && (
          <div className="p-3 mx-3 mt-2 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {effectiveAdminMode ? 'Admin Console' : 'Client Mode'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextMode = !effectiveAdminMode;
                  if (onToggleAdminMode) {
                    onToggleAdminMode(nextMode);
                  }
                  onSelectView(nextMode ? 'admin-overview' : 'dashboard');
                }}
                className="text-[11px] font-bold text-[#451A03] hover:underline inline-flex items-center gap-0.5"
              >
                Switch <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Signed in as: <span className="font-semibold text-[#451A03]">{user.role}</span>
            </p>
          </div>
        )}

        {/* Navigation List with Dark Brown Icons */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {activeItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FDF8F5] text-[#451A03] font-bold border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#451A03] shadow-2xs'
                    : 'text-slate-600 hover:text-[#451A03] hover:bg-[#FDF8F5]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-[#F5EDE8]' : 'bg-[#FDF8F5]'
                }`}>
                  {item.icon}
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-3 border-t border-[#EADBCE] shrink-0 bg-white">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-rose-600" />
            <span>{t.common.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
