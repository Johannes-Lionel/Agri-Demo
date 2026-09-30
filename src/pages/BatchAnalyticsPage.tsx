import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, FileText, CheckCircle2, 
  TrendingUp, Award, AlertCircle, ChevronRight, Sparkles 
} from 'lucide-react';
import { BatchRecord, InspectionRecord, CertifiedReport } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { ActivePage } from '../components/Navigation/Navbar';

interface BatchAnalyticsPageProps {
  onNavigate: (page: ActivePage) => void;
  onOpenReport?: (reportId: string) => void;
}

export const BatchAnalyticsPage: React.FC<BatchAnalyticsPageProps> = ({ onNavigate, onOpenReport }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [batchInspections, setBatchInspections] = useState<InspectionRecord[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // New batch form
  const [newBatchNumber, setNewBatchNumber] = useState(`LOT-ON-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [newVegetable, setNewVegetable] = useState('onion');
  const [newVariety, setNewVariety] = useState('Yellow Spanish Sweet');
  const [newGrower, setNewGrower] = useState('Highland Allium Co-Op');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const list = await firestoreService.getBatches();
    setBatches(list);
    if (list.length > 0 && !selectedBatch) {
      handleSelectBatch(list[0]);
    }
  };

  const handleSelectBatch = async (b: BatchRecord) => {
    setSelectedBatch(b);
    const insps = await firestoreService.getInspections(b.id);
    setBatchInspections(insps);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: BatchRecord = {
      id: `batch-${Date.now()}`,
      batchNumber: newBatchNumber,
      userId: 'usr-default',
      vegetableType: newVegetable,
      variety: newVariety,
      growerOrigin: newGrower,
      quantityInspected: 0,
      gradeDistribution: { gradeA: 0, gradeB: 0, gradeC: 0, reject: 0 },
      averageConfidence: 0,
      averageScore: 0,
      defectSummary: {},
      humanReviewCount: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestoreService.createBatch(newBatch);
    setIsCreatingNew(false);
    await loadBatches();
    handleSelectBatch(newBatch);
  };

  const handleGenerateReport = async () => {
    if (!selectedBatch) return;
    setGeneratingReport(true);
    try {
      const reportId = `rep-${Date.now()}`;
      const newReport: CertifiedReport = {
        id: reportId,
        reportNumber: `CERT-AGRI-${selectedBatch.batchNumber.replace('LOT-', '')}`,
        userId: 'usr-default',
        batchId: selectedBatch.id,
        verificationId: `VER-AGRI-${Math.floor(1000 + Math.random() * 9000)}`,
        vegetableType: selectedBatch.vegetableType,
        variety: selectedBatch.variety,
        growerOrigin: selectedBatch.growerOrigin,
        totalQuantity: selectedBatch.quantityInspected || 1,
        certifiedGrade: (selectedBatch.gradeDistribution.gradeA > (selectedBatch.gradeDistribution.gradeB || 0)) ? 'GRADE_A' : 'GRADE_B',
        averageScore: selectedBatch.averageScore || 88,
        averageConfidence: selectedBatch.averageConfidence || 90,
        gradeDistribution: selectedBatch.gradeDistribution,
        defectSummary: selectedBatch.defectSummary,
        humanReviewCount: selectedBatch.humanReviewCount,
        certifiedBy: 'Dr. Sarah Lin (Lead Q/A Inspector)',
        facilityName: 'AgriGrade Packhouse Facility #4',
        publicVerificationUrl: `/verify/${reportId}`,
        createdAt: new Date().toISOString(),
      };

      await firestoreService.createReport(newReport);
      await firestoreService.updateBatch(selectedBatch.id, { status: 'certified' });
      onNavigate('reports');
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Packhouse Harvest Batch Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Batch Analytics & Grade Distribution
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Aggregate quality statistics across delivery lots, defect frequencies, and certification reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Batch</span>
        </button>
      </div>

      {/* New Batch Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Harvest Lot Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Vegetable Type</label>
                <select
                  value={newVegetable}
                  onChange={(e) => setNewVegetable(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
                >
                  <option value="onion">Onion (Allium cepa)</option>
                  <option value="potato">Potato</option>
                  <option value="tomato">Tomato</option>
                  <option value="pepper">Bell Pepper</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Cultivar / Variety</label>
                <input
                  type="text"
                  required
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Grower / Orchard Origin</label>
                <input
                  type="text"
                  required
                  value={newGrower}
                  onChange={(e) => setNewGrower(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Batches on Left, Detailed Analytics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Batches Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
            Active Harvest Batches ({batches.length})
          </h3>

          <div className="space-y-2.5">
            {batches.map((b) => {
              const isSelected = selectedBatch?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBatch(b)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'bg-stone-850 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{b.batchNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      b.status === 'certified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-semibold capitalize text-stone-200">
                    {b.vegetableType} • {b.variety}
                  </div>
                  <div className="text-[11px] text-stone-500 flex justify-between">
                    <span>{b.quantityInspected} units inspected</span>
                    <span className="font-mono text-emerald-400">{b.averageScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Batch Detailed Analytics (8 cols) */}
        {selectedBatch && (
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <div className="text-xs font-bold text-emerald-400 font-mono">{selectedBatch.batchNumber}</div>
                <h2 className="text-2xl font-black text-white capitalize mt-0.5">
                  {selectedBatch.vegetableType} ({selectedBatch.variety})
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">{selectedBatch.growerOrigin}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={generatingReport}
                  onClick={handleGenerateReport}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Certified Report & QR</span>
                </button>
              </div>
            </div>

            {/* Batch Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Units Audited</span>
                <span className="text-2xl font-black text-white font-mono">{selectedBatch.quantityInspected}</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Average Quality Score</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{selectedBatch.averageScore}<span className="text-xs text-stone-500">/100</span></span>
              </div>
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Mean AI Confidence</span>
                <span className="text-2xl font-black text-blue-400 font-mono">{selectedBatch.averageConfidence}%</span>
              </div>
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Human Reviews</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{selectedBatch.humanReviewCount}</span>
              </div>
            </div>

            {/* Grade Breakdown in this Batch */}
            <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Batch Packout Grade Ratio
              </h4>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-stone-900 p-3 rounded-xl border border-emerald-500/20">
                  <div className="text-emerald-400 font-bold">Grade A</div>
                  <div className="text-lg font-black text-white font-mono mt-1">{selectedBatch.gradeDistribution.gradeA}</div>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-blue-500/20">
                  <div className="text-blue-400 font-bold">Grade B</div>
                  <div className="text-lg font-black text-white font-mono mt-1">{selectedBatch.gradeDistribution.gradeB}</div>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-amber-500/20">
                  <div className="text-amber-400 font-bold">Grade C</div>
                  <div className="text-lg font-black text-white font-mono mt-1">{selectedBatch.gradeDistribution.gradeC}</div>
                </div>
                <div className="bg-stone-900 p-3 rounded-xl border border-rose-500/20">
                  <div className="text-rose-400 font-bold">Reject</div>
                  <div className="text-lg font-black text-white font-mono mt-1">{selectedBatch.gradeDistribution.reject}</div>
                </div>
              </div>
            </div>

            {/* Inspections in this batch */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Audited Specimens in Batch ({batchInspections.length})
              </h4>

              {batchInspections.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-stone-950 text-xs text-stone-500 border border-stone-800">
                  No individual inspections logged in this batch yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batchInspections.map((insp) => (
                    <div key={insp.id} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-3">
                      <img src={insp.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-stone-800" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-stone-300 font-bold">{insp.id}</span>
                          <GradeBadge grade={insp.grade} size="sm" />
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Score: {insp.qualityScore}/100 • Conf: {insp.confidenceScore}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
