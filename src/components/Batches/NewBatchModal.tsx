import React, { useState } from 'react';
import { CropCategory, GradeTier, BatchLot, InspectionResult } from '../../types/grading';
import { CROP_SPECIFICATIONS } from '../../data/produceStandards';
import { X, Plus, FileBadge } from 'lucide-react';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (batch: BatchLot) => void;
  initialFromScan?: InspectionResult | null;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  onAddBatch,
  initialFromScan,
}) => {
  const [crop, setCrop] = useState<CropCategory>(initialFromScan?.crop || 'apple');
  const [variety, setVariety] = useState<string>(initialFromScan?.variety || 'Honeycrisp');
  const [lotNumber, setLotNumber] = useState<string>(
    `LOT-${(initialFromScan?.crop || 'AP').substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [growerName, setGrowerName] = useState<string>('Cascade Foothills Co-Op');
  const [farmOrchard, setFarmOrchard] = useState<string>('Block 7 East');
  const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [totalWeightKg, setTotalWeightKg] = useState<number>(3500);
  const [sampleCount, setSampleCount] = useState<number>(100);
  const [certifiedGrade, setCertifiedGrade] = useState<GradeTier>(initialFromScan?.assignedGrade || 'GRADE_A');
  const [scoreAvg, setScoreAvg] = useState<number>(initialFromScan?.overallScore || 92);
  const [defectRateAvg, setDefectRateAvg] = useState<number>(initialFromScan?.metrics.surfaceDefectPercent || 1.8);
  const [inspectorName, setInspectorName] = useState<string>('Dr. Sarah Lin (Lead Q/A)');
  const [notes, setNotes] = useState<string>(initialFromScan?.recommendedRouting.rationale || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLot: BatchLot = {
      id: `lot-${Date.now()}`,
      lotNumber,
      growerName,
      farmOrchard,
      harvestDate,
      inspectionDate: new Date().toISOString().split('T')[0],
      crop,
      variety,
      totalWeightKg: Number(totalWeightKg),
      sampleCount: Number(sampleCount),
      certifiedGrade,
      scoreAvg: Number(scoreAvg),
      defectRateAvg: Number(defectRateAvg),
      inspectorName,
      status: 'Certified',
      notes,
    };
    onAddBatch(newLot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-stone-200">Register & Certify Produce Lot</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Produce Commodity</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value as CropCategory)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                {(Object.keys(CROP_SPECIFICATIONS) as CropCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CROP_SPECIFICATIONS[c].commonName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Variety / Cultivar</label>
              <input
                type="text"
                required
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Lot Tracking Number</label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Harvest Date</label>
              <input
                type="date"
                required
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Grower / Producer</label>
              <input
                type="text"
                required
                value={growerName}
                onChange={(e) => setGrowerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Orchard / Field Block</label>
              <input
                type="text"
                required
                value={farmOrchard}
                onChange={(e) => setFarmOrchard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Net Weight (kg)</label>
              <input
                type="number"
                required
                min="10"
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Sample Count</label>
              <input
                type="number"
                required
                min="10"
                value={sampleCount}
                onChange={(e) => setSampleCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Certified Grade</label>
              <select
                value={certifiedGrade}
                onChange={(e) => setCertifiedGrade(e.target.value as GradeTier)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="GRADE_A">Grade A (Export)</option>
                <option value="GRADE_B">Grade B (Retail)</option>
                <option value="GRADE_C">Grade C (Processing)</option>
                <option value="REJECT">Reject / Culled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Avg Score (0-100)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={scoreAvg}
                onChange={(e) => setScoreAvg(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">Defect Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={defectRateAvg}
                onChange={(e) => setDefectRateAvg(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Certifying Inspector</label>
            <input
              type="text"
              required
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Inspection Remarks / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared for export container packing..."
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Certified Certificate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
