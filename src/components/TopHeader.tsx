import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../locales';
import { Badge } from './ui/Badge';
import { Logo } from './Logo';
import {
  Menu,
  Bell,
  Globe,
  Check,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Gift,
} from 'lucide-react';

export interface TopHeaderProps {
  onToggleMobileSidebar?: () => void;
  onToggleMobileNav?: () => void;
  onNavigateView?: (view: string) => void;
  onNavigate?: (view: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileSidebar,
  onToggleMobileNav,
  onNavigateView,
  onNavigate,
}) => {
  const handleToggleSidebar = onToggleMobileSidebar || onToggleMobileNav || (() => {});
  const handleNavigate = onNavigateView || onNavigate || (() => {});
  const {
    user,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getKycBadge = () => {
    if (!user) return null;
    switch (user.kycStatus) {
      case 'APPROVED':
        return <Badge variant="success" size="sm" dot>KYC Verified</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm" dot>KYC Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm" dot>KYC Rejected</Badge>;
      case 'REQUIRES_RESUBMISSION':
        return <Badge variant="warning" size="sm" dot>Resubmit KYC</Badge>;
      default:
        return <Badge variant="neutral" size="sm">KYC Required</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-[#EADBCE] px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left: 3-Lines Corner Menu Button + Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Prominent 3-Lines (Hamburger) button in the top corner for ALWAYS opening the sidebar */}
        <button
          type="button"
          onClick={handleToggleSidebar}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] shadow-2xs transition-all cursor-pointer group shrink-0 active:scale-95"
          title="Open Menu (Sidebar / مینو)"
        >
          <Menu className="w-5 h-5 text-[#451A03] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-[#451A03] hidden sm:inline">Menu</span>
        </button>

        {/* Small Brand Logo */}
        <Logo size="sm" variant="light" onClick={() => handleNavigate(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'admin-users' : 'dashboard')} />
      </div>

      {/* Right Controls with Dark Brown Accents */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Welcome Bonus Quick Pill (For regular users) */}
        {user?.role === 'USER' && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-xs font-bold text-[#451A03]">
            <Gift className="w-4 h-4 text-[#451A03]" />
            <span>$1.00 Bonus Active</span>
          </div>
        )}

        {/* Dual Language Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#EADBCE] bg-white hover:bg-[#FDF8F5] text-[#451A03] transition-colors"
          title="Switch language / زبان تبدیل کریں"
        >
          <Globe className="w-3.5 h-3.5 text-[#451A03]" />
          <span>{language === 'en' ? 'اردو' : 'EN'}</span>
        </button>

        {/* Notifications Popover with Dark Brown Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl bg-[#FDF8F5] hover:bg-[#F5EDE8] text-[#451A03] border border-[#EADBCE] transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-[#451A03]" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#451A03] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#EADBCE] shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#EADBCE]">
                <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-semibold text-[#451A03] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No notifications yet.</div>
                ) : (
                  notifications.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => markNotificationAsRead(note.id)}
                      className={`py-3 px-2 hover:bg-[#FDF8F5] rounded-xl transition-colors cursor-pointer ${
                        !note.isRead ? 'bg-[#FDF8F5]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">{note.title}</span>
                        {!note.isRead && <span className="w-2 h-2 rounded-full bg-[#451A03] shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">{note.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown with Avatar support */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FDF8F5] border border-transparent hover:border-[#EADBCE] transition-colors cursor-pointer"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-9 h-9 rounded-xl object-cover border border-[#EADBCE] shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03] font-bold text-sm flex items-center justify-center shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {user?.email}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#451A03] hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#EADBCE] shadow-xl p-3 z-50">
              <div className="p-2 border-b border-[#EADBCE] mb-2">
                <div className="flex items-center gap-2.5 mb-1.5">
                  {user?.avatarUrl && (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  )}
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2">{getKycBadge()}</div>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-[#FDF8F5] rounded-lg transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#451A03]" />
                  <span>My Profile & Avatar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('referrals');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-[#FDF8F5] rounded-lg transition-colors cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-[#451A03]" />
                  <span>Referrals & Network</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>{t.common.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
