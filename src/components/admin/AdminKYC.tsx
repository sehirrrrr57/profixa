import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { KYCRecord, KYCStatus } from '../../types/index';
import { ShieldCheck, Check, X, RefreshCw, FileText, Camera, Eye } from 'lucide-react';

export const AdminKYC: React.FC = () => {
  const { showToast } = useToast();
  const [kycQueue, setKycQueue] = useState<KYCRecord[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KYCRecord | null>(null);
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
            <div className="space-y-2">
              <span className="font-bold text-[#142033] block">Uploaded Documents</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] text-center space-y-2">
                  <p className="text-[11px] font-bold text-[#667085]">Government ID (Front)</p>
                  {selectedKyc.documents.idFrontUrl ? (
                    <div className="h-32 bg-white rounded-lg border border-[#E5EAF0] flex items-center justify-center p-2">
                      <img
                        src={selectedKyc.documents.idFrontUrl}
                        alt="ID Front"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    <p className="py-8 text-[#98A2B3]">No file uploaded</p>
                  )}
                </div>

                <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E5EAF0] text-center space-y-2">
                  <p className="text-[11px] font-bold text-[#667085]">Biometric Selfie</p>
                  {selectedKyc.documents.selfieUrl ? (
                    <div className="h-32 bg-white rounded-lg border border-[#E5EAF0] flex items-center justify-center p-2">
                      <img
                        src={selectedKyc.documents.selfieUrl}
                        alt="Selfie"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  ) : (
                    <p className="py-8 text-[#98A2B3]">No selfie uploaded</p>
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
    </div>
  );
};
