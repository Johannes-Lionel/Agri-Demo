import React, { useState } from 'react';
import { CropCategory } from '../../types/grading';
import { CROP_SPECIFICATIONS } from '../../data/produceStandards';
import { BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Ruler } from 'lucide-react';

export const StandardsGuide: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>('apple');
  const spec = CROP_SPECIFICATIONS[selectedCrop];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>International Regulatory Codex</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Produce Quality Grading Standards Matrix
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              Harmonized USDA Agricultural Marketing Service (AMS) & UNECE Working Party standards on Agricultural Quality Standards.
            </p>
          </div>

          {/* Crop Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(Object.keys(CROP_SPECIFICATIONS) as CropCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCrop(c)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  selectedCrop === c
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span>{CROP_SPECIFICATIONS[c].icon}</span>
                <span className="capitalize">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Standard View */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-stone-800 pb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{spec.icon}</span>
            <div>
              <h2 className="text-2xl font-black text-white">{spec.commonName}</h2>
              <p className="text-xs text-stone-400 font-mono italic">{spec.scientificName}</p>
            </div>
          </div>

          <div className="flex gap-4 text-right">
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Min. Brix Benchmark</div>
              <div className="text-lg font-black text-amber-400 font-mono">≥ {spec.minBrix}° Bx</div>
            </div>
            <div>
              <div className="text-[10px] text-stone-500 uppercase font-semibold">Caliber Sizing</div>
              <div className="text-lg font-black text-blue-400 font-mono">{spec.idealCaliberRange}</div>
            </div>
          </div>
        </div>

        {/* 3 Tier Standards Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Grade A */}
          <div className="p-6 rounded-2xl bg-stone-950 border border-emerald-500/30 space-y-4 relative overflow-hidden">
            <div className="w-1.5 h-full bg-emerald-500 absolute top-0 left-0" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                Grade A (Class Extra)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                ≥ {spec.gradeTolerances.gradeA.minScore} pts
              </span>
            </div>

            <div className="text-xs font-semibold text-stone-200">
              {spec.gradeTolerances.gradeA.usdaEquivalent}
            </div>

            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Max Defect Surface:</span>
                <span className="font-mono text-emerald-400 font-bold">≤ {spec.gradeTolerances.gradeA.maxDefectArea}%</span>
              </div>
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Minimum Color Blush:</span>
                <span className="font-mono text-emerald-400 font-bold">≥ {spec.gradeTolerances.gradeA.minColorMatch}%</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-400 block text-[11px] mb-1">Target Commercial Channel:</span>
                <p className="text-stone-200 leading-snug">{spec.gradeTolerances.gradeA.typicalDestination}</p>
              </div>
            </div>
          </div>

          {/* Grade B */}
          <div className="p-6 rounded-2xl bg-stone-950 border border-blue-500/30 space-y-4 relative overflow-hidden">
            <div className="w-1.5 h-full bg-blue-500 absolute top-0 left-0" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-blue-400 uppercase tracking-wider">
                Grade B (Class I)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                ≥ {spec.gradeTolerances.gradeB.minScore} pts
              </span>
            </div>

            <div className="text-xs font-semibold text-stone-200">
              {spec.gradeTolerances.gradeB.usdaEquivalent}
            </div>

            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Max Defect Surface:</span>
                <span className="font-mono text-blue-400 font-bold">≤ {spec.gradeTolerances.gradeB.maxDefectArea}%</span>
              </div>
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Minimum Color Blush:</span>
                <span className="font-mono text-blue-400 font-bold">≥ {spec.gradeTolerances.gradeB.minColorMatch}%</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-400 block text-[11px] mb-1">Target Commercial Channel:</span>
                <p className="text-stone-200 leading-snug">{spec.gradeTolerances.gradeB.typicalDestination}</p>
              </div>
            </div>
          </div>

          {/* Grade C */}
          <div className="p-6 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-4 relative overflow-hidden">
            <div className="w-1.5 h-full bg-amber-500 absolute top-0 left-0" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-amber-400 uppercase tracking-wider">
                Grade C (Class II)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                ≥ {spec.gradeTolerances.gradeC.minScore} pts
              </span>
            </div>

            <div className="text-xs font-semibold text-stone-200">
              {spec.gradeTolerances.gradeC.usdaEquivalent}
            </div>

            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Max Defect Surface:</span>
                <span className="font-mono text-amber-400 font-bold">≤ {spec.gradeTolerances.gradeC.maxDefectArea}%</span>
              </div>
              <div className="flex justify-between border-b border-stone-800/80 pb-1">
                <span className="text-stone-400">Minimum Color Blush:</span>
                <span className="font-mono text-amber-400 font-bold">≥ {spec.gradeTolerances.gradeC.minColorMatch}%</span>
              </div>
              <div className="pt-2">
                <span className="text-stone-400 block text-[11px] mb-1">Target Commercial Channel:</span>
                <p className="text-stone-200 leading-snug">{spec.gradeTolerances.gradeC.typicalDestination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Absolute Disqualification / Quarantine Rejection Conditions */}
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Statutory Disqualifications & Zero-Tolerance Rejection Thresholds</span>
          </div>
          <p className="text-xs text-stone-300">
            Specimens exhibiting any of the following physiological conditions or biotic infections are legally culled from consumer fresh packaging:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {spec.gradeTolerances.reject.reasons.map((reason, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-stone-900 border border-rose-500/20 text-xs text-stone-200 flex items-start gap-2">
                <span className="text-rose-400 font-bold font-mono">✕</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
