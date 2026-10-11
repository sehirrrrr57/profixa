import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { KYCRecord, KYCStatus } from '../../types/index';
import { ShieldCheck, Check, X, RefreshCw, FileText, Camera, Eye, Download, ExternalLink, ZoomIn } from 'lucide-react';

export const AdminKYC: React.FC = () => {
  const { showToast } = useToast();
  const [kycQueue, setKycQueue] = useState<KYCRecord[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KYCRecord | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<{ url: string; title: string; applicantName: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadQueue = async () => {
    try {
      const res = await api.getAdminKYCQueue();
      if (res.success) setKycQueue(res.queue);
    } catch (err) {
      console.warn('Failed to load KYC queue:', err);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (userId: string, decision: KYCStatus) => {
    setIsProcessing(true);
    try {
      const res = await api.reviewKYC(userId, decision, adminNotes);
      showToast('success', 'KYC Review Decision Recorded', res.message);
      setSelectedKyc(null);
      setAdminNotes('');
      await loadQueue();
    } catch (err: any) {
      showToast('error', 'Decision failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('success', 'Download Started', `${filename} downloaded successfully.`);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142033] tracking-tight">KYC Review & Compliance Desk</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Audit submitted identity documents, verify photos, and grant Tier 1 platform access.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadQueue} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Queue
        </Button>
      </div>

      {/* KYC Queue Table */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        {kycQueue.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#667085]">
            No KYC submissions currently in the compliance queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#E5EAF0] text-[#667085] font-semibold">
                  <th className="py-3 px-4">Applicant Legal Name</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">ID Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Documents Uploaded</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {kycQueue.map((item) => (
                  <tr key={item.userId} className="hover:bg-[#F7F9FC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#142033]">{item.fullName}</td>
                    <td className="py-3.5 px-4 text-[#667085]">{item.country}</td>
                    <td className="py-3.5 px-4 font-mono">{item.idNumber}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.status === 'APPROVED'
                            ? 'success'
                            : item.status === 'PENDING_REVIEW'
                            ? 'warning'
                            : item.status === 'REJECTED'
                            ? 'danger'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[#159A6B] font-semibold">
                        {item.documents.idFrontUrl && item.documents.selfieUrl
                          ? 'ID & Selfie Complete'
                          : 'Partial Uploads'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedKyc(item);
                          setAdminNotes(item.documents.adminNotes || '');
                        }}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Audit Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Audit Modal */}
      {selectedKyc && (
        <Modal
          isOpen={!!selectedKyc}
          onClose={() => setSelectedKyc(null)}
          title={`KYC Compliance Audit: ${selectedKyc.fullName}`}
          subtitle={`User ID: ${selectedKyc.userId}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Applicant Details */}
            <div className="p-4 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#667085] block">Full Name</span>
                <span className="font-bold text-[#142033]">{selectedKyc.fullName}</span>
              </div>
              <div>
                <span className="text-[#667085] block">Date of Birth</span>
                <span className="font-semibold text-[#142033]">{selectedKyc.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-[#667085] block">Country</span>
                <span className="font-semibold text-[#142033]">{selectedKyc.country}</span>
              </div>
              <div>
                <span className="text-[#667085] block">ID Document Number</span>
                <span className="font-mono text-[#142033]">{selectedKyc.idNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#667085] block">Permanent Address</span>
                <span className="text-[#142033]">{selectedKyc.address}</span>
              </div>
            </div>

            {/* Document Previews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#142033] text-xs">Uploaded Compliance Documents</span>
                <span className="text-[11px] text-slate-500">Click any document to inspect in high resolution or download directly</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* ID Front */}
                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Government ID (Front)</p>
                      {selectedKyc.documents.idFrontUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Uploaded
                        </span>
                      )}
                    </div>
                    {selectedKyc.documents.idFrontUrl ? (
                      <div
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.idFrontUrl!, title: 'Government ID (Front)', applicantName: selectedKyc.fullName })}
                        className="h-36 bg-white rounded-lg border border-[#EADBCE] flex items-center justify-center p-1.5 cursor-pointer group relative overflow-hidden"
                      >
                        <img
                          src={selectedKyc.documents.idFrontUrl}
                          alt="ID Front"
                          className="max-h-full max-w-full object-contain rounded group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 bg-white rounded-lg border border-dashed border-[#EADBCE] flex flex-col items-center justify-center text-slate-400 text-[11px]">
                        <FileText className="w-5 h-5 mb-1 text-slate-300" />
                        <span>Not Uploaded</span>
                      </div>
                    )}
                  </div>
                  {selectedKyc.documents.idFrontUrl && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#EADBCE]">
                      <button
                        type="button"
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.idFrontUrl!, title: 'Government ID (Front)', applicantName: selectedKyc.fullName })}
                        className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-[#F5EDE8] border border-[#EADBCE] text-[#451A03] font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>View Clear</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(selectedKyc.documents.idFrontUrl!, `ID_Front_${selectedKyc.fullName.replace(/\s+/g, '_')}.png`)}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#451A03] hover:bg-[#341402] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ID Back */}
                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Government ID (Back)</p>
                      {selectedKyc.documents.idBackUrl ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </div>
                    {selectedKyc.documents.idBackUrl ? (
                      <div
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.idBackUrl!, title: 'Government ID (Back)', applicantName: selectedKyc.fullName })}
                        className="h-36 bg-white rounded-lg border border-[#EADBCE] flex items-center justify-center p-1.5 cursor-pointer group relative overflow-hidden"
                      >
                        <img
                          src={selectedKyc.documents.idBackUrl}
                          alt="ID Back"
                          className="max-h-full max-w-full object-contain rounded group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 bg-white rounded-lg border border-dashed border-[#EADBCE] flex flex-col items-center justify-center text-slate-400 text-[11px]">
                        <FileText className="w-5 h-5 mb-1 text-slate-300" />
                        <span>Not Provided</span>
                      </div>
                    )}
                  </div>
                  {selectedKyc.documents.idBackUrl && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#EADBCE]">
                      <button
                        type="button"
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.idBackUrl!, title: 'Government ID (Back)', applicantName: selectedKyc.fullName })}
                        className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-[#F5EDE8] border border-[#EADBCE] text-[#451A03] font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>View Clear</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(selectedKyc.documents.idBackUrl!, `ID_Back_${selectedKyc.fullName.replace(/\s+/g, '_')}.png`)}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#451A03] hover:bg-[#341402] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Biometric Selfie */}
                <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EADBCE] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Biometric Selfie</p>
                      {selectedKyc.documents.selfieUrl ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </div>
                    {selectedKyc.documents.selfieUrl ? (
                      <div
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.selfieUrl!, title: 'Biometric Selfie', applicantName: selectedKyc.fullName })}
                        className="h-36 bg-white rounded-lg border border-[#EADBCE] flex items-center justify-center p-1.5 cursor-pointer group relative overflow-hidden"
                      >
                        <img
                          src={selectedKyc.documents.selfieUrl}
                          alt="Selfie"
                          className="max-h-full max-w-full object-contain rounded group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 bg-white rounded-lg border border-dashed border-[#EADBCE] flex flex-col items-center justify-center text-slate-400 text-[11px]">
                        <Camera className="w-5 h-5 mb-1 text-slate-300" />
                        <span>No Selfie Attached</span>
                      </div>
                    )}
                  </div>
                  {selectedKyc.documents.selfieUrl && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#EADBCE]">
                      <button
                        type="button"
                        onClick={() => setSelectedDocPreview({ url: selectedKyc.documents.selfieUrl!, title: 'Biometric Selfie', applicantName: selectedKyc.fullName })}
                        className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-[#F5EDE8] border border-[#EADBCE] text-[#451A03] font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>View Clear</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(selectedKyc.documents.selfieUrl!, `Selfie_${selectedKyc.fullName.replace(/\s+/g, '_')}.png`)}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#451A03] hover:bg-[#341402] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviewer Feedback Notes */}
            <div>
              <label className="block font-semibold text-[#142033] mb-1">
                Compliance Audit Notes (visible to user on rejection / resubmission)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional explanation or reason for feedback..."
                className="w-full p-2.5 text-xs bg-white border border-[#E5EAF0] rounded-xl outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5EAF0]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision(selectedKyc.userId, 'REQUIRES_RESUBMISSION')}
                isLoading={isProcessing}
              >
                Request Resubmission
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDecision(selectedKyc.userId, 'REJECTED')}
                isLoading={isProcessing}
              >
                Reject Verification
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleDecision(selectedKyc.userId, 'APPROVED')}
                isLoading={isProcessing}
                icon={<Check className="w-4 h-4" />}
              >
                Approve KYC Verification
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* High-Resolution Document Inspection Modal Viewer */}
      <Modal
        isOpen={!!selectedDocPreview}
        onClose={() => setSelectedDocPreview(null)}
        title={selectedDocPreview ? `${selectedDocPreview.title} — ${selectedDocPreview.applicantName}` : 'Document Inspection'}
        subtitle="High-resolution compliance audit inspection with direct download"
        maxWidth="lg"
      >
        {selectedDocPreview && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-[#EADBCE] bg-[#FAF7F5] flex items-center justify-center p-2">
              <img
                src={selectedDocPreview.url}
                alt={selectedDocPreview.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EADBCE]">
              <span className="text-slate-500 font-medium text-xs">Verify that name, dates, photo, and ID numbers match applicant details.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(selectedDocPreview.url, `${selectedDocPreview.title.replace(/\s+/g, '_')}_${selectedDocPreview.applicantName.replace(/\s+/g, '_')}.png`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#451A03] hover:bg-[#341402] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <a
                  href={selectedDocPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#F5EDE8] border border-[#EADBCE] text-slate-800 font-bold text-xs transition-all cursor-pointer"
                >
                  <span>Open Full View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
