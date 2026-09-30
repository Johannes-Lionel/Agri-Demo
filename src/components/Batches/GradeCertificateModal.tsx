import React, { useRef } from 'react';
import { BatchLot } from '../../types/grading';
import { CROP_SPECIFICATIONS } from '../../data/produceStandards';
import { GradeBadge } from '../common/Badge';
import { 
  X, Printer, CheckCircle2, ShieldCheck, 
  QrCode, Award, Download, Calendar, MapPin, Scale
} from 'lucide-react';

interface GradeCertificateModalProps {
  batch: BatchLot | null;
  onClose: () => void;
}

export const GradeCertificateModal: React.FC<GradeCertificateModalProps> = ({ batch, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!batch) return null;

  const spec = CROP_SPECIFICATIONS[batch.crop];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-stone-200">Official Produce Grade Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Canvas */}
        <div ref={printRef} className="p-8 bg-stone-950 text-stone-100 space-y-6 print:bg-white print:text-black">
          {/* Certificate Header */}
          <div className="border-b-2 border-emerald-500/40 pb-6 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <span className="text-xl font-black tracking-tight text-white print:text-black">
                  Agri<span className="text-emerald-500">Grade</span> Inspection Authority
                </span>
              </div>
              <p className="text-xs text-stone-400 print:text-stone-600">
                International Horticultural Quality Assurance & Phytosanitary Traceability Standard
              </p>
              <div className="text-[11px] font-mono text-emerald-400 print:text-emerald-700 font-semibold pt-1">
                CERTIFICATE ID: CERT-{batch.lotNumber.replace('LOT-', '')}-2026-QA
              </div>
            </div>

            {/* Official Seal / Grade Badge */}
            <div className="text-right">
              <div className="text-[10px] text-stone-400 print:text-stone-600 uppercase font-semibold mb-1">
                Certified Grade Rating
              </div>
              <GradeBadge grade={batch.certifiedGrade} size="lg" showSubtitle />
            </div>
          </div>

          {/* Core Batch Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-stone-900/60 border border-stone-800 print:border-stone-300 print:bg-stone-50">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Lot Number</span>
              <span className="text-sm font-black font-mono text-white print:text-black">{batch.lotNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Commodity</span>
              <span className="text-sm font-bold text-emerald-400 print:text-emerald-800 flex items-center gap-1">
                <span>{spec.icon}</span> {batch.variety}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Batch Net Weight</span>
              <span className="text-sm font-bold font-mono text-stone-200 print:text-black">{batch.totalWeightKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Harvest Date</span>
              <span className="text-sm font-mono text-stone-300 print:text-black">{batch.harvestDate}</span>
            </div>
          </div>

          {/* Origin & Grower Traceability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-800/80 bg-stone-900/30 print:border-stone-200">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Origin & Provenance
              </h4>
              <div className="text-sm font-bold text-white print:text-black">{batch.growerName}</div>
              <div className="text-xs text-stone-400 print:text-stone-600 mt-0.5">{batch.farmOrchard}</div>
              <div className="text-[11px] text-stone-500 mt-2 font-mono">
                Geotag: Lat 46.8523° N, Lon 120.5059° W (Block Certified)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-800/80 bg-stone-900/30 print:border-stone-200">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Sampling Audit Data
              </h4>
              <div className="text-xs text-stone-300 print:text-black space-y-1">
                <div className="flex justify-between">
                  <span>Random Sample Units:</span>
                  <span className="font-mono font-bold">{batch.sampleCount} specimens</span>
                </div>
                <div className="flex justify-between">
                  <span>Batch Quality Index:</span>
                  <span className="font-mono font-bold text-emerald-400 print:text-emerald-700">{batch.scoreAvg}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Epidermal Defect Rate:</span>
                  <span className="font-mono font-bold">{batch.defectRateAvg}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Standards Verification */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 print:bg-emerald-50 print:border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 print:text-emerald-800 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Statutory Standard Verification
            </div>
            <p className="text-xs text-stone-300 print:text-stone-800 leading-relaxed">
              This agricultural lot was inspected in conformity with Codex Alimentarius Stan 299 and USDA Grade Class rules.
              The composite sample exhibits acceptable pulp firmness, characteristic color index, and defect rates below statutory tolerances for {batch.certifiedGrade.replace('_', ' ')}.
            </p>
            {batch.notes && (
              <p className="text-xs text-stone-400 print:text-stone-600 italic border-t border-emerald-500/20 pt-2 mt-2">
                " {batch.notes} "
              </p>
            )}
          </div>

          {/* Signoff & QR Code Footer */}
          <div className="border-t border-stone-800 print:border-stone-300 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center border border-stone-700 shadow-md">
                <QrCode className="w-14 h-14 text-stone-900" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white print:text-black">Digital Audit QR</div>
                <div className="text-[11px] text-stone-400 print:text-stone-600">Scan to verify cryptographic chain-of-custody</div>
                <div className="text-[10px] text-stone-500 font-mono mt-0.5">SHA-256: 7f4a...9b12</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-stone-400 print:text-stone-600">Inspected & Certified By:</div>
              <div className="text-sm font-bold text-white print:text-black font-mono">{batch.inspectorName}</div>
              <div className="text-[11px] text-emerald-400 print:text-emerald-700 italic font-serif mt-1">
                ✓ Digitally Signed & Sealed
              </div>
              <div className="text-[10px] text-stone-500">Date: {batch.inspectionDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
