import React, { useState } from 'react';
import { LanguageProvider, useTranslation } from './locales';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/auth/AuthModal';

// Dashboard views
import { UserDashboard } from './components/dashboard/UserDashboard';
import { PlansView } from './components/dashboard/PlansView';
import { RewardsView } from './components/dashboard/RewardsView';
import { WalletView } from './components/dashboard/WalletView';
import { TransactionsView } from './components/dashboard/TransactionsView';
import { KYCView } from './components/dashboard/KYCView';
import { ProfileView } from './components/dashboard/ProfileView';
import { ReferralView } from './components/dashboard/ReferralView';
import { SupportView } from './components/dashboard/SupportView';
import { LegalContentView } from './components/dashboard/LegalContentView';

// Admin views
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminDeposits } from './components/admin/AdminDeposits';
import { AdminKYC } from './components/admin/AdminKYC';
import { AdminWithdrawals } from './components/admin/AdminWithdrawals';
import { AdminLedger } from './components/admin/AdminLedger';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminSettings } from './components/admin/AdminSettings';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading, token } = useAuth();
  const { isRtl } = useTranslation();

  // Navigation state - persisted in localStorage so browser refreshes preserve active page
  const [activeView, setActiveView] = useState<string>(() => {
    try {
      return localStorage.getItem('profixa_active_view') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [legalSlug, setLegalSlug] = useState<string>('privacy-policy');

  const handleSelectView = (view: string) => {
    setActiveView(view);
    try {
      localStorage.setItem('profixa_active_view', view);
    } catch {}
  };

  // When an admin signs in, land on admin view if not already on an admin view
  React.useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      try {
        const saved = localStorage.getItem('profixa_active_view');
        if (!saved || saved === 'dashboard' || !saved.startsWith('admin-')) {
          handleSelectView('admin-users');
        } else {
          setActiveView(saved);
        }
      } catch {
        handleSelectView('admin-users');
      }
    }
  }, [user?.role]);

  // If a visitor lands via a referral invitation link (?ref=CODE), auto-open registration modal
  React.useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('ref')) {
        setAuthModalMode('REGISTER');
      }
    }
  }, [isAuthenticated]);

  const handleOpenAuth = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthModalMode(mode);
  };

  const handleOpenLegal = (slug: string) => {
    setLegalSlug(slug);
    setActiveView('legal');
  };

  // While checking an existing auth token on page load/refresh, avoid flashing the landing page
  if (isLoading && token) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#451A03] text-white flex items-center justify-center font-black text-xl mb-3 shadow-md animate-pulse">
          P
        </div>
        <p className="text-xs font-bold text-slate-700">Verifying secure session...</p>
      </div>
    );
  }

  // If unauthenticated, render the Public Landing Page & Auth Modal in crisp white
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-white text-slate-900 ${isRtl ? 'rtl' : 'ltr'}`}>
        <Navbar onOpenAuth={handleOpenAuth} onOpenLegal={handleOpenLegal} />

        {activeView === 'legal' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-xs font-bold text-[#451A03] hover:underline mb-6 block"
            >
              ← Back to Home
            </button>
            <LegalContentView initialSlug={legalSlug} />
          </div>
        ) : (
          <LandingPage onOpenAuth={handleOpenAuth} onOpenLegal={handleOpenLegal} />
        )}

        <AuthModal
          isOpen={!!authModalMode}
          onClose={() => setAuthModalMode(null)}
          initialMode={authModalMode || 'LOGIN'}
        />
      </div>
    );
  }

  // Authenticated Dashboard Layout - Crisp White / Slate with Dark Brown
  return (
    <div className={`min-h-screen bg-[#FAF7F5] text-slate-900 flex flex-col ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Slide-out Sidebar Drawer Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => {
          handleSelectView(view);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onToggleMobileSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleMobileNav={() => setIsSidebarOpen((prev) => !prev)}
          onNavigate={(view) => handleSelectView(view)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* User views */}
          {activeView === 'dashboard' && <UserDashboard onNavigate={handleSelectView} />}
          {activeView === 'plans' && <PlansView />}
          {activeView === 'rewards' && <RewardsView />}
          {activeView === 'wallet' && <WalletView />}
          {activeView === 'referrals' && <ReferralView onNavigate={handleSelectView} />}
          {activeView === 'transactions' && <TransactionsView />}
          {activeView === 'kyc' && <KYCView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'support' && <SupportView />}
          {activeView === 'legal' && <LegalContentView initialSlug={legalSlug} />}
          {activeView === 'privacy-terms' && <LegalContentView initialSlug="privacy-policy" />}

          {/* Admin views */}
          {activeView === 'admin-overview' && <AdminOverview onNavigateAdminView={setActiveView} />}
          {activeView === 'admin-users' && <AdminUsers />}
          {activeView === 'admin-deposits' && <AdminDeposits />}
          {activeView === 'admin-kyc' && <AdminKYC />}
          {activeView === 'admin-withdrawals' && <AdminWithdrawals />}
          {activeView === 'admin-transactions' && <AdminLedger />}
          {activeView === 'admin-audit' && <AdminAuditLogs />}
          {activeView === 'admin-settings' && <AdminSettings />}
          {activeView === 'admin-plans' && <PlansView />}
          {activeView === 'admin-rewards' && <RewardsView />}
          {activeView === 'admin-bonuses' && <AdminSettings />}
          {activeView === 'admin-content' && <LegalContentView initialSlug="privacy-policy" />}
        </main>
      </div>

      <AuthModal
        isOpen={!!authModalMode}
        onClose={() => setAuthModalMode(null)}
        initialMode={authModalMode || 'LOGIN'}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
