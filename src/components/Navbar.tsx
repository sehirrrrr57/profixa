import React from 'react';
import { Logo } from './Logo';
import { useTranslation } from '../locales';
import { Globe, LogIn, UserPlus } from 'lucide-react';

export interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onOpenAuth?: (mode: 'LOGIN' | 'REGISTER') => void;
  onOpenLegal?: (slug: string) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onSignupClick,
  onOpenAuth,
}) => {
  const { t, language, setLanguage } = useTranslation();

  const handleLogin = () => {
    if (onOpenAuth) onOpenAuth('LOGIN');
    else if (onLoginClick) onLoginClick();
  };

  const handleSignup = () => {
    if (onOpenAuth) onOpenAuth('REGISTER');
    else if (onSignupClick) onSignupClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADBCE] shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Sole prominent brand logo on the side */}
        <Logo size="md" variant="light" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        {/* Right side utilities: Language switcher + Sign In & Sign Up */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Dual Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03] hover:bg-[#F5EDE8] transition-all shadow-2xs"
            title="Switch language / زبان تبدیل کریں"
          >
            <Globe className="w-3.5 h-3.5 text-[#451A03]" />
            <span className="hidden sm:inline">{language === 'en' ? 'اردو' : 'English'}</span>
          </button>

          {/* Quick Sign In button */}
          <button
            type="button"
            onClick={handleLogin}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl text-[#451A03] hover:text-black bg-white hover:bg-[#FDF8F5] border border-[#EADBCE] transition-all shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#451A03]" />
            <span className="hidden xs:inline">{t.common.login}</span>
          </button>

          {/* Create Account button in Dark Brown */}
          <button
            type="button"
            onClick={handleSignup}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-[#451A03] hover:bg-[#341402] transition-all shadow-sm shadow-[#451a03]/25"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#EADBCE]" />
            <span>{language === 'ur' ? 'اکاؤنٹ' : 'Sign Up'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
