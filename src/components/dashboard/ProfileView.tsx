import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { User, Mail, Phone, MapPin, Globe, CheckCircle2, ShieldCheck, Upload, Image, Check } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [country, setCountry] = useState(user?.country || 'Pakistan');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // 5 distinct pre-designed avatars for 1-click selection
  const predefinedAvatars = [
    {
      id: 'avatar-1',
      name: 'Crypto Trader',
      url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'avatar-2',
      name: 'Fintech Executive',
      url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'avatar-3',
      name: 'Blockchain Analyst',
      url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'avatar-4',
      name: 'Cyber Guardian',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'avatar-5',
      name: 'Diamond Investor',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Please select an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        showToast('info', 'Photo Loaded', 'Click "Save Profile Changes" to store your photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile({ fullName, phoneNumber, address, country, avatarUrl });
      showToast('success', 'Profile Updated', 'Your profile details and avatar have been saved.');
      await refreshUser();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    setIsVerifyingEmail(true);
    try {
      await api.verifyEmail();
      showToast('success', 'Email Verified', 'Your email address is now verified.');
      await refreshUser();
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.message);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.nav.profile}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage your personal details, profile picture, and account settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 sm:p-8 shadow-2xs space-y-6">
        {/* User Card Header with Active Picture */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#451A03] shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#F7EFEA] text-[#451A03] font-black text-2xl flex items-center justify-center border border-[#EADBCE]">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{user?.fullName}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={user?.kycStatus === 'APPROVED' ? 'success' : 'warning'} size="sm">
                  {user?.kycStatus}
                </Badge>
                <Badge variant="neutral" size="sm">{user?.role}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Profile Picture & 5 Avatars Selection Section                   */}
        {/* --------------------------------------------------------------- */}
        <div className="p-5 rounded-2xl bg-[#FDF8F5] border border-[#EADBCE] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Image className="w-4 h-4 text-[#451A03]" />
                <span>Profile Picture & Custom Avatars</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your own photo or choose from 5 pre-made cryptocurrency avatars.
              </p>
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Reset Photo
              </button>
            )}
          </div>

          {/* 5 Distinct Avatars */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Choose from 5 Pre-designed Avatars:
            </span>
            <div className="grid grid-cols-5 gap-3">
              {predefinedAvatars.map((av) => {
                const isSelected = avatarUrl === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatarUrl(av.url)}
                    className={`relative p-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer group ${
                      isSelected
                        ? 'border-[#451A03] bg-white ring-2 ring-[#451A03]/20 shadow-xs'
                        : 'border-[#EADBCE] bg-white hover:border-[#78350F]'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.name}
                      className="w-12 h-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {av.name.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#451A03] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Photo Option */}
          <div className="pt-2 border-t border-[#EADBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-600">
              Or upload any photo from your phone/computer (PNG, JPG, WebP):
            </span>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#F5EDE8] border border-[#451A03] text-[#451A03] text-xs font-bold transition-colors cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Email verification card */}
        <div className="p-4 bg-[#FDF8F5] rounded-xl border border-[#EADBCE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#451A03]" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">Email Verification Status</span>
              <span className="text-slate-500">
                {user?.isEmailVerified ? 'Your email address is verified.' : 'Email is not yet verified.'}
              </span>
            </div>
          </div>
          {!user?.isEmailVerified ? (
            <button
              type="button"
              onClick={handleVerifyEmail}
              disabled={isVerifyingEmail}
              className="px-3.5 py-1.5 rounded-lg border border-[#451A03] text-[#451A03] hover:bg-[#F5EDE8] text-xs font-bold transition-colors"
            >
              Verify Email Now
            </button>
          ) : (
            <Badge variant="success" size="sm" dot>Verified</Badge>
          )}
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Residential Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Street address"
                className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] active:bg-[#280F02] text-white font-bold text-xs shadow-md shadow-[#451A03]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
