import React from 'react';
import { 
  Scan, ArrowRight, ShieldCheck, CheckCircle2, 
  Layers, QrCode, Cpu, UserCheck, Sparkles, Award
} from 'lucide-react';
import { ActivePage } from '../components/Navigation/Navbar';

interface LandingPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-stone-800 p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Industrial Agritech Vision • Starting with Onions (Allium cepa)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            AI-Assisted Vegetable Quality Grading & Certification
          </h1>

          <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
            Eliminate subjective packing line sorting. AgriGrade automates optical defect inspection, 
            morphological sizing, skin curing analysis, and certified grade assignment—backed by 
            transparent human review workflows and tamper-evident QR verification.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('new_inspection')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Scan className="w-4 h-4" />
              <span>Launch New Inspection</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3.5 rounded-2xl bg-stone-850 hover:bg-stone-800 text-stone-200 font-bold text-sm border border-stone-700 transition"
            >
              Open Packhouse Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Core Flow Pipeline Visualizer */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-white">The AgriGrade Precision Pipeline</h2>
          <p className="text-sm text-stone-400">
            Engineered for real packhouses with strict validation gates—never fabricating values.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { step: '1', title: 'Capture', sub: 'Device Camera / Upload', icon: '📸' },
            { step: '2', title: 'Quality Check', sub: 'Blur, lighting & resolution', icon: '🔍' },
            { step: '3', title: 'Preprocessing', sub: 'Normalization & centering', icon: '⚙️' },
            { step: '4', title: 'AI Vision', sub: 'Gemini + YOLO adapter', icon: '🧠' },
            { step: '5', title: 'Grading Engine', sub: 'Configurable tolerances', icon: '⚖️' },
            { step: '6', title: 'Human Review', sub: 'Flagged low-confidence queue', icon: '👨‍🌾' },
            { step: '7', title: 'Certify & QR', sub: 'Tamper-evident reports', icon: '📜' },
          ].map((item, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/40 transition flex flex-col items-center text-center space-y-2 shadow-md"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="w-5 h-5 rounded-full bg-stone-800 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center">
                {item.step}
              </div>
              <div className="font-bold text-xs text-stone-100">{item.title}</div>
              <div className="text-[10px] text-stone-400 leading-tight">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Modular AI Vision Interface</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Standardized <code className="text-emerald-400">IVegetableAIService</code> interface powered 
            by Gemini 2.5 Flash, architected to hot-swap custom PyTorch / YOLOv8 ONNX models 
            without rewriting business logic.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Human-In-The-Loop Governance</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Inspections falling below configurable confidence thresholds or presenting ambiguous defects 
            are immediately routed to certified human inspectors for override or confirmation.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Cryptographic QR Verification</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            Every finalized harvest batch generates a certified digital PDF report with unique QR code 
            linking to public <code className="text-blue-400">/verify/:reportId</code> verification 
            records without leaking sensitive grower data.
          </p>
        </div>
      </div>
    </div>
  );
};
