import React, { useState, useEffect } from 'react';
import { 
  UserCheck, CheckCircle2, AlertTriangle, ShieldCheck, 
  ArrowRight, Check, X, Edit3, MessageSquare, Layers, Sparkles 
} from 'lucide-react';
import { InspectionRecord, GradeTier, HumanReviewRecord } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { ActivePage } from '../components/Navigation/Navbar';

interface HumanReviewPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const HumanReviewPage: React.FC<HumanReviewPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<InspectionRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<InspectionRecord | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeTier>('GRADE_B');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    const list = await firestoreService.getPendingReviews();
    setPendingItems(list);
    if (list.length > 0 && !selectedItem) {
      setSelectedItem(list[0]);
      setSelectedGrade(list[0].grade);
    }
  };

  const handleSelectItem = (item: InspectionRecord) => {
    setSelectedItem(item);
    setSelectedGrade(item.grade);
    setReviewNotes('');
  };

  const handleFinalizeReview = async (decision: 'accepted' | 'overridden') => {
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      const reviewRecord: HumanReviewRecord = {
        id: `rev-${Date.now()}`,
        inspectionId: selectedItem.id,
        userId: user?.userId || 'usr-default',
        inspectorUid: user?.userId || 'usr-default',
        inspectorName: user?.displayName || 'Dr. Sarah Lin (Lead Q/A)',
        originalGrade: selectedItem.grade,
        finalGrade: selectedGrade,
        decision,
        notes: reviewNotes || (decision === 'accepted' ? 'AI proposed grade accepted after manual review.' : `Overridden to ${selectedGrade} by certified inspector.`),
        reviewedAt: new Date().toISOString(),
      };

      await firestoreService.submitReview(reviewRecord);

      setSuccessToast(`Inspection ${selectedItem.id} finalized as ${selectedGrade.replace('_', ' ')}!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Refresh list
      const remaining = pendingItems.filter((i) => i.id !== selectedItem.id);
      setPendingItems(remaining);
      setSelectedItem(remaining.length > 0 ? remaining[0] : null);
      if (remaining.length > 0) {
        setSelectedGrade(remaining[0].grade);
      }
    } catch (err) {
      console.error('Failed to submit human review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Human-In-The-Loop Quality Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inspector Review Workstation
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Resolve borderline scores, unconfirmed skin defects, and low AI confidence flags before official batch certification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 font-mono">
            {pendingItems.length} in queue
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {pendingItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl">
            ✓
          </div>
          <h3 className="text-lg font-bold text-white">Review Queue Clean</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            All current vegetable inspections have met automated confidence thresholds. No manual intervention required.
          </p>
          <button
            onClick={() => onNavigate('new_inspection')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
          >
            Start New Inspection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Review Queue List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
              Flagged Items ({pendingItems.length})
            </h3>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {pendingItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-stone-850 border-amber-500/70 shadow-lg ring-1 ring-amber-500/30'
                        : 'bg-stone-900 border-stone-800 hover:bg-stone-850'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.id}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-white truncate capitalize">
                          {item.vegetableType} ({item.variety})
                        </span>
                        <GradeBadge grade={item.grade} size="sm" />
                      </div>
                      <div className="text-[10px] text-amber-400/90 line-clamp-1 font-medium">
                        {item.humanReviewReason || 'Confidence check'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-1">
                        Confidence: {item.confidenceScore}% • Score: {item.qualityScore}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Inspector Workstation (8 cols) */}
          {selectedItem && (
            <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Header with Reason */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Review Trigger Reason:</span>
                </div>
                <p className="text-xs text-stone-200">
                  {selectedItem.humanReviewReason || 'Borderline grade threshold or confidence < 80%'}
                </p>
              </div>

              {/* Produce Specimen Image & AI Observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800 shadow-md">
                  <img src={selectedItem.imageUrl} alt="Review Specimen" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-stone-300 border border-stone-700">
                    ID: {selectedItem.id}
                  </div>
                </div>

                {/* AI Findings Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    AI Visual Computer Vision Observations
                  </h4>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Proposed Grade:</span>
                      <GradeBadge grade={selectedItem.grade} size="sm" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Model Confidence:</span>
                      <span className="font-mono text-amber-400 font-bold">{selectedItem.confidenceScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Quality Score:</span>
                      <span className="font-mono text-stone-200 font-bold">{selectedItem.qualityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Surface Symmetry:</span>
                      <span className="font-mono text-stone-300">{selectedItem.shape.symmetryRatio}%</span>
                    </div>
                  </div>

                  {/* Defects List */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 block">Identified Defects:</span>
                    {selectedItem.defects.length === 0 ? (
                      <span className="text-xs text-stone-500">None detected</span>
                    ) : (
                      selectedItem.defects.map((d) => (
                        <div key={d.id} className="text-[11px] p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 flex justify-between">
                          <span>{d.label} ({d.locationDesc})</span>
                          <span className="font-mono text-amber-400">{d.estimatedAreaPercent}% area</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Inspector Decision Controls */}
              <div className="pt-4 border-t border-stone-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  Inspector Grade Override & Notes
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['GRADE_A', 'GRADE_B', 'GRADE_C', 'REJECT'] as GradeTier[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGrade(g)}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                        selectedGrade === g
                          ? 'bg-stone-800 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30 shadow-md'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                      }`}
                    >
                      {g.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Review Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    <span>Inspector Verification Remarks / Notes</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Superficial neck soil marking confirmed dry, not Aspergillus rot. Reclassified to Grade B."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Finalize Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFinalizeReview('accepted')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs border border-stone-700 transition"
                  >
                    Accept Proposed ({selectedItem.grade.replace('_', ' ')})
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleFinalizeReview('overridden')}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Finalize Decision as {selectedGrade.replace('_', ' ')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
