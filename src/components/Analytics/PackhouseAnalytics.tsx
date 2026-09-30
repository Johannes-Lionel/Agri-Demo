import React from 'react';
import { BatchLot } from '../../types/grading';
import { 
  BarChart3, PieChart, TrendingUp, AlertTriangle, 
  Award, ShieldAlert, CheckCircle, DollarSign
} from 'lucide-react';

interface PackhouseAnalyticsProps {
  batches: BatchLot[];
}

export const PackhouseAnalytics: React.FC<PackhouseAnalyticsProps> = ({ batches }) => {
  const totalLots = batches.length || 1;
  const gradeACount = batches.filter((b) => b.certifiedGrade === 'GRADE_A').length;
  const gradeBCount = batches.filter((b) => b.certifiedGrade === 'GRADE_B').length;
  const gradeCCount = batches.filter((b) => b.certifiedGrade === 'GRADE_C').length;
  const rejectCount = batches.filter((b) => b.certifiedGrade === 'REJECT').length;

  const totalKg = batches.reduce((acc, b) => acc + b.totalWeightKg, 0);

  // Defect Pareto statistics
  const defectPareto = [
    { cause: 'Mechanical Bruising / Impact', share: 38, count: 142, impact: 'High', color: 'bg-amber-500' },
    { cause: 'Sunscald / Solar Necrosis', share: 24, count: 89, impact: 'Moderate', color: 'bg-orange-500' },
    { cause: 'Epidermal Blemishes / Russeting', share: 18, count: 68, impact: 'Low', color: 'bg-yellow-500' },
    { cause: 'Insect / Thrip Punctures', share: 11, count: 41, impact: 'Moderate', color: 'bg-emerald-500' },
    { cause: 'Late Blight / Fungal Decay', share: 9, count: 34, impact: 'Critical', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Operational Quality Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Packhouse Defect Pareto & Quality Analytics
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Root cause analysis, packout grade breakdown, and yield optimization trends across audited harvest lots.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Tonnage Audited</span>
          <div className="text-3xl font-black text-white font-mono">
            {(totalKg / 1000).toFixed(1)} <span className="text-sm text-stone-500 font-normal">tons</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium pt-1">Across {batches.length} certified lots</p>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Grade A Packout Rate</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {Math.round((gradeACount / totalLots) * 100)}%
          </div>
          <p className="text-xs text-stone-400 pt-1">Export quality compliance</p>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Average Quality Index</span>
          <div className="text-3xl font-black text-blue-400 font-mono">
            {(batches.reduce((a, b) => a + b.scoreAvg, 0) / totalLots).toFixed(1)}
            <span className="text-sm text-stone-500 font-normal">/100</span>
          </div>
          <p className="text-xs text-stone-400 pt-1">Horticultural score average</p>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Culled Rejection Rate</span>
          <div className="text-3xl font-black text-rose-400 font-mono">
            {Math.round((rejectCount / totalLots) * 100)}%
          </div>
          <p className="text-xs text-stone-400 pt-1">Below commercial standards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Defect Pareto Chart (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Primary Defect Etiology (Pareto Analysis)
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  80% of downgrades originate from mechanical handling and orchard sun exposure.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {defectPareto.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-200">{item.cause}</span>
                    <span className="font-mono text-stone-400">
                      {item.share}% ({item.count} detections)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-stone-950 overflow-hidden">
                    <div
                      style={{ width: `${item.share}%` }}
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Corrective Action Takeaway */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Actionable Packing Line Intervention:
              </div>
              <p className="text-stone-300 leading-relaxed">
                Mechanical bruising accounts for 38% of packout downgrades. Calibrating dumping hopper water cushions and installing soft foam decelerators on drop conveyors can recover an estimated <strong>$14,200</strong> per 100 metric tons.
              </p>
            </div>
          </div>
        </div>

        {/* Grade Breakdown & Grower Benchmarking (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grade Distribution Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Aggregate Grade Distribution
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Grade A (Export Tier)
                </span>
                <span className="font-mono font-bold text-white text-xs">{gradeACount} lots ({Math.round((gradeACount / totalLots) * 100)}%)</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Grade B (Supermarket)
                </span>
                <span className="font-mono font-bold text-white text-xs">{gradeBCount} lots ({Math.round((gradeBCount / totalLots) * 100)}%)</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Grade C (Processing)
                </span>
                <span className="font-mono font-bold text-white text-xs">{gradeCCount} lots ({Math.round((gradeCCount / totalLots) * 100)}%)</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Culled / Rejected
                </span>
                <span className="font-mono font-bold text-white text-xs">{rejectCount} lots ({Math.round((rejectCount / totalLots) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Grower Leaderboard */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Grower Quality Leaderboard
            </h3>

            <div className="space-y-2">
              {batches.slice(0, 4).map((b, i) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-800 text-stone-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-stone-200">{b.growerName}</div>
                      <div className="text-[10px] text-stone-500">{b.variety} • {b.farmOrchard}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">{b.scoreAvg}</div>
                    <div className="text-[10px] text-stone-500">{b.certifiedGrade.replace('GRADE_', 'Grade ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
