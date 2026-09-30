import React, { useState } from 'react';
import { BatchLot, CropCategory, GradeTier } from '../../types/grading';
import { CROP_SPECIFICATIONS } from '../../data/produceStandards';
import { GradeBadge } from '../common/Badge';
import { 
  Search, Filter, Plus, FileBadge, ArrowUpDown, 
  Eye, CheckCircle2, Truck, AlertCircle, Calendar
} from 'lucide-react';

interface BatchListProps {
  batches: BatchLot[];
  onSelectBatch: (batch: BatchLot) => void;
  onOpenNewBatchModal: () => void;
}

export const BatchList: React.FC<BatchListProps> = ({
  batches,
  onSelectBatch,
  onOpenNewBatchModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.growerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.variety.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCrop = selectedCrop === 'all' || b.crop === selectedCrop;
    const matchesGrade = selectedGrade === 'all' || b.certifiedGrade === selectedGrade;

    return matchesSearch && matchesCrop && matchesGrade;
  });

  // Summary Metrics
  const totalWeight = batches.reduce((acc, b) => acc + b.totalWeightKg, 0);
  const gradeACount = batches.filter((b) => b.certifiedGrade === 'GRADE_A').length;
  const gradeBCount = batches.filter((b) => b.certifiedGrade === 'GRADE_B').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
              <FileBadge className="w-3.5 h-3.5" />
              <span>Packhouse Chain of Custody</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Produce Lot Certificates & Traceability
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              Official accredited inspection certificates, grower compliance records, and packing dispatch manifests.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewBatchModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Certify New Lot</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Certified Lots</span>
            <span className="text-2xl font-black text-white font-mono">{batches.length}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Volume Audited</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{(totalWeight / 1000).toFixed(1)} <span className="text-xs text-stone-500">Tons</span></span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Grade A Export Ratio</span>
            <span className="text-2xl font-black text-blue-400 font-mono">{Math.round((gradeACount / (batches.length || 1)) * 100)}%</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Avg Quality Index</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {(batches.reduce((a, b) => a + b.scoreAvg, 0) / (batches.length || 1)).toFixed(1)}/100
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
          <input
            type="text"
            placeholder="Search lot #, grower, variety..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Drops */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg text-xs px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Crops</option>
              {(Object.keys(CROP_SPECIFICATIONS) as CropCategory[]).map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg text-xs px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Grades</option>
              <option value="GRADE_A">Grade A</option>
              <option value="GRADE_B">Grade B</option>
              <option value="GRADE_C">Grade C</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Cards / Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Lot ID</th>
                <th className="py-3.5 px-4">Commodity / Variety</th>
                <th className="py-3.5 px-4">Grower & Origin</th>
                <th className="py-3.5 px-4">Harvest Date</th>
                <th className="py-3.5 px-4">Weight (kg)</th>
                <th className="py-3.5 px-4">Certified Grade</th>
                <th className="py-3.5 px-4">Quality Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    No matching produce lot certificates found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const spec = CROP_SPECIFICATIONS[batch.crop];
                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-stone-800/40 transition cursor-pointer"
                      onClick={() => onSelectBatch(batch)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {batch.lotNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                          <span>{spec.icon}</span>
                          <span>{batch.variety}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 capitalize">{batch.crop}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-300">{batch.growerName}</div>
                        <div className="text-[10px] text-stone-500">{batch.farmOrchard}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-400">
                        {batch.harvestDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-200">
                        {batch.totalWeightKg.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <GradeBadge grade={batch.certifiedGrade} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-200">{batch.scoreAvg}</span>
                          <span className="text-[10px] text-stone-500">(-{batch.defectRateAvg}% def)</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          batch.status === 'Dispatched'
                            ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {batch.status === 'Dispatched' ? <Truck className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{batch.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBatch(batch);
                          }}
                          className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold inline-flex items-center gap-1 border border-stone-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Cert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
