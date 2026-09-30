import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Award, Building2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { VerificationRecord } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';

interface VerificationPageProps {
  reportId?: string;
  onBackToApp?: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ reportId = 'rep-on-2026-01', onBackToApp }) => {
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
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8 animate-in fade-in">
      {onBackToApp && (
        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Public Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputReportId}
          onChange={(e) => setInputReportId(e.target.value)}
          placeholder="Enter Report ID / Verification ID..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
        >
          Verify
        </button>
      </form>

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400">Verifying digital certificate records...</div>
      ) : record ? (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Verification Status Banner */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
                🧅
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">AgriGrade Certificate Verification</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                    AUTHENTIC
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">Public Verification Ledger Record</p>
              </div>
            </div>

            <GradeBadge grade={record.certifiedGrade} size="md" showSubtitle />
          </div>

          {/* Certificate Attributes */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Report Identifier</span>
              <span className="font-mono font-bold text-white text-sm">{record.reportNumber}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Batch Reference</span>
              <span className="font-mono font-bold text-white text-sm">{record.batchNumber}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Produce Commodity</span>
              <span className="font-bold text-emerald-400 capitalize">{record.vegetableType} ({record.variety})</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">Quality Score</span>
              <span className="font-mono font-bold text-white text-sm">{record.overallQualityScore}/100</span>
            </div>
          </div>

          {/* Issuer details */}
          <div className="p-4 rounded-xl bg-stone-950 border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Tamper-Evident Record</span>
            </div>
            <p className="text-stone-300 leading-relaxed text-[11px]">
              This record was issued by <strong>{record.issuer}</strong> at <strong>{record.facilityName}</strong> on {record.certificationDate}.
              The audited sampling lot complies with certified quality grading standards.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-base font-bold text-white">Record Not Found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            No public verification record matches "{inputReportId}". Please check the QR code link.
          </p>
        </div>
      )}
    </div>
  );
};
