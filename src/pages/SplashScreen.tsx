import React from 'react';
import { AgrigradeLogo } from '../components/common/AgrigradeLogo';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between items-center bg-[#F4EBDC] overflow-hidden text-center px-6 py-10 select-none animate-in fade-in duration-500">
      {/* Decorative Floating Leaf at Top Left */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-[#E3EFE1] rounded-full blur-2xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-sm z-10 pt-8">
        {/* Big Official Logo Emblem */}
        <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-4 border-[#23492C]/20 bg-[#164426] flex items-center justify-center p-0 group">
          <img src="/logo.svg" alt="Agrigrade Emblem" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3">
          <img src="/top-logo.svg" alt="Agrigrade" className="h-10 w-auto mx-auto object-contain" />
          <p className="text-xs font-bold text-[#0F1A13] tracking-wide">
            AI-Powered Vegetable Quality Grading
          </p>
          <p className="text-[11px] text-[#23492C]/70">
            Instant multi-specimen counting • 4-pillar defect inspection • Mandi settlement
          </p>
        </div>

        {/* Get Started Button */}
        <div className="pt-4 w-full">
          <button
            onClick={onStart}
            className="w-full py-4 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] active:scale-[0.98] text-white font-bold text-sm shadow-xl shadow-[#0B7347]/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center gap-2 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#23492C]" />
          <span className="w-2 h-2 rounded-full bg-[#9BCA4A]" />
          <span className="w-2 h-2 rounded-full bg-[#D8E8D9]" />
        </div>
      </div>

      {/* Organic Layered Wavy Hill Landscape at the Bottom */}
      <div className="relative w-full h-32 mt-6 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path d="M 0 60 Q 120 10 240 70 T 400 40 L 400 120 L 0 120 Z" fill="#9BCA4A" opacity="0.8" />
        </svg>
        <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 400 90" preserveAspectRatio="none">
          <path d="M 0 40 Q 160 80 280 20 T 400 50 L 400 90 L 0 90 Z" fill="#6CC330" opacity="0.9" />
        </svg>
        <svg className="absolute bottom-0 w-full h-16" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M 0 30 Q 100 10 220 40 T 400 20 L 400 60 L 0 60 Z" fill="#23492C" />
        </svg>
      </div>
    </div>
  );
};
