import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Share2, QrCode, ShieldCheck, 
  CheckCircle2, FileText, ExternalLink, Check 
} from 'lucide-react';
import QRCode from 'qrcode';
import { CertifiedReport } from '../types';
import { firestoreService } from '../services/firestoreService';
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
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const list = await firestoreService.getReports();
    if (list.length > 0) {
      setReports(list);
      handleSelectReport(list[0]);
    } else {
      const sampleRep: CertifiedReport = {
        id: 'AO-2029-4142',
        reportNumber: 'AO-2029-4142',
        userId: 'usr-default',
        batchId: 'LOT-MANDI-2026-01',
        verificationId: 'VER-AGRI-2.3',
        vegetableType: 'Onion',
        variety: 'Allium Cepa Standard',
        growerOrigin: 'Mandi Procurement Bay #1',
        totalQuantity: 24,
        estimatedLotWeightKg: 4000,
        certifiedGrade: 'GRADE_A',
        gradeAPercent: 75,
        ursPercent: 25,
        averageScore: 92,
        averageConfidence: 94,
        counts: {
          totalCount: 24,
          goodCount: 18,
          defectiveCount: 6,
          goodPercent: 75,
          defectivePercent: 25,
        },
        gradeDistribution: { gradeA: 18, gradeB: 4, gradeC: 0, urs: 2, reject: 0 },
        defectSummary: {},
        humanReviewCount: 0,
        certifiedBy: 'Agrigrade Vision AI (Version 2.3)',
        facilityName: 'AgriGrade Mandi Center',
        publicVerificationUrl: '/verify/AO-2029-4142',
        createdAt: new Date().toISOString(),
      };
      setReports([sampleRep]);
      handleSelectReport(sampleRep);
    }
  };

  const handleSelectReport = async (rep: CertifiedReport) => {
    setSelectedReport(rep);
    try {
      const verifyUrl = `${window.location.origin}/verify/${rep.id}`;
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: { dark: '#0F1A13', light: '#FFFFFF' },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const handleDownload = () => {
    if (!current) return;
    const ok = generateReportPDF(current);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleShare = () => {
    if (navigator.share && current) {
      navigator.share({
        title: `Agrigrade Quality Slip - ${current.reportNumber}`,
        text: `Grade ${current.certifiedGrade === 'GRADE_A' ? 'A' : 'B'} certified for ${current.variety} lot.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Verification link copied to clipboard!');
    }
  };

  const current = selectedReport || reports[0];

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20 animate-in fade-in select-none">
      {/* Header matching 07 Quality Report */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-[#23492C]">Quality Report</h2>
        <div className="w-9" />
      </div>

      {current && (
        <div className="space-y-4">
          {/* Card 1: Summary of Analysis matching 07 Quality Report */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9DFCF] space-y-4">
            <h3 className="text-sm font-extrabold text-[#23492C]">Summary of Analysis</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Report ID</span>
                <span className="font-mono font-bold text-[#23492C]">{current.reportNumber}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Vegetable</span>
                <span className="font-bold text-[#23492C] capitalize">{current.vegetableType}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Count & Yield</span>
                <span className="font-bold text-[#0B7347]">
                  {current.counts?.totalCount || current.totalQuantity || 1} Total ({current.gradeAPercent || 75}% Good)
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Status</span>
                <span className="px-3 py-1 rounded-full bg-[#EAF2E9] text-[#0B7347] font-bold text-[11px]">
                  Certified
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Grade</span>
                <span className="font-black text-sm text-[#23492C]">
                  {current.certifiedGrade === 'GRADE_A' ? 'A (FAQ Standard)' : current.certifiedGrade.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F4EBDC]">
                <span className="text-[#0F1A13]/60 font-semibold">Confidence</span>
                <span className="font-bold text-[#23492C]">{current.averageConfidence || 94}%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#0F1A13]/60 font-semibold">Utilise</span>
                <span className="font-semibold text-[#0F1A13]">
                  {current.certifiedGrade === 'GRADE_A' ? 'Premium Export & Table' : 'Commercial Domestic'}
                </span>
              </div>
            </div>
          </div>

          {/* QR Verification Box matching 07 Quality Report */}
          <div className="bg-[#FAF6EE] rounded-3xl p-5 border border-[#E9DFCF] flex items-center justify-between gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white p-2 border border-[#D8E8D9] flex items-center justify-center shrink-0 shadow-sm">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-12 h-12 text-[#23492C]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="font-extrabold text-sm text-[#23492C]">Verified by Agrigrade AI</div>
              <p className="text-[11px] text-[#0F1A13]/60">
                Verified by (Version 2.3)
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPublicVerification) {
                      onOpenPublicVerification(current.id);
                    } else {
                      onNavigate('verify');
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B7347] hover:underline"
                >
                  <span>Open Public Ledger Record</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: "Download Report" & "Share" */}
          <div className="grid grid-cols-12 gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className={`col-span-8 py-3.5 rounded-full font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
                downloadSuccess
                  ? 'bg-[#23492C] text-white'
                  : 'bg-[#0B7347] hover:bg-[#3F5A3A] active:scale-[0.98] text-white'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="col-span-4 py-3.5 rounded-full bg-white hover:bg-[#FAF6EE] active:scale-[0.98] text-[#23492C] font-bold text-xs border border-[#E9DFCF] shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4 stroke-[2.2]" />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
