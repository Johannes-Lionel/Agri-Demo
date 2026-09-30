import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, FileText, CheckCircle2, 
  TrendingUp, Award, AlertCircle, Scale, Sparkles, ShieldCheck 
} from 'lucide-react';
import { BatchRecord, InspectionRecord, CertifiedReport } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { ActivePage } from '../components/Navigation/Navbar';

interface BatchAnalyticsPageProps {
  onNavigate: (page: ActivePage) => void;
  onOpenReport?: (reportId: string) => void;
}

export const BatchAnalyticsPage: React.FC<BatchAnalyticsPageProps> = ({ onNavigate }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [batchInspections, setBatchInspections] = useState<InspectionRecord[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // New batch form
  const [newBatchNumber, setNewBatchNumber] = useState(`MANDI-LOT-${Math.floor(100 + Math.random() * 900)}`);
  const [newVegetable, setNewVegetable] = useState('onion');
  const [newVariety, setNewVariety] = useState('Nashik Red Onion');
  const [newGrower, setNewGrower] = useState('Kisan Cooperative Society (Lot #4)');
  const [newWeightKg, setNewWeightKg] = useState<number>(5000);

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
      estimatedLotWeightKg: newWeightKg,
      gradeAPercent: 0,
      ursPercent: 0,
      gradeDistribution: { gradeA: 0, gradeB: 0, gradeC: 0, urs: 0, reject: 0 },
      defectBreakdownSummary: {
        rottenCount: 0,
        sproutedCount: 0,
        damagedCount: 0,
        undersizedCount: 0,
      },
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
      const reportId = `rep-mandi-${Date.now()}`;
      const newReport: CertifiedReport = {
        id: reportId,
        reportNumber: `CERT-MANDI-${selectedBatch.batchNumber.replace('MANDI-LOT-', '').replace('LOT-', '')}`,
        userId: 'usr-default',
        batchId: selectedBatch.id,
        verificationId: `VER-MANDI-${Math.floor(1000 + Math.random() * 9000)}`,
        vegetableType: selectedBatch.vegetableType,
        variety: selectedBatch.variety,
        growerOrigin: selectedBatch.growerOrigin,
        totalQuantity: selectedBatch.quantityInspected || 1,
        estimatedLotWeightKg: selectedBatch.estimatedLotWeightKg || 4500,
        certifiedGrade: selectedBatch.gradeAPercent >= 60 ? 'GRADE_A' : 'GRADE_B',
        gradeAPercent: selectedBatch.gradeAPercent || 70,
        ursPercent: selectedBatch.ursPercent || 10,
        averageScore: selectedBatch.averageScore || 88,
        averageConfidence: selectedBatch.averageConfidence || 91,
        gradeDistribution: selectedBatch.gradeDistribution,
        defectBreakdownSummary: selectedBatch.defectBreakdownSummary,
        settlement: selectedBatch.settlement,
        defectSummary: selectedBatch.defectSummary,
        humanReviewCount: selectedBatch.humanReviewCount,
        certifiedBy: 'Dr. Sarah Lin (Lead Mandi Inspector)',
        facilityName: 'AgriGrade Mandi Procurement Center #4',
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
            <Scale className="w-3.5 h-3.5" />
            <span>Mandi Procurement Intake & Transparent Settlement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lot Settlement Ledger & Grade A / URS Yields
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Computing Grade A (FAQ) vs URS percentages and eliminating buyer-grower pricing disputes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Intake New Lot</span>
        </button>
      </div>

      {/* New Batch Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Intake New Procurement Lot</h3>
            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Mandi Lot Identifier</label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Produce Cultivar</label>
                <input
                  type="text"
                  required
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Farmer / Grower Origin</label>
                <input
                  type="text"
                  required
                  value={newGrower}
                  onChange={(e) => setNewGrower(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Weighbridge Lot Weight (kg)</label>
                <input
                  type="number"
                  required
                  value={newWeightKg}
                  onChange={(e) => setNewWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-mono"
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
                  Register Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Batches List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
            Registered Procurement Lots ({batches.length})
          </h3>

          <div className="space-y-2.5">
            {batches.map((b) => {
              const isSelected = selectedBatch?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBatch(b)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
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
                    {b.variety}
                  </div>
                  <div className="text-[11px] text-stone-400 flex justify-between font-mono">
                    <span className="text-emerald-400 font-bold">Grade A: {b.gradeAPercent}%</span>
                    <span className="text-rose-400 font-bold">URS: {b.ursPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Batch Details (8 cols) */}
        {selectedBatch && (
          <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <div className="text-xs font-bold text-emerald-400 font-mono">{selectedBatch.batchNumber}</div>
                <h2 className="text-2xl font-black text-white capitalize mt-0.5">
                  {selectedBatch.variety}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Farmer: <strong className="text-stone-200">{selectedBatch.growerOrigin}</strong> • Weight: {selectedBatch.estimatedLotWeightKg || 4500} kg ({((selectedBatch.estimatedLotWeightKg || 4500) / 100).toFixed(1)} Quintals)
                </p>
              </div>

              <button
                type="button"
                disabled={generatingReport}
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Digital Mandi Slip & QR</span>
              </button>
            </div>

            {/* Grade A % vs URS % Key Highlight Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Grade A (FAQ) Yield</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">{selectedBatch.gradeAPercent}%</span>
                <div className="text-[10px] text-stone-500 mt-0.5">{selectedBatch.gradeDistribution.gradeA} FAQ units</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 uppercase font-bold block">URS Percentage</span>
                <span className="text-3xl font-black text-rose-400 font-mono">{selectedBatch.ursPercent}%</span>
                <div className="text-[10px] text-stone-500 mt-0.5">{selectedBatch.gradeDistribution.urs} URS units</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Quality Index</span>
                <span className="text-3xl font-black text-white font-mono">{selectedBatch.averageScore}<span className="text-xs text-stone-500">/100</span></span>
                <div className="text-[10px] text-stone-500 mt-0.5">Mean defect penalty</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Confidence Level</span>
                <span className="text-3xl font-black text-blue-400 font-mono">{selectedBatch.averageConfidence}%</span>
                <div className="text-[10px] text-stone-500 mt-0.5">High precision rating</div>
              </div>
            </div>

            {/* 4 Hackathon Defect Quantities in this Lot */}
            <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Detected Defect Occurrences in this Lot:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-rose-400 font-bold block">🛑 Rotten Count:</span>
                  <span className="font-mono text-lg font-black text-white mt-1">
                    {selectedBatch.defectBreakdownSummary?.rottenCount ?? 3}
                  </span>
                  <span className="text-[10px] text-stone-500 block">Fungal neck/basal rot</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-amber-400 font-bold block">🌱 Sprouted Count:</span>
                  <span className="font-mono text-lg font-black text-white mt-1">
                    {selectedBatch.defectBreakdownSummary?.sproutedCount ?? 4}
                  </span>
                  <span className="text-[10px] text-stone-500 block">Vegetative shoots</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-blue-400 font-bold block">✂️ Damaged Count:</span>
                  <span className="font-mono text-lg font-black text-white mt-1">
                    {selectedBatch.defectBreakdownSummary?.damagedCount ?? 6}
                  </span>
                  <span className="text-[10px] text-stone-500 block">Mechanical cuts & abrasions</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80">
                  <span className="text-purple-400 font-bold block">📏 Undersized Count:</span>
                  <span className="font-mono text-lg font-black text-white mt-1">
                    {selectedBatch.defectBreakdownSummary?.undersizedCount ?? 2}
                  </span>
                  <span className="text-[10px] text-stone-500 block">&lt;45mm caliber culls</span>
                </div>
              </div>
            </div>

            {/* Transparent Mandi Settlement Calculator */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-950 to-emerald-950/30 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Automated Fair Price Payout Settlement
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Transparent formula based on Grade A FAQ bonus minus URS defect deductions.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Zero Agent Bias
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-900">
                  <span className="text-[10px] text-stone-500 block">Base Benchmark MSP</span>
                  <span className="font-mono font-bold text-stone-200">₹2,400 / quintal</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900">
                  <span className="text-[10px] text-emerald-400 block">Grade A FAQ Bonus</span>
                  <span className="font-mono font-bold text-emerald-400">+₹250 / quintal</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-900">
                  <span className="text-[10px] text-rose-400 block">URS Deduction ({selectedBatch.ursPercent}%)</span>
                  <span className="font-mono font-bold text-rose-400">-₹{Math.round(selectedBatch.ursPercent * 28)} / quintal</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block font-bold">Net Payout to Farmer</span>
                  <span className="font-mono text-base font-black text-emerald-300">
                    ₹{selectedBatch.settlement?.totalFarmerPayout ? selectedBatch.settlement.totalFarmerPayout.toLocaleString() : '106,200'}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Specimens */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Audited Specimens in this Procurement Lot ({batchInspections.length})
              </h4>

              {batchInspections.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-stone-950 text-xs text-stone-500 border border-stone-800">
                  No individual inspections logged in this lot yet.
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
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Score: {insp.qualityScore}/100 • {insp.hackathonFlags?.isRotten ? 'Rotten' : insp.hackathonFlags?.isSprouted ? 'Sprouted' : insp.hackathonFlags?.isUndersized ? 'Undersized' : 'Grade A FAQ'}
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
