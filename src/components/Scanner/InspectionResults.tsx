import React, { useState } from 'react';
import { InspectionResult } from '../../types/grading';
import { GradeBadge } from '../common/Badge';
import { 
  Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  Layers, ArrowRight, ShieldCheck, ThermometerSnowflake, 
  DollarSign, FileBadge, Info
} from 'lucide-react';

interface InspectionResultsProps {
  result: InspectionResult;
  onNewScan: () => void;
  onCreateLotFromScan: (result: InspectionResult) => void;
}

export const InspectionResults: React.FC<InspectionResultsProps> = ({
  result,
  onNewScan,
  onCreateLotFromScan,
}) => {
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 88) return 'text-emerald-400 border-emerald-500/50';
    if (score >= 70) return 'text-blue-400 border-blue-500/50';
    if (score >= 50) return 'text-amber-400 border-amber-500/50';
    return 'text-rose-400 border-rose-500/50';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Summary */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-black text-white">{result.cropName}</span>
              <GradeBadge grade={result.assignedGrade} size="lg" showSubtitle />
              <span className="text-xs px-2.5 py-1 rounded bg-stone-800 text-stone-300 font-mono">
                {result.variety}
              </span>
            </div>
            <p className="text-sm text-stone-400">
              Inspection ID: <span className="font-mono text-stone-300">{result.id}</span> • Certified at{' '}
              {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">Quality Index</div>
              <div className="text-3xl font-black text-white tracking-tight">
                {result.overallScore}<span className="text-lg text-stone-500 font-normal">/100</span>
              </div>
            </div>

            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-2xl ${getScoreColor(result.overallScore)} bg-stone-950/60 shadow-inner`}>
              {result.assignedGrade === 'GRADE_A' ? 'A' :
               result.assignedGrade === 'GRADE_B' ? 'B' :
               result.assignedGrade === 'GRADE_C' ? 'C' : 'R'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Analysis on Left, Metrics & Routing on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image with Defect Overlays */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Optical Detection Layer
              </span>
              <button
                type="button"
                onClick={() => setShowOverlays(!showOverlays)}
                className={`text-xs px-2.5 py-1 rounded-md transition font-medium border ${
                  showOverlays
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {showOverlays ? 'Defects: Visible' : 'Defects: Hidden'}
              </button>
            </div>

            <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-950 border border-stone-800/80">
              <img
                src={result.imageUrl}
                alt={result.sampleName}
                className="w-full h-full object-cover"
              />

              {/* Defect Bounding Boxes */}
              {showOverlays &&
                result.defects.map((def) => {
                  const isSelected = selectedDefectId === def.id;
                  const borderClass =
                    def.severity === 'critical'
                      ? 'border-rose-500 bg-rose-500/20'
                      : def.severity === 'moderate'
                      ? 'border-amber-500 bg-amber-500/20'
                      : 'border-yellow-400 bg-yellow-400/20';

                  return (
                    <div
                      key={def.id}
                      onClick={() => setSelectedDefectId(isSelected ? null : def.id)}
                      style={{
                        left: `${def.box.x}%`,
                        top: `${def.box.y}%`,
                        width: `${def.box.w}%`,
                        height: `${def.box.h}%`,
                      }}
                      className={`absolute border-2 rounded cursor-pointer transition-all duration-200 ${borderClass} ${
                        isSelected ? 'ring-2 ring-white scale-105 z-20' : 'hover:opacity-90'
                      }`}
                    >
                      <span className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-stone-950/90 text-white border border-stone-700 whitespace-nowrap shadow-md pointer-events-none">
                        {def.label} ({Math.round(def.confidence * 100)}%)
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Detected Anomalies List */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-stone-400 px-1">
                Detected Surface Anomalies ({result.defects.length})
              </div>

              {result.defects.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No physiological blemishes or surface lesions detected.</span>
                </div>
              ) : (
                result.defects.map((def) => (
                  <div
                    key={def.id}
                    onClick={() => setSelectedDefectId(selectedDefectId === def.id ? null : def.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedDefectId === def.id
                        ? 'bg-stone-800 border-emerald-500/60 shadow-sm'
                        : 'bg-stone-950/50 border-stone-800/80 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          def.severity === 'critical'
                            ? 'bg-rose-500'
                            : def.severity === 'moderate'
                            ? 'bg-amber-500'
                            : 'bg-yellow-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-stone-200">{def.label}</div>
                        <div className="text-[11px] text-stone-400 capitalize">
                          Severity: {def.severity} • Confidence: {Math.round(def.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">
                      -{def.impactScore} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNewScan}
              className="flex-1 py-2.5 rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-800 text-stone-200 text-sm font-semibold transition text-center"
            >
              Scan Another Specimen
            </button>
            <button
              type="button"
              onClick={() => onCreateLotFromScan(result)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <FileBadge className="w-4 h-4" />
              <span>Create Certified Lot</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Metrics, Compliance, Market Valuation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Physicochemical & Optical Metrics */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Quality Attributes & Organoleptic Indices
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Brix */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Sugar (Brix)</span>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {result.metrics.estimatedBrix}° <span className="text-xs text-stone-500 font-normal">Bx</span>
                </div>
                <div className="text-[10px] text-stone-500">Refractometric Est.</div>
              </div>

              {/* Firmness */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Pulp Firmness</span>
                <div className="text-xl font-black text-teal-400 font-mono">
                  {result.metrics.firmnessKg} <span className="text-xs text-stone-500 font-normal">kg/cm²</span>
                </div>
                <div className="text-[10px] text-stone-500">Penetrometer equiv.</div>
              </div>

              {/* Caliber */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Caliber / Size</span>
                <div className="text-xl font-black text-blue-400 font-mono">
                  {result.metrics.caliberMm} <span className="text-xs text-stone-500 font-normal">mm</span>
                </div>
                <div className="text-[10px] text-stone-500">Equatorial diameter</div>
              </div>

              {/* Surface Defect */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Defect Area</span>
                <div className={`text-xl font-black font-mono ${result.metrics.surfaceDefectPercent > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.metrics.surfaceDefectPercent}%
                </div>
                <div className="text-[10px] text-stone-500">Epidermis ratio</div>
              </div>
            </div>

            {/* Gauges / Progress Bars */}
            <div className="space-y-3 pt-2">
              {/* Color Uniformity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">Color Uniformity & Blush Match</span>
                  <span className="font-mono text-emerald-400 font-bold">{result.metrics.colorUniformity}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full"
                    style={{ width: `${result.metrics.colorUniformity}%` }}
                  />
                </div>
              </div>

              {/* Ripeness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">Ripeness Stage (Anthocyanin/Carotenoid index)</span>
                  <span className="font-mono text-amber-400 font-bold">{result.metrics.ripenessPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-400 rounded-full"
                    style={{ width: `${result.metrics.ripenessPercentage}%` }}
                  />
                </div>
              </div>

              {/* Shape Symmetry */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">Morphological Symmetry & Lobing</span>
                  <span className="font-mono text-blue-400 font-bold">{result.metrics.shapeSymmetry}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full"
                    style={{ width: `${result.metrics.shapeSymmetry}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Shelf Life Estimation */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThermometerSnowflake className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-stone-200">Preservation & Shelf-Life Projection</div>
                  <div className="text-[11px] text-stone-400">Based on turgor pressure and respiration rate</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] text-stone-400 uppercase">Ambient (20°C)</div>
                  <div className="text-sm font-bold text-stone-200 font-mono">
                    ~{result.metrics.estimatedShelfLifeDays.ambient} days
                  </div>
                </div>
                <div className="border-l border-stone-800 pl-4">
                  <div className="text-[10px] text-cyan-400 uppercase font-semibold">Cold Storage (3°C)</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono">
                    ~{result.metrics.estimatedShelfLifeDays.coldChain} days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Market Routing Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Standard Compliance & Commercial Channel
            </h3>

            {/* Compliance Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-medium">USDA Grade Equivalent</div>
                <div className="text-xs font-bold text-stone-200 mt-0.5 truncate">
                  {result.compliance.usdaStandard}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-medium">UNECE Classification</div>
                <div className="text-xs font-bold text-stone-200 mt-0.5 truncate">
                  {result.compliance.uneceClass}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                <div className="text-[10px] text-stone-400 uppercase font-medium">Export Clearance</div>
                <div className={`text-xs font-bold mt-0.5 flex items-center gap-1.5 ${result.compliance.exportEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {result.compliance.exportEligible ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved (Class Extra)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Domestic / Processing Only</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Economic Channel */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-stone-950 to-stone-900 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-emerald-400">Target Channel Routing</div>
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    {result.recommendedRouting.market}
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-400">Spot Benchmark</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    ${result.recommendedRouting.suggestedPricePerKg.toFixed(2)}
                    <span className="text-xs text-stone-400 font-normal"> / kg</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/60 p-3 rounded-lg border border-stone-800">
                {result.recommendedRouting.rationale}
              </p>

              {/* Recovery Suggestions */}
              {result.recommendedRouting.valueRecoveryTips.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    Value Optimization Advice
                  </div>
                  <ul className="space-y-1 text-xs text-stone-300">
                    {result.recommendedRouting.valueRecoveryTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
