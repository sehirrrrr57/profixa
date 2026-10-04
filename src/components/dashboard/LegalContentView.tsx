import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../locales';
import { api } from '../../lib/api';
import { FileText, Shield, AlertTriangle, Globe, TrendingUp } from 'lucide-react';

export const LegalContentView: React.FC<{ initialSlug?: string }> = ({ initialSlug = 'trading-profit-policy' }) => {
  const { language } = useTranslation();
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [pageData, setPageData] = useState<any>(null);
  const [contentLang, setContentLang] = useState<'en' | 'ur'>(language === 'ur' ? 'ur' : 'en');
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { slug: 'trading-profit-policy', label: 'Trading & Profit Policy' },
    { slug: 'terms-and-conditions', label: 'Terms & Conditions' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'risk-disclosure', label: 'Risk Disclosure' },
    { slug: 'kyc-policy', label: 'KYC/AML Policy' },
  ];

  const loadContent = async (slug: string) => {
    setIsLoading(true);
    try {
      const res = await api.getContentPage(slug);
      if (res.success) setPageData(res.page);
    } catch (err) {
      console.warn('Failed to load legal content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent(activeSlug);
  }, [activeSlug]);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Legal & Trading Policies</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent trading operations, capital management, and profit distribution rules.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#EADBCE]">
          <button
            type="button"
            onClick={() => setContentLang('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              contentLang === 'en' ? 'bg-[#451A03] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setContentLang('ur')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              contentLang === 'ur' ? 'bg-[#451A03] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اردو
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white p-1.5 border border-[#EADBCE] shadow-2xs overflow-x-auto gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveSlug(tab.slug)}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeSlug === tab.slug
                ? 'bg-[#451A03] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#451A03] hover:bg-[#FDF8F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 sm:p-10 shadow-2xs space-y-6">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading policy document...</div>
        ) : pageData ? (
          <article
            className={`prose max-w-none text-slate-900 leading-relaxed ${
              contentLang === 'ur' ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EADBCE] mb-6">
              <h2 className="text-xl font-black text-slate-900">
                {contentLang === 'ur' ? pageData.titleUr : pageData.titleEn}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
                Version {pageData.version}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed space-y-4">
              {contentLang === 'ur' ? pageData.contentUr : pageData.contentEn}
            </div>

            <div className="pt-8 border-t border-[#EADBCE] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Profixa Compliance & Trading Risk Framework</span>
              <span>Last Updated: {new Date(pageData.lastUpdated).toLocaleDateString()}</span>
            </div>
          </article>
        ) : (
          <div className="py-16 text-center text-xs text-rose-500">Document could not be retrieved.</div>
        )}
      </div>
    </div>
  );
};
