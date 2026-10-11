import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { useTranslation } from '../../locales';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  ArrowRight,
  Gift,
} from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'LOGIN' | 'REGISTER' | 'ADMIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, resetPassword } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useTranslation();

  const normalizeMode = (m?: string): 'login' | 'signup' | 'forgot' => {
    if (m === 'REGISTER' || m === 'signup') return 'signup';
    if (m === 'forgot') return 'forgot';
    return 'login';
  };

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(() => normalizeMode(initialMode));

  React.useEffect(() => {
    setMode(normalizeMode(initialMode));
    setError(null);
    setCanSwitchToLogin(false);
    setCanResetPassword(false);
  }, [initialMode, isOpen]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref') || '';
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSwitchToLogin, setCanSwitchToLogin] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCanSwitchToLogin(false);
    setCanResetPassword(false);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError('Please enter your email or username and password.');
          setIsLoading(false);
          return;
        }
        await login(email.trim(), password);
        showToast(
          'success',
          language === 'ur' ? 'کامیاب لاگ ان' : 'Logged in successfully',
          language === 'ur' ? 'پروفیکسا میں خوش آمدید!' : 'Welcome back to Profixa.'
        );
        onClose();
      } else if (mode === 'signup') {
        if (!fullName.trim() || fullName.trim().length < 2) {
          setError('Please enter your full name (minimum 2 characters).');
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Email address is required.');
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 4) {
          setError('Password must be at least 4 characters.');
          setIsLoading(false);
          return;
        }
        if (!agreeTerms) {
          setError('You must agree to the Terms of Service.');
          setIsLoading(false);
          return;
        }

        await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
        });

        showToast(
          'success',
          language === 'ur' ? 'اکاؤنٹ بن گیا' : 'Account Created Successfully',
          language === 'ur'
            ? 'پروفیکسا میں خوش آمدید! آپ کا اکاؤنٹ کامیابی سے بن چکا ہے۔'
            : 'Welcome to Profixa! Your account has been created successfully.'
        );
        onClose();
      } else {
        // Mode is 'forgot' -> direct password reset
        if (!email.trim()) {
          setError('Please enter your registered email address.');
          setIsLoading(false);
          return;
        }
        if (!password || password.length < 4) {
          setError('Please enter a new password (at least 4 characters).');
          setIsLoading(false);
          return;
        }

        await resetPassword(email.trim(), password);
        showToast(
          'success',
          'Password Reset Successfully',
          'Your new password has been saved and you are now signed in.'
        );
        onClose();
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (
        errMsg.toLowerCase().includes('already exists') ||
        errMsg.toLowerCase().includes('exists') ||
        errMsg.includes('ایک ہی اکاؤنٹ') ||
        errMsg.includes('پہلے سے رجسٹرڈ')
      ) {
        setError('An account with this email address already exists. Each email can only be registered once. Please sign in instead.');
        setCanSwitchToLogin(true);
      } else if (errMsg.includes('Account not found') || errMsg.includes('اکاؤنٹ نہیں ملا')) {
        setError('Account not found. Please enter your correct registered email or username, or switch to Create Account.');
      } else if (errMsg.includes('Incorrect password') || errMsg.includes('پاس ورڈ غلط')) {
        setError('Incorrect password. Please verify and try again, or click below to reset your password.');
        setCanResetPassword(true);
      } else {
        setError(errMsg || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        mode === 'login'
          ? (language === 'ur' ? 'سائن ان کریں' : t.common.login)
          : mode === 'signup'
          ? (language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create Account')
          : t.common.forgotPassword
      }
      subtitle={
        mode === 'login'
          ? (language === 'ur' ? 'اپنے اکاؤنٹ میں داخل ہونے کے لیے معلومات درج کریں۔' : 'Access your decentralized crypto reward portfolio.')
          : mode === 'signup'
          ? (language === 'ur' ? 'چند سیکنڈ میں اپنا مفت اور محفوظ اکاؤنٹ بنائیں۔' : 'Register your verified personal account to start.')
          : (language === 'ur' ? 'اپنا ای میل درج کریں تاکہ ری سیٹ لنک بھیجا جا سکے۔' : 'Enter your registered email to receive recovery instructions.')
      }
    >
      {/* 2-Way Tab Switcher: Only Sign In & Create Account (Zero public admin portal visibility) */}
      <div className="flex rounded-xl bg-[#FDF8F5] p-1 mb-5 border border-[#EADBCE] gap-1">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setCanSwitchToLogin(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-[#451A03] shadow-2xs border border-[#EADBCE]'
              : 'text-slate-600 hover:text-[#451A03]'
          }`}
        >
          {language === 'ur' ? 'سائن ان' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError(null);
            setCanSwitchToLogin(false);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-[#451A03] shadow-2xs border border-[#EADBCE]'
              : 'text-slate-600 hover:text-[#451A03]'
          }`}
        >
          {language === 'ur' ? 'نیا اکاؤنٹ' : 'Create Account'}
        </button>
      </div>

      {/* Error Message with Quick Switch */}
      {error && (
        <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {canSwitchToLogin && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setCanSwitchToLogin(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#451A03] hover:bg-[#341402] text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <span>{language === 'ur' ? 'یہاں کلک کر کے لاگ ان کریں' : 'Switch to Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {canResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setCanResetPassword(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <span>Set New Password & Log In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#451A03] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
                className="w-full h-11 pl-10 pr-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            {mode === 'login'
              ? (language === 'ur' ? 'ای میل ایڈریس یا یوزر نیم *' : 'Email Address or Username *')
              : 'Email Address *'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#451A03] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={mode === 'login' ? 'text' : 'email'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
              className="w-full h-11 pl-10 pr-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none transition-colors"
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#451A03] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder=""
                className="w-full h-11 pl-10 pr-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Referral Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              {referralCode && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Code Applied
                </span>
              )}
            </div>
            <div className="relative">
              <Gift className="w-4 h-4 text-[#451A03] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder=""
                className="w-full h-11 pl-10 pr-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 font-mono uppercase tracking-wider outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800">
              {mode === 'forgot'
                ? 'New Password *'
                : language === 'ur'
                ? 'پاس ورڈ *'
                : 'Password *'}
            </label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-[11px] font-semibold text-[#451A03] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#451A03] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'forgot' ? 'Enter your new password (min 4 chars)' : '••••••••'}
              className="w-full h-11 pl-10 pr-10 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none transition-colors"
              autoComplete={mode === 'forgot' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#451A03] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {(mode === 'signup' || mode === 'forgot') && (
            <p className="text-[11px] text-slate-400 mt-1">Must be at least 4 characters.</p>
          )}
        </div>

        {mode === 'signup' && (
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#EADBCE] text-[#451A03] focus:ring-[#451A03]"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 leading-snug">
              I agree to the{' '}
              <span className="text-[#451A03] font-bold">Trading & Profit Policy</span>.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {isLoading ? (
            <span>Processing...</span>
          ) : (
            <>
              <span>
                {mode === 'login'
                  ? (language === 'ur' ? 'سائن ان کریں' : 'Sign In')
                  : mode === 'signup'
                  ? (language === 'ur' ? 'اکاؤنٹ بنائیں' : 'Create Account')
                  : 'Set New Password & Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Switcher */}
      <div className="mt-5 pt-4 border-t border-[#EADBCE] text-center text-xs text-slate-500">
        {mode === 'login' ? (
          <p>
            {language === 'ur' ? 'اکاؤنٹ نہیں ہے؟' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className="font-bold text-[#451A03] hover:underline cursor-pointer ml-1"
            >
              {language === 'ur' ? 'نیا اکاؤنٹ بنائیں' : 'Create an Account'}
            </button>
          </p>
        ) : mode === 'signup' ? (
          <p>
            {language === 'ur' ? 'پہلے سے اکاؤنٹ ہے؟' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="font-bold text-[#451A03] hover:underline cursor-pointer ml-1"
            >
              {language === 'ur' ? 'سائن ان کریں' : 'Sign In'}
            </button>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="font-bold text-[#451A03] hover:underline cursor-pointer"
          >
            ← Return to Sign In
          </button>
        )}
      </div>
    </Modal>
  );
};
