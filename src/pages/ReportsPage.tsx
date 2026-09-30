import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, QrCode, ExternalLink, 
  Award, CheckCircle2, ShieldCheck, Printer, Eye 
} from 'lucide-react';
import QRCode from 'qrcode';
import { CertifiedReport } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { generateReportPDF } from '../utils/reportPdf';
import { ActivePage } from '../components/Navigation/Navbar';

interface ReportsPageProps {
  onNavigate: (page: ActivePage) => void;
  onOpenPublicVerification?: (reportId: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate, onOpenPublicVerification }) => {
  const [reports, setReports] = useState<CertifiedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CertifiedReport | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const list = await firestoreService.getReports();
    setReports(list);
    if (list.length > 0 && !selectedReport) {
      handleSelectReport(list[0]);
    }
  };

  const handleSelectReport = async (rep: CertifiedReport) => {
    setSelectedReport(rep);
    try {
      // Generate QR Code data URL pointing to /verify/{reportId}
      const verifyUrl = `${window.location.origin}/verify/${rep.id}`;
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Official Quality Reports & Certificates</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Certified Quality Reports & Verification
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Download PDF certificates, inspect grade ratios, and generate public QR verification codes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reports List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
            Certified Reports ({reports.length})
          </h3>

          <div className="space-y-2.5">
            {reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => handleSelectReport(rep)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected
                      ? 'bg-stone-850 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{rep.reportNumber}</span>
                    <GradeBadge grade={rep.certifiedGrade} size="sm" />
                  </div>
                  <div className="text-xs font-semibold capitalize text-stone-200">
                    {rep.vegetableType} ({rep.variety})
                  </div>
                  <div className="text-[10px] text-stone-500 flex justify-between font-mono">
                    <span>{rep.totalQuantity} units</span>
                    <span>Score: {rep.averageScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Report Preview & QR Generator (8 cols) */}
        {selectedReport && (
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <div className="text-[11px] text-emerald-400 font-mono font-bold">
                  {selectedReport.reportNumber}
                </div>
                <h2 className="text-2xl font-black text-white capitalize mt-0.5">
                  {selectedReport.vegetableType} Quality Certificate
                </h2>
                <p className="text-xs text-stone-400">
                  Batch: <span className="font-mono text-stone-200">{selectedReport.batchId}</span> • Certified: {selectedReport.createdAt.split('T')[0]}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => generateReportPDF(selectedReport)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>

            {/* Certificate Card Preview */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 space-y-6">
              {/* Header inside Certificate */}
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧅</span>
                  <div>
                    <div className="font-black text-white text-base">AgriGrade Certified Produce Certificate</div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      VERIFICATION ID: {selectedReport.verificationId}
                    </div>
                  </div>
                </div>
                <GradeBadge grade={selectedReport.certifiedGrade} size="md" showSubtitle />
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Specimens</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedReport.totalQuantity}</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Quality Index</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{selectedReport.averageScore}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">AI Confidence</span>
                  <span className="font-mono font-bold text-blue-400 text-sm">{selectedReport.averageConfidence}%</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Human Reviews</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{selectedReport.humanReviewCount}</span>
                </div>
              </div>

              {/* QR Verification Card */}
              <div className="p-4 rounded-xl bg-stone-900 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Verification QR"
                      className="w-24 h-24 rounded-lg bg-white p-1 border border-stone-700 shadow-md shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Public QR Code Verification</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed max-w-sm">
                      Scan or share this link for buyer verification. Exposes only certified non-sensitive lot grades without leaking private operational data.
                    </p>
                    <div className="text-[10px] font-mono text-emerald-400/90 pt-1">
                      Target: /verify/{selectedReport.id}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPublicVerification) {
                      onOpenPublicVerification(selectedReport.id);
                    } else {
                      onNavigate('verify');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold border border-stone-700 flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Public Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Signoff */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800/80">
                <div>
                  Certified by: <strong className="text-stone-200">{selectedReport.certifiedBy}</strong>
                </div>
                <div className="font-mono text-[10px] text-stone-500">
                  {selectedReport.facilityName}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
