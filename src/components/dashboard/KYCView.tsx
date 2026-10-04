import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

export const KYCView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [step, setStep] = useState<1 | 2 | 3>(user?.kycStatus === 'APPROVED' ? 3 : 1);
  const [kycRecord, setKycRecord] = useState<any>(null);

  // Form fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState('1995-05-15');
  const [country, setCountry] = useState('Pakistan');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');

  // Upload previews - ONLY ID Front is required (Biometrics removed as instructed)
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);

  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKyc = async () => {
    try {
      const res = await api.getKYCStatus();
      if (res.success && res.record) {
        setKycRecord(res.record);
        if (res.record.fullName) setFullName(res.record.fullName);
        if (res.record.dateOfBirth) setDateOfBirth(res.record.dateOfBirth);
        if (res.record.country) setCountry(res.record.country);
        if (res.record.idNumber) setIdNumber(res.record.idNumber);
        if (res.record.address) setAddress(res.record.address);
        if (res.record.documents?.idFrontUrl) setIdFrontPreview(res.record.documents.idFrontUrl);

        if (res.record.status === 'APPROVED' || user?.kycStatus === 'APPROVED') {
          setStep(3);
        }
      }
    } catch (err) {
      console.warn('Failed to load KYC:', err);
    }
  };

  useEffect(() => {
    loadKyc();
    if (user?.kycStatus === 'APPROVED') {
      setStep(3);
    }
  }, [user?.kycStatus]);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      await api.saveKYCPersonalInfo({
        fullName,
        dateOfBirth,
        country,
        idNumber,
        address,
      });
      showToast(
        'success',
        isUrdu ? 'معلومات محفوظ ہو گئیں' : 'Personal Information Saved',
        isUrdu ? 'اب شناختی کارڈ کی فرنٹ فوٹو اپلوڈ کریں۔' : 'Proceeding to ID card front upload.'
      );
      setStep(2);
    } catch (err: any) {
      showToast('error', isUrdu ? 'خرابی' : 'Error saving info', err.message);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const previewUrl = event.target?.result as string;
      setIdFrontPreview(previewUrl);
      setIsUploading(true);

      try {
        await api.uploadKYCDocument({
          documentType: 'ID_FRONT',
          fileName: file.name,
          mimeType: file.type,
          fileBase64: base64,
        });
        showToast(
          'success',
          isUrdu ? 'شناختی کارڈ فوٹو منتخب ہو گئی' : 'ID Document Selected',
          isUrdu ? 'تصدیق کے لیے نیچے بٹن دبائیں۔' : 'Ready to submit for instant verification.'
        );
      } catch (err: any) {
        showToast('error', 'Upload failed', err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Immediate automated verification upon submit
  const handleSubmitReview = async () => {
    if (!idFrontPreview) {
      showToast('info', 'ID Photo Required', 'Please upload a photo of your ID Card front side.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitKYC();
      showToast(
        'success',
        isUrdu ? '🎉 مبارک ہو! KYC تصدیق ہو گئی' : '🎉 Instant Verification Approved!',
        isUrdu
          ? 'آپ کا اکاؤنٹ مکمل طور پر منظور ہو چکا ہے۔ تمام سروسز اور ودڈراولز ان لاک ہو گئے ہیں۔'
          : 'Your account is now fully verified. All withdrawal and plan features are active.'
      );
      await refreshUser();
      await loadKyc();
      setStep(3);
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isUrdu ? 'شناختی تصدیق (KYC)' : 'Identity Verification (KYC)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isUrdu
              ? 'صرف شناختی کارڈ کی فرنٹ تصویر جمع کروائیں اور فوراً خودکار تصدیق حاصل کریں۔'
              : 'Submit your ID card front photo for automated, instant account verification.'}
          </p>
        </div>
        {user?.kycStatus === 'APPROVED' && (
          <Badge variant="success" size="md" dot>
            Level 2 Verified
          </Badge>
        )}
      </div>

      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EADBCE] shadow-2xs">
        {[
          { num: 1, label: isUrdu ? 'ذاتی معلومات' : 'Personal Information' },
          { num: 2, label: isUrdu ? 'شناختی کارڈ فرنٹ' : 'ID Card Front Photo' },
          { num: 3, label: isUrdu ? 'تصدیق کی حیثیت' : 'Verification Status' },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2 sm:gap-2.5">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                step >= s.num
                  ? 'bg-[#451A03] text-white shadow-xs'
                  : 'bg-[#FDF8F5] text-slate-500 border border-[#EADBCE]'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden md:inline ${
                step >= s.num ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
            {idx < 2 && <span className="text-[#EADBCE] mx-1 sm:mx-2">→</span>}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* STEP 1: PERSONAL INFORMATION */}
      {/* ------------------------------------------------------------------- */}
      {step === 1 && (
        <form
          onSubmit={handleSavePersonalInfo}
          className="bg-white rounded-2xl border border-[#EADBCE] p-5 sm:p-8 shadow-2xs space-y-5"
        >
          <div className="border-b border-[#EADBCE] pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {isUrdu ? 'بنیادی شناختی معلومات' : 'Official Identification Details'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUrdu
                ? 'اپنے قومی شناختی کارڈ یا پاسپورٹ کے مطابق درست تفصیلات درج کریں۔'
                : 'Enter your details exactly as shown on your government-issued ID card or passport.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {isUrdu ? 'مکمل قانونی نام (شناختی کارڈ کے مطابق)' : 'Full Legal Name (as on official ID)'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full h-11 px-4 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {isUrdu ? 'تاریخ پیدائش' : 'Date of Birth'}
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full h-11 px-4 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {isUrdu ? 'ملک' : 'Country of Residence'}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none font-medium text-slate-900"
              >
                <option value="Pakistan">Pakistan</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Germany">Germany</option>
                <option value="Singapore">Singapore</option>
                <option value="Other">Other Global</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {isUrdu ? 'قومی شناختی کارڈ / پاسپورٹ نمبر' : 'CNIC / Government ID / Passport Number'}
              </label>
              <input
                type="text"
                required
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. 42101-1234567-1 or P12345678"
                className="w-full h-11 px-4 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              {isUrdu ? 'رہائشی پتہ' : 'Residential Address'}
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City, Province / State, Postal Code"
              className="w-full p-3 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSavingInfo}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isUrdu ? 'شناختی کارڈ اپلوڈ کی طرف بڑھیں' : 'Continue to ID Card Upload'}
            </Button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* STEP 2: ID CARD FRONT PHOTO ONLY (Biometrics Removed)               */}
      {/* ------------------------------------------------------------------- */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-5 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-[#EADBCE] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#451A03]" />
              <h3 className="text-base font-bold text-slate-900">
                {isUrdu ? 'قومی شناختی کارڈ کی فرنٹ سائیڈ کی تصویر' : 'Government ID Card (Front Side Photo)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isUrdu
                ? 'صرف شناختی کارڈ یا پاسپورٹ کے سامنے والے حصے کی واضح تصویر اپلوڈ کریں۔ جمع کراتے ہی خود بخود تصدیق ہو جائے گی۔'
                : 'Upload a clear, readable photograph of your official ID Card (Front side). Upon submission, it will be automatically verified.'}
            </p>
          </div>

          {/* ID Front Card Box */}
          <div className="p-6 bg-[#FDF8F5] rounded-2xl border-2 border-dashed border-[#EADBCE] text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#EADBCE] flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-8 h-8 text-[#451A03]" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                {isUrdu ? 'شناختی کارڈ کی فرنٹ تصویر' : 'Official ID Card (Front Side)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isUrdu ? 'قومی شناختی کارڈ، ڈرائیونگ لائسنس یا پاسپورٹ' : 'National ID Card (CNIC), Driver\'s License, or Passport'}
              </p>
            </div>

            {idFrontPreview && (
              <div className="mt-2 p-2 bg-white rounded-xl border border-[#EADBCE] max-w-xs mx-auto shadow-2xs space-y-2">
                <img
                  src={idFrontPreview}
                  alt="ID Front Preview"
                  className="w-full h-40 object-cover rounded-lg border border-[#EADBCE]"
                />
                <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 py-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {isUrdu ? 'تصویر منتخب ہو گئی ہے' : 'ID Photo Attached Ready for Verification'}
                </span>
              </div>
            )}

            <div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-[#EADBCE] text-xs font-bold text-[#451A03] hover:bg-[#F5EDE8] cursor-pointer transition-all shadow-2xs hover:shadow-xs active:scale-95">
                <UploadCloud className="w-4 h-4 text-[#451A03]" />
                <span>
                  {idFrontPreview
                    ? (isUrdu ? 'تصویر تبدیل کریں' : 'Change ID Photo')
                    : (isUrdu ? 'شناختی کارڈ فوٹو منتخب کریں' : 'Choose ID Card Front Photo')}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-400">
              {isUrdu ? 'سپورٹ فارمیٹس: JPG, PNG, WEBP (حجم: 10MB تک)' : 'Supported: JPG, PNG, WEBP (Clear, well-lit image)'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#EADBCE]">
            <Button variant="outline" size="md" onClick={() => setStep(1)} className="w-full sm:w-auto">
              ← {isUrdu ? 'تفصیلات میں واپسی' : 'Back to Details'}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmitReview}
              isLoading={isSubmitting || isUploading}
              disabled={!idFrontPreview}
              className="w-full sm:w-auto bg-[#451A03] hover:bg-[#341402] text-white"
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            >
              {isUrdu ? 'تصدیق جمع کرائیں (فوری اپروول)' : 'Submit & Verify Now (Instant)'}
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* STEP 3: STATUS TRACKER & SUCCESS BANNER                             */}
      {/* ------------------------------------------------------------------- */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 sm:p-10 shadow-2xs text-center space-y-6">
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-12 h-12 text-emerald-600 animate-bounce" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              {isUrdu ? '🎉 شناختی تصدیق مکمل اور منظور شدہ!' : '🎉 Identity Verification Approved!'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isUrdu
                ? 'آپ کا قومی شناختی کارڈ کامیابی سے خودکار تصدیق کے ذریعے اپروو ہو چکا ہے۔ اب آپ کا والیٹ، ودڈراولز اور تمام ہائی ریٹرن پلانز مکمل طور پر فعال ہیں۔'
                : 'Your official ID Card has been automatically verified and approved. Your account holds Tier 1 KYC status with full deposit, plan activation, and Aptos withdrawal capabilities unlocked.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="success" size="md" dot>
                {isUrdu ? 'لیول 2 - مکمل ویریفائیڈ' : 'Level 2 - Fully Verified'}
              </Badge>
              <Badge variant="teal" size="md">
                {isUrdu ? 'فوری ودڈراول فعال' : 'Withdrawals Unlocked'}
              </Badge>
            </div>

            <div className="p-4 bg-[#FDF8F5] border border-[#EADBCE] rounded-xl text-left text-xs text-slate-700 space-y-1.5 mt-4">
              <div className="flex justify-between">
                <span className="text-slate-500">{isUrdu ? 'شناختی نام:' : 'Verified Name:'}</span>
                <span className="font-bold text-slate-900">{fullName || user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isUrdu ? 'شناختی نمبر:' : 'ID Number:'}</span>
                <span className="font-mono font-bold text-slate-900">{idNumber || 'Verified Official ID'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isUrdu ? 'حیثیت:' : 'Verification Status:'}</span>
                <span className="font-bold text-emerald-700">APPROVED (Auto-Verified)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
