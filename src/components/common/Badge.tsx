import React from 'react';
import { GradeTier } from '../../types/grading';

interface GradeBadgeProps {
  grade: GradeTier;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, size = 'md', showSubtitle = false }) => {
  const configs = {
    GRADE_A: {
      bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
      label: 'Grade A',
      sub: 'Export Quality',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
      dot: 'bg-emerald-400',
    },
    GRADE_B: {
      bg: 'bg-blue-950/80 text-blue-400 border-blue-500/40',
      label: 'Grade B',
      sub: 'Domestic Retail',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]',
      dot: 'bg-blue-400',
    },
    GRADE_C: {
      bg: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
      label: 'Grade C',
      sub: 'Processing / Puree',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      dot: 'bg-amber-400',
    },
    REJECT: {
      bg: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
      label: 'Reject / Culled',
      sub: 'Defective / Spoiled',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
      dot: 'bg-rose-400',
    },
  };

  const c = configs[grade] || configs.GRADE_B;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-semibold',
    lg: 'text-base px-4 py-1.5 font-bold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full ${c.bg} ${c.glow} ${sizeClasses[size]}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      <span>{c.label}</span>
      {showSubtitle && <span className="opacity-70 text-[0.8em]">({c.sub})</span>}
    </span>
  );
};
