import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Layers, Plus, FileText, 
  ArrowLeft, CheckCircle2, ChevronRight, Scale, Award 
} from 'lucide-react';
import { BatchRecord, InspectionRecord } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ActivePage } from '../components/Navigation/Navbar';

interface BatchAnalyticsPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const BatchAnalyticsPage: React.FC<BatchAnalyticsPageProps> = ({ onNavigate }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const bList = await firestoreService.getBatches();
      const iList = await firestoreService.getInspections();
      setBatches(bList);
      setInspections(iList);
      if (bList.length > 0) {
        setSelectedBatch(bList[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Compute Fresh vs Rotten / URS percentages
  const total = inspections.length || 1;
  const rottenCount = inspections.filter((i) => i.hackathonFlags?.isRotten || i.grade === 'URS').length;
  const freshCount = inspections.length > 0 ? inspections.length - rottenCount : 0;
  const freshPercent = inspections.length > 0 ? Math.round((freshCount / inspections.length) * 100) : 75;
  const rottenPercent = inspections.length > 0 ? Math.round((rottenCount / inspections.length) * 100) : 25;

  // Grade Distribution
  const gradeACount = inspections.filter((i) => i.grade === 'GRADE_A').length;
  const gradeBCount = inspections.filter((i) => i.grade === 'GRADE_B').length;
  const rejectCount = inspections.filter((i) => i.grade === 'URS' || i.grade === 'REJECT').length;

  const pctA = inspections.length > 0 ? Math.round((gradeACount / total) * 100) : 52;
  const pctB = inspections.length > 0 ? Math.round((gradeBCount / total) * 100) : 32;
  const pctReject = inspections.length > 0 ? Math.round((rejectCount / total) * 100) : 16;

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20 animate-in fade-in select-none">
      {/* Header matching 06 Analytics */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigate('dashboard')}
          className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-extrabold text-[#23492C]">Analytics</h2>
        <div className="w-9" />
      </div>

      {/* Card 1: Fresh vs Rotten Donut Chart matching 06 Analytics */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9DFCF] space-y-4">
        <h3 className="text-sm font-extrabold text-[#23492C]">Fresh vs Rotten</h3>

        <div className="flex items-center justify-around py-2">
          {/* Donut Chart Visual */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Rotten segment */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#D9534F"
                strokeWidth="16"
                strokeDasharray={`${rottenPercent * 2.38} 238`}
                strokeDashoffset="0"
              />
              {/* Fresh segment */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#0B7347"
                strokeWidth="16"
                strokeDasharray={`${freshPercent * 2.38} 238`}
                strokeDashoffset={`-${rottenPercent * 2.38}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-[#23492C]">{freshPercent}%</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-[#0B7347]" />
              <div>
                <span className="font-bold text-[#23492C] block">Fresh</span>
                <span className="text-[11px] text-[#0F1A13]/60">{freshPercent}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-[#D9534F]" />
              <div>
                <span className="font-bold text-[#D9534F] block">Rotten (URS)</span>
                <span className="text-[11px] text-[#0F1A13]/60">{rottenPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Grade Distribution Bar Chart matching 06 Analytics */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9DFCF] space-y-4">
        <h3 className="text-sm font-extrabold text-[#23492C]">Grade Distribution</h3>

        {/* Bar Chart Visual */}
        <div className="h-44 flex items-end justify-around gap-6 pt-4 pb-2 border-b border-[#E9DFCF]">
          {/* Grade A */}
          <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-black text-[#23492C]">{pctA}%</span>
            <div 
              style={{ height: `${Math.max(15, pctA * 1.3)}px` }}
              className="w-12 bg-[#23492C] rounded-2xl transition-all duration-500 shadow-sm"
            />
            <span className="text-xs font-bold text-[#0F1A13]/70">A</span>
          </div>

          {/* Grade B */}
          <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-black text-[#0B7347]">{pctB}%</span>
            <div 
              style={{ height: `${Math.max(15, pctB * 1.3)}px` }}
              className="w-12 bg-[#0B7347] rounded-2xl transition-all duration-500 shadow-sm"
            />
            <span className="text-xs font-bold text-[#0F1A13]/70">B</span>
          </div>

          {/* Reject / URS */}
          <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-black text-[#9BCA4A]">{pctReject}%</span>
            <div 
              style={{ height: `${Math.max(15, pctReject * 1.3)}px` }}
              className="w-12 bg-[#9BCA4A] rounded-2xl transition-all duration-500 shadow-sm"
            />
            <span className="text-xs font-bold text-[#0F1A13]/70">Reject</span>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="flex items-center justify-between text-xs text-[#0F1A13]/70 pt-1">
          <span>Total Inspected: <strong className="text-[#23492C]">{inspections.length} samples</strong></span>
          <button
            onClick={() => onNavigate('reports')}
            className="text-[#0B7347] font-bold hover:underline"
          >
            View Official Slips →
          </button>
        </div>
      </div>

      {/* Mandi Payout Settlement Card */}
      <div className="bg-[#EAF2E9] rounded-3xl p-5 border border-[#D8E8D9] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#23492C] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#0B7347]" />
            <span>Mandi Farmer Settlement Payout</span>
          </span>
          <span className="font-mono text-xs font-black text-[#0B7347]">
            ₹{selectedBatch?.settlement?.totalFarmerPayout ? selectedBatch.settlement.totalFarmerPayout.toLocaleString() : '96,000'}
          </span>
        </div>
        <p className="text-[11px] text-[#0F1A13]/60 leading-relaxed">
          Base MSP ₹2,400 + Grade A premium - URS defect deductions. Eliminates dispute between commission agents and growers.
        </p>
      </div>
    </div>
  );
};
