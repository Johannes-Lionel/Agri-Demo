import React, { useState, useEffect } from 'react';
import { 
  Scan, Layers, UserCheck, FileText, TrendingUp, 
  AlertCircle, CheckCircle2, ChevronRight, Sparkles, Award 
} from 'lucide-react';
import { ActivePage } from '../components/Navigation/Navbar';
import { firestoreService } from '../services/firestoreService';
import { BatchRecord, InspectionRecord } from '../types';
import { GradeBadge } from '../components/common/Badge';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
  onSelectInspection?: (inspection: InspectionRecord) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectInspection }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bList, iList, rList] = await Promise.all([
          firestoreService.getBatches(),
          firestoreService.getInspections(),
          firestoreService.getPendingReviews(),
        ]);
        setBatches(bList);
        setInspections(iList);
        setPendingReviews(rList);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute Aggregates
  const totalInspections = inspections.length;
  const gradeACount = inspections.filter((i) => i.grade === 'GRADE_A').length;
  const gradeBCount = inspections.filter((i) => i.grade === 'GRADE_B').length;
  const gradeCCount = inspections.filter((i) => i.grade === 'GRADE_C').length;
  const rejectCount = inspections.filter((i) => i.grade === 'REJECT').length;

  const avgConfidence = totalInspections > 0
    ? Math.round(inspections.reduce((acc, i) => acc + i.confidenceScore, 0) / totalInspections)
    : 88;

  // Defect breakdown
  const defectCounts: Record<string, number> = {};
  inspections.forEach((i) => {
    i.defects.forEach((d) => {
      defectCounts[d.label] = (defectCounts[d.label] || 0) + 1;
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Industrial Packhouse Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Vegetable Quality Control Dashboard
          </h1>
          <p className="text-xs text-stone-400">
            Real-time optical grading overview for active onion packing lines and delivery lots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new_inspection')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Scan className="w-4 h-4" />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Review Queue Alert (if items pending) */}
      {pendingReviews.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{pendingReviews.length} Inspections Awaiting Human Review</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Low AI confidence or ambiguous skin defects detected requiring manual verification before lot certification.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('human_review')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition flex items-center gap-1.5 shrink-0"
          >
            <span>Open Review Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Audits</span>
          <div className="text-3xl font-black text-white font-mono">{totalInspections}</div>
          <p className="text-[11px] text-stone-500">Across {batches.length} active harvest lots</p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Grade A Export Ratio</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {totalInspections > 0 ? Math.round((gradeACount / totalInspections) * 100) : 0}%
          </div>
          <p className="text-[11px] text-emerald-500/80">Premium table packout</p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Avg AI Confidence</span>
          <div className="text-3xl font-black text-blue-400 font-mono">{avgConfidence}%</div>
          <p className="text-[11px] text-blue-400/80">Automated acceptance threshold: 80%</p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-1">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Pending Review</span>
          <div className="text-3xl font-black text-amber-400 font-mono">{pendingReviews.length}</div>
          <p className="text-[11px] text-amber-500/80">Flagged for inspector</p>
        </div>
      </div>

      {/* Grid: Grade Distribution & Defect Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grade Distribution */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Grade Distribution
            </h3>
            <span className="text-xs text-stone-400 font-mono">{totalInspections} total units</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-bold">Grade A (Premium Export)</span>
                <span className="font-mono text-stone-200">{gradeACount} ({totalInspections > 0 ? Math.round((gradeACount / totalInspections) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-950 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspections > 0 ? (gradeACount / totalInspections) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-bold">Grade B (Domestic Supermarket)</span>
                <span className="font-mono text-stone-200">{gradeBCount} ({totalInspections > 0 ? Math.round((gradeBCount / totalInspections) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-950 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspections > 0 ? (gradeBCount / totalInspections) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-bold">Grade C (Industrial Processing)</span>
                <span className="font-mono text-stone-200">{gradeCCount} ({totalInspections > 0 ? Math.round((gradeCCount / totalInspections) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-950 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspections > 0 ? (gradeCCount / totalInspections) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-bold">Reject / Culled</span>
                <span className="font-mono text-stone-200">{rejectCount} ({totalInspections > 0 ? Math.round((rejectCount / totalInspections) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-950 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalInspections > 0 ? (rejectCount / totalInspections) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Detected Defects */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Top Detected Onion & Vegetable Defects
          </h3>

          <div className="space-y-2">
            {Object.entries(defectCounts).length === 0 ? (
              <p className="text-xs text-stone-400">No defect anomalies logged yet.</p>
            ) : (
              Object.entries(defectCounts).slice(0, 5).map(([label, count], idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-semibold text-stone-200">{label}</span>
                  </div>
                  <span className="font-mono text-stone-400">{count} occurrences</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Vegetable Inspections
          </h3>
          <button
            onClick={() => onNavigate('batch_analytics')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View All Batches →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Produce Specimen</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Quality Score</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {inspections.slice(0, 5).map((insp) => (
                <tr key={insp.id} className="hover:bg-stone-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-stone-200">{insp.id}</td>
                  <td className="py-3 px-4 capitalize font-semibold text-white">
                    {insp.vegetableType} ({insp.variety})
                  </td>
                  <td className="py-3 px-4">
                    <GradeBadge grade={insp.grade} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-200">{insp.qualityScore}/100</td>
                  <td className="py-3 px-4 font-mono text-stone-300">{insp.confidenceScore}%</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      insp.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {insp.status === 'completed' ? 'Auto Certified' : 'Review Required'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-500">
                    {new Date(insp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
