import React from 'react';
import { GradeTier } from '../../types/index';

interface GradeBadgeProps {
  grade: GradeTier;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, size = 'md', showSubtitle = false }) => {
  const configs: Record<GradeTier, { bg: string; label: string; sub: string; dot: string }> = {
    GRADE_A: {
      bg: 'bg-[#23492C] text-white border border-[#23492C]',
      label: 'Grade A',
      sub: 'FAQ Export Standard',
      dot: 'bg-[#6CC330]',
    },
    GRADE_B: {
      bg: 'bg-[#0B7347] text-white border border-[#0B7347]',
      label: 'Grade B',
      sub: 'Commercial Retail',
      dot: 'bg-white',
    },
    GRADE_C: {
      bg: 'bg-[#FAF6EE] text-[#0F1A13] border border-[#E9DFCF]',
      label: 'Grade C',
      sub: 'Processing',
      dot: 'bg-amber-500',
    },
    URS: {
      bg: 'bg-rose-100 text-rose-800 border border-rose-300',
      label: 'URS (Under-Rate)',
      sub: 'Defective / Cull',
      dot: 'bg-rose-500',
    },
    REJECT: {
      bg: 'bg-rose-100 text-rose-800 border border-rose-300',
      label: 'URS / Rejected',
      sub: 'Rotten / Sprouted Cull',
      dot: 'bg-rose-500',
    },
  };

  const c = configs[grade] || configs.GRADE_B;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3.5 py-1 font-extrabold',
    lg: 'text-sm px-4 py-1.5 font-black',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full shadow-xs ${c.bg} ${sizeClasses[size]}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span>{c.label}</span>
      {showSubtitle && <span className="opacity-80 text-[0.8em] font-normal">({c.sub})</span>}
    </span>
  );
};
