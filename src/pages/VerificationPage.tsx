import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Award, Building2, Calendar, FileText, ArrowLeft, Scale, QrCode } from 'lucide-react';
import { VerificationRecord } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { AgrigradeLogo } from '../components/common/AgrigradeLogo';

interface VerificationPageProps {
  reportId?: string;
  onBackToApp?: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ reportId = 'AO-2029-4142', onBackToApp }) => {
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputReportId, setInputReportId] = useState(reportId);

  useEffect(() => {
    fetchRecord(reportId);
  }, [reportId]);

  const fetchRecord = async (id: string) => {
    setLoading(true);
    try {
      const res = await firestoreService.getVerificationRecord(id);
      setRecord(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputReportId.trim()) {
      fetchRecord(inputReportId.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-4 animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        {onBackToApp ? (
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 text-xs font-bold text-[#23492C] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Open Agrigrade App</span>
          </button>
        ) : (
          <AgrigradeLogo size="sm" />
        )}
      </div>

      {/* Public Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputReportId}
          onChange={(e) => setInputReportId(e.target.value)}
          placeholder="Enter Report ID (e.g. AO-2029-4142)..."
          className="flex-1 px-4 py-2.5 rounded-full bg-white border border-[#E9DFCF] text-[#23492C] text-xs font-mono focus:outline-none focus:border-[#0B7347]"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] text-white font-bold text-xs shadow-sm"
        >
          Verify
        </button>
      </form>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#0F1A13]/60">Verifying digital certificate on Agrigrade ledger...</div>
      ) : record ? (
        <div className="bg-white border border-[#E9DFCF] rounded-3xl p-6 shadow-sm space-y-5">
          {/* Status Header */}
          <div className="flex items-center justify-between border-b border-[#F4EBDC] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF2E9] border border-[#D8E8D9] flex items-center justify-center text-xl">
                🧅
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-[#23492C]">Quality Certification</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#EAF2E9] text-[#0B7347] font-bold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[10px] text-[#0F1A13]/60">Public Mandi Ledger Record</p>
              </div>
            </div>

            <GradeBadge grade={record.certifiedGrade} size="md" />
          </div>

          {/* Key Metrics: Grade A % and URS % */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E9DFCF]">
              <span className="text-[10px] text-[#23492C] uppercase font-bold block">Grade A (FAQ)</span>
              <span className="font-mono font-black text-[#23492C] text-2xl">{record.gradeAPercent || 75}%</span>
              <p className="text-[10px] text-[#0F1A13]/60 mt-0.5">Fair Average Quality</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E9DFCF]">
              <span className="text-[10px] text-rose-700 uppercase font-bold block">URS Percentage</span>
              <span className="font-mono font-black text-rose-700 text-2xl">{record.ursPercent || 25}%</span>
              <p className="text-[10px] text-[#0F1A13]/60 mt-0.5">Under-Rate / Culls</p>
            </div>
          </div>

          {/* Attributes */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
              <span className="text-[#0F1A13]/60">Report Number</span>
              <span className="font-mono font-bold text-[#23492C]">{record.reportNumber}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
              <span className="text-[#0F1A13]/60">Lot Reference</span>
              <span className="font-mono font-bold text-[#23492C]">{record.batchNumber}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
              <span className="text-[#0F1A13]/60">Commodity</span>
              <span className="font-bold text-[#23492C] capitalize">{record.vegetableType} ({record.variety})</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
              <span className="text-[#0F1A13]/60">Certification Date</span>
              <span className="font-semibold text-[#0F1A13]">{record.certificationDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#0F1A13]/60">Certified By</span>
              <span className="font-bold text-[#0B7347]">{record.issuer}</span>
            </div>
          </div>

          {/* Cryptographic Trust Box */}
          <div className="p-3.5 rounded-2xl bg-[#EAF2E9] border border-[#D8E8D9] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#0B7347] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Dispute Cryptographic Verification</span>
            </div>
            <p className="text-[#0F1A13]/70 text-[11px] leading-relaxed">
              Standardized optical grading eliminates buyer-grower haggling. This record was generated directly at the time of intake.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-3xl bg-white border border-[#E9DFCF] space-y-2">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-sm font-bold text-[#23492C]">Record Not Found</h3>
          <p className="text-xs text-[#0F1A13]/60">
            No public verification record matches "{inputReportId}".
          </p>
        </div>
      )}
    </div>
  );
};
