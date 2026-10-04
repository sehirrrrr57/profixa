import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../locales';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  SendHorizontal,
  QrCode,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { showToast } = useToast();
  const isUrdu = language === 'ur';

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket fields
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('DEPOSIT_WITHDRAWAL');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reply
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Telegram QR & copy state
  const [telegramQrDataUrl, setTelegramQrDataUrl] = useState<string>('');
  const [copiedTelegram, setCopiedTelegram] = useState(false);

  const telegramUsername = 'PROFIXA22';
  const telegramUrl = 'https://t.me/PROFIXA22';

  useEffect(() => {
    // Generate high-resolution green QR code matching the Telegram card
    QRCode.toDataURL(telegramUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#22c55e', // Vibrant Telegram green
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setTelegramQrDataUrl(url))
      .catch((err) => console.warn('Failed to generate Telegram QR:', err));
  }, []);

  const handleCopyTelegram = () => {
    navigator.clipboard.writeText(`@${telegramUsername}`);
    setCopiedTelegram(true);
    showToast('info', isUrdu ? 'کاپی ہو گیا' : 'Copied', `@${telegramUsername} copied to clipboard.`);
    setTimeout(() => setCopiedTelegram(false), 2000);
  };

  const loadTickets = async () => {
    try {
      const res = await api.getTickets();
      if (res.success) {
        setTickets(res.tickets);
        if (selectedTicket) {
          const updated = res.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.warn('Failed to load tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await api.createTicket({ subject, category, message });
      showToast('success', isUrdu ? 'ٹکٹ بن گئی ہے' : 'Ticket Dispatched', isUrdu ? 'ہماری سپورٹ ٹیم جلد جائزہ لے گی۔' : 'Our support team will review your inquiry.');
      setSubject('');
      setMessage('');
      setShowCreateModal(false);
      await loadTickets();
      if (res.ticket) setSelectedTicket(res.ticket);
    } catch (err: any) {
      showToast('error', 'Failed to create ticket', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;
    setIsReplying(true);
    try {
      const res = await api.replyTicket(selectedTicket.id, replyContent);
      setReplyContent('');
      await loadTickets();
      if (res.ticket) setSelectedTicket(res.ticket);
    } catch (err: any) {
      showToast('error', 'Reply failed', err.message);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03]">
              <LifeBuoy className="w-5 h-5 text-[#451A03]" />
            </span>
            <span>{isUrdu ? 'ہیلپ اور سپورٹ ڈیسک' : t.nav.support}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isUrdu
              ? '24/7 اکاؤنٹ، ٹرانزیکشن، کلیمز اور ریوارڈز سے متعلق براہ راست رہنمائی اور ٹکٹ سسٹم۔'
              : '24/7 dedicated financial assistance, compliance auditing, ticket inquiry, and Telegram live support.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{isUrdu ? 'نئی سپورٹ ٹکٹ بنائیں' : 'Open Support Ticket'}</span>
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. TELEGRAM DIRECT SUPPORT & SCANNABLE QR CARD                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-[#FDF8F5] to-emerald-50/40 rounded-3xl border border-[#EADBCE] p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Official Telegram Info, Notices & Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Official Telegram Live Support Channel</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{isUrdu ? 'ٹیلیگرام براہ راست سپورٹ' : 'Telegram Direct Help & Support'}</span>
                <span className="text-emerald-600 font-mono">@{telegramUsername}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isUrdu
                  ? 'اگر آپ کو اپنے اکاؤنٹ، ڈپازٹ، پلان یا ودڈراول میں کوئی بھی مسئلہ درپیش ہے تو آپ ہمارے آفیشل ٹیلیگرام پر رابطہ کر سکتے ہیں۔'
                  : 'For real-time account, deposit, or withdrawal assistance, connect directly with our official Telegram support agent.'}
              </p>
            </div>

            {/* Crucial Instructions: 1. Ticket First, 2. VPN Required */}
            <div className="space-y-2.5 pt-1">
              {/* Notice 1: Open Ticket First */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EADBCE] flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#451A03]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isUrdu ? '1. رابطہ کرنے سے پہلے ٹکٹ بنائیں' : '1. Open a Support Ticket First'}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {isUrdu
                      ? 'ٹیلیگرام پر بات کرنے سے پہلے اوپر دیے گئے بٹن سے اپنی سپورٹ ٹکٹ لازمی بنا لیں تاکہ ہم ٹائم نکال کر آپ کا اکاؤنٹ ریکارڈ چیک کر کے فوری رسپانس کر سکیں۔'
                      : 'Before contacting on Telegram, please open a support ticket first so our staff can pull up your transaction logs and respond promptly.'}
                  </p>
                </div>
              </div>

              {/* Notice 2: VPN Required */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>{isUrdu ? '2. وی پی این (VPN) لگانا ضروری ہے' : '2. VPN Required to Open Telegram'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] uppercase font-extrabold">Notice</span>
                  </h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                    {isUrdu
                      ? 'ٹیلیگرام ہماری سائیڈ اور بعض نیٹ ورکس پر بنا وی پی این لگائے نہیں چلتا۔ اس لیے اپنے فون یا کمپیوٹر پر VPN آن کر کے ٹیلیگرام یوزر نیم پر بات کریں۔'
                      : 'Telegram may not open without a VPN on certain local networks. Please turn on a VPN on your device before clicking or scanning to chat.'}
                  </p>
                </div>
              </div>

              {/* Notice 3: Second Phone Scanning */}
              <div className="p-3 rounded-2xl bg-white border border-[#EADBCE] flex items-center gap-3 shadow-2xs text-[11px] text-slate-600">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isUrdu
                    ? 'دوسرے فون کے کیمرے یا ٹیلیگرام ایپ سے دائیں جانب دیا گیا کیو آر کوڈ اسکین کر کے ڈائریکٹ رابطہ کریں۔'
                    : 'If you have a second phone, scan the QR code with your camera or Telegram scanner to connect instantly.'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Open Telegram + Copy Handle */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                <SendHorizontal className="w-4 h-4 text-white" />
                <span>{isUrdu ? 'ٹیلیگرام پر جائیں (@PROFIXA22)' : 'Open in Telegram (@PROFIXA22)'}</span>
                <ExternalLink className="w-3 h-3 text-emerald-100" />
              </a>

              <button
                type="button"
                onClick={handleCopyTelegram}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FDF8F5] text-slate-800 border border-[#EADBCE] font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                {copiedTelegram ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#451A03]" />}
                <span>{copiedTelegram ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : `@${telegramUsername}`}</span>
              </button>
            </div>
          </div>

          {/* Right Column: High-Fidelity Telegram QR Code Card matching user screenshot */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[290px] bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-xl text-center space-y-3.5">
              {/* Top Profixa Logo Badge */}
              <div className="flex justify-center -mt-9">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-3 border-amber-400 p-2 shadow-lg flex flex-col items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    <span className="text-white font-black text-xs tracking-tighter">P</span>
                    <span className="text-amber-400 text-xs">📈</span>
                  </div>
                  <span className="text-[7px] font-extrabold tracking-wider text-white uppercase">Profixa</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Telegram Support</span>
                <span className="text-xs font-bold text-slate-800">Scan to Connect Live</span>
              </div>

              {/* Telegram Green QR Code Image */}
              <div className="relative mx-auto w-52 h-52 bg-white rounded-2xl border border-slate-100 p-2 flex items-center justify-center shadow-inner group">
                {telegramQrDataUrl ? (
                  <img
                    src={telegramQrDataUrl}
                    alt="Telegram QR @PROFIXA22"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}

                {/* Telegram Paper Plane Icon in QR Center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md border-2 border-emerald-500 flex items-center justify-center">
                    <SendHorizontal className="w-5 h-5 text-emerald-600 -rotate-12 translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Bold Green Username Label matching screenshot */}
              <div className="pt-1 pb-1">
                <p className="text-lg font-black text-emerald-600 tracking-wide font-mono">
                  @{telegramUsername}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Point camera or Telegram scanner to start chat
                </p>
              </div>

              {/* 1-Click Action on Card */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Click to Chat Directly</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. SUPPORT TICKETS INQUIRY DESK (Preserved & Enhanced)             */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {isUrdu ? 'آپ کی سپورٹ ٹکٹس' : 'Your Ticket Inquiries'}
            </h3>
            <p className="text-xs text-slate-500">
              {isUrdu
                ? 'کسی بھی اکاؤنٹ کے مسئلے کی تصدیق اور ریکارڈ کے لیے باقاعدہ ٹکٹ کھولیں۔'
                : 'Formal ledger audit requests, compliance checks, and transaction logs.'}
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Tickets List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EADBCE] shadow-xs p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Active & Closed ({tickets.length})
            </h4>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDF8F5] border border-[#EADBCE] mx-auto flex items-center justify-center text-[#451A03]">
                    <LifeBuoy className="w-6 h-6 text-[#451A03]" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">No support tickets opened yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs font-bold text-[#451A03] hover:underline"
                  >
                    + Open your first ticket
                  </button>
                </div>
              ) : (
                tickets.map((tk) => (
                  <button
                    key={tk.id}
                    onClick={() => setSelectedTicket(tk)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedTicket?.id === tk.id
                        ? 'border-[#451A03] bg-[#FDF8F5] shadow-xs'
                        : 'border-[#EADBCE] hover:bg-[#FAF7F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">{tk.category}</span>
                      <Badge
                        variant={tk.status === 'RESOLVED' ? 'success' : 'primary'}
                        size="sm"
                      >
                        {tk.status}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{tk.subject}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(tk.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Selected Ticket Thread */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EADBCE] shadow-xs p-6 flex flex-col justify-between min-h-[460px]">
            {selectedTicket ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#EADBCE]">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Category: {selectedTicket.category}</p>
                    </div>
                    <Badge variant={selectedTicket.status === 'RESOLVED' ? 'success' : 'primary'} size="sm">
                      {selectedTicket.status}
                    </Badge>
                  </div>

                  {/* Messages thread */}
                  <div className="py-4 space-y-4 max-h-80 overflow-y-auto pr-1">
                    {selectedTicket.messages.map((m: any) => {
                      const isMe = m.sender === 'USER';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                            <span>{m.senderName}</span>
                            <span>•</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#451A03] text-white rounded-tr-none'
                                : 'bg-[#FDF8F5] text-slate-900 border border-[#EADBCE] rounded-tl-none'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply Box */}
                <form onSubmit={handleReply} className="pt-4 border-t border-[#EADBCE] flex items-center gap-3">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your response to support staff..."
                    className="flex-1 h-11 px-4 text-xs bg-[#FDF8F5] border border-[#EADBCE] rounded-xl outline-none focus:border-[#451A03] focus:bg-white text-slate-900"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isReplying}
                    disabled={!replyContent.trim()}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-[#EADBCE] mb-3" />
                <p className="text-sm font-semibold text-slate-800">No ticket selected</p>
                <p className="text-xs mt-1 text-slate-500">
                  Select an existing inquiry from the list or create a new support ticket.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#FDF8F5] border border-[#EADBCE] text-[#451A03] text-xs font-bold hover:bg-[#F5EDE8] transition-colors"
                >
                  Create Support Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isUrdu ? 'نئی سپورٹ ٹکٹ بنائیں' : 'Open Support Ticket'}
        subtitle={
          isUrdu
            ? 'اپنی ٹرانزیکشن، ڈپازٹ، یا اکاؤنٹ سے متعلق استفسار درج کریں۔'
            : 'Submit your inquiry to our financial protocol & compliance desk.'
        }
        maxWidth="md"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none font-medium text-slate-900"
            >
              <option value="DEPOSIT_WITHDRAWAL">Deposit & Withdrawal Inquiry</option>
              <option value="REWARD_PLAN">Reward Plans & Daily Returns</option>
              <option value="KYC_VERIFICATION">KYC Identity Verification</option>
              <option value="SECURITY_2FA">Security & 2FA Questions</option>
              <option value="GENERAL">General Platform Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question regarding deposit confirmation or balance"
              className="w-full h-11 px-4 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Detailed Message *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide transaction hashes, amounts, plan names, or questions..."
              className="w-full p-3.5 text-xs bg-white border border-[#EADBCE] rounded-xl focus:border-[#451A03] outline-none text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isCreating}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
