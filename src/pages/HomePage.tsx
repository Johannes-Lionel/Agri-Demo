import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, ChevronRight, BarChart3, Upload, ShieldCheck, Sparkles, Scale, FileText } from 'lucide-react';
import { AgrigradeLogo } from '../components/common/AgrigradeLogo';
import { ActivePage } from '../components/Navigation/Navbar';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
  onFileSelected?: (dataUrl: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onFileSelected }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          if (onFileSelected) {
            onFileSelected(evt.target.result as string);
          }
          onNavigate('new_inspection');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Bar with Agrigrade Logo & Login Button (matching 02 Home) */}
      <div className="flex items-center justify-between pt-2">
        <AgrigradeLogo size="md" />

        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#23492C]">{user.displayName?.split(' ')[0]}</span>
            <div className="w-8 h-8 rounded-full bg-[#23492C] text-white flex items-center justify-center font-bold text-xs">
              {user.displayName?.[0] || 'U'}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="px-4 py-1.5 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] text-white font-bold text-xs shadow-sm transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Welcome Heading */}
      <div className="space-y-1 pt-1">
        <h2 className="text-2xl font-black text-[#23492C] tracking-tight">
          Welcome to Agrigrade
        </h2>
        <p className="text-xs text-[#0F1A13]/70 font-medium">
          Start your grading journey. Upload or capture produce.
        </p>
      </div>

      {/* Card 1: Capture Image (Direct trigger for Smart Capture) */}
      <div
        onClick={() => onNavigate('new_inspection')}
        className="bg-white rounded-3xl p-4 shadow-sm border border-[#E9DFCF] hover:border-[#0B7347]/40 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF2E9] border border-[#D8E8D9] flex items-center justify-center text-[#0B7347]">
            <Camera className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#23492C]">Capture Image</h3>
            <p className="text-xs text-[#0F1A13]/60">Upload your camera</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#F4EBDC] flex items-center justify-center text-[#23492C]">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Card 2: Upload Image (Dashed Box matching 02 Home) */}
      <div className="bg-[#FAF6EE] rounded-3xl p-6 border-2 border-dashed border-[#B8D4B5] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EAF2E9] border border-[#D8E8D9] flex items-center justify-center text-[#23492C]">
          <ImageIcon className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-[#23492C]">Upload Image</h3>
          <p className="text-[11px] text-[#0F1A13]/60">JPG, PNG, 10 MB max</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 rounded-full bg-[#23492C] hover:bg-[#3F5A3A] active:scale-95 text-white font-bold text-xs shadow-md transition"
        >
          Choose File
        </button>
      </div>

      {/* Card 3: Prediction Result / Mandi Ledger */}
      <div
        onClick={() => onNavigate('batch_analytics')}
        className="bg-[#EAF2E9] rounded-3xl p-4 border border-[#D8E8D9] hover:border-[#0B7347]/40 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E8D9] flex items-center justify-center text-[#0B7347]">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#23492C]">Prediction Result</h3>
            <p className="text-xs text-[#0F1A13]/60">Upload data already to know</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#23492C]">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Four-Pillar Quality Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#E9DFCF] space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#23492C] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#0B7347]" />
            <span>Mandi Standard Grading System</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-[#0B7347] bg-[#EAF2E9] px-2 py-0.5 rounded-full">
            Version 2.3
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          <div className="p-2 rounded-2xl bg-[#F4EBDC]/60 text-[10px]">
            <span className="block text-xs">🛑</span>
            <span className="font-bold text-[#23492C]">Rotten</span>
          </div>
          <div className="p-2 rounded-2xl bg-[#F4EBDC]/60 text-[10px]">
            <span className="block text-xs">🌱</span>
            <span className="font-bold text-[#23492C]">Sprouted</span>
          </div>
          <div className="p-2 rounded-2xl bg-[#F4EBDC]/60 text-[10px]">
            <span className="block text-xs">✂️</span>
            <span className="font-bold text-[#23492C]">Damaged</span>
          </div>
          <div className="p-2 rounded-2xl bg-[#F4EBDC]/60 text-[10px]">
            <span className="block text-xs">📏</span>
            <span className="font-bold text-[#23492C]">&lt;45mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
