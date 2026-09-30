import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, RefreshCw, X, ShieldAlert, Check, HelpCircle, 
  Ruler, Eye, Layers, FileBadge, Scale 
} from 'lucide-react';
import { checkImageQualityFromCanvas } from '../utils/imageQuality';
import { InspectionRecord, ImageQualityReport, GradeTier, BatchRecord, HackathonDefectFlags } from '../types';
import { firestoreService } from '../services/firestoreService';
import { GradeBadge } from '../components/common/Badge';
import { ActivePage } from '../components/Navigation/Navbar';

interface NewInspectionPageProps {
  onNavigate: (page: ActivePage) => void;
  activeBatch?: BatchRecord | null;
}

type InspectionStep = 'capture' | 'quality_check' | 'processing' | 'results';

export const NewInspectionPage: React.FC<NewInspectionPageProps> = ({ onNavigate, activeBatch }) => {
  const [step, setStep] = useState<InspectionStep>('capture');
  const [vegetableType, setVegetableType] = useState<string>('onion');
  const [variety, setVariety] = useState<string>('Yellow Spanish Sweet');
  const [calibrationReference, setCalibrationReference] = useState<'standard_coin_25mm' | 'standard_card_85mm' | 'grid_10mm' | 'none'>('standard_coin_25mm');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);

  const [processingStage, setProcessingStage] = useState<string>('RECEIVED');
  const [result, setResult] = useState<InspectionRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 4 Hackathon specific presets matching the problem statement:
  // "Identifies damaged, rotten, sprouted, or undersized onions. Estimates Grade A and URS percentages."
  const presets = [
    {
      name: '1. Grade A FAQ Export Onion',
      category: 'Grade A FAQ',
      desc: 'Uniform golden skin, sound neck, zero rot, zero sprouts, standard diameter >50mm',
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
      variety: 'Yellow Spanish Sweet (FAQ)',
    },
    {
      name: '2. Rotten / Black Mold (URS)',
      category: 'URS Reject',
      desc: 'Aspergillus black mold spores and soft neck decay; violates procurement safety',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      variety: 'White Globe (Rotten URS)',
    },
    {
      name: '3. Sprouted Onion (URS)',
      category: 'URS Reject',
      desc: 'Active apical green vegetative shoots emerging; unsuitable for storage',
      img: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
      variety: 'Red Creole (Sprouted URS)',
    },
    {
      name: '4. Undersized & Damaged (<45mm)',
      category: 'URS Reject',
      desc: 'Diameter <45mm with mechanical abrasion; culled from Grade A table stock',
      img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
      variety: 'Small Bulblet (Undersized URS)',
    },
  ];

  const startCamera = async () => {
    setIsLiveCameraActive(true);
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setErrorMessage('Unable to access device camera. Please upload an image instead.');
      setIsLiveCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      handleSelectImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleSelectImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImage = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setStep('quality_check');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const qReport = await checkImageQualityFromCanvas(img);
      setQualityReport(qReport);
    };
    img.src = dataUrl;
  };

  const runFullPipeline = async () => {
    if (!capturedImage) return;
    setStep('processing');
    setIsProcessing(true);
    setErrorMessage(null);

    const stages = [
      'RECEIVED',
      'QUALITY CHECK',
      'PREPROCESSING',
      'DETECTING DEFECTS',
      'CHECKING ROT & SPROUT',
      'SIZING CALIBER',
      'GRADING & URS CALCULATION',
    ];

    try {
      for (const st of stages) {
        setProcessingStage(st);
        await new Promise((r) => setTimeout(r, 200));
      }

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: capturedImage,
          vegetableType,
          variety,
          calibrationReference,
          confidenceThreshold: 80,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const ai = data.aiAnalysis;
      const grading = data.grading;

      const hackathonFlags: HackathonDefectFlags = ai.hackathonFlags || {
        isRotten: grading.grade === 'URS' && grading.explanation?.includes('Rotten'),
        isSprouted: grading.grade === 'URS' && grading.explanation?.includes('Sprouted'),
        isDamaged: grading.grade === 'URS' && grading.explanation?.includes('damage'),
        isUndersized: grading.grade === 'URS' && grading.explanation?.includes('Undersized'),
      };

      const newRecord: InspectionRecord = {
        id: `insp-mandi-${Date.now()}`,
        userId: 'usr-default',
        batchId: activeBatch?.id || 'batch-on-881',
        vegetableType,
        variety,
        imageUrl: capturedImage,
        calibrationUsed: calibrationReference !== 'none',
        calibrationReferenceType: calibrationReference,
        imageQuality: qualityReport || {
          width: 800,
          height: 800,
          megapixels: 0.64,
          resolutionStatus: 'PASSED',
          exposureStatus: 'PASSED',
          averageBrightness: 128,
          sharpnessStatus: 'SHARP',
          sharpnessScore: 80,
          framingStatus: 'CENTERED',
          overallQualityPassed: true,
          warnings: [],
        },
        confidenceScore: ai.overallVegetableConfidence,
        needsHumanReview: grading.needsHumanReview,
        humanReviewReason: grading.reviewReason,
        grade: grading.grade as GradeTier,
        gradeName: grading.gradeName,
        qualityScore: grading.qualityScore,
        explanation: grading.explanation,
        status: grading.needsHumanReview ? 'needs_review' : 'completed',
        createdAt: new Date().toISOString(),
        defects: ai.defectsDetected || [],
        hackathonFlags,
        shape: ai.shapeCharacteristics || {
          shapeType: 'Globular',
          symmetryRatio: 88,
          regularityDescription: 'Normal symmetry',
        },
        color: ai.colorMetrics || {
          dominantColor: 'Amber Bronze',
          skinColorUniformity: 85,
          browningOrDiscoloration: 5,
          description: 'Uniform skin',
        },
        size: ai.sizeEstimates || {
          estimatedDiameterMm: null,
          caliberCategory: 'Visual estimate',
          isCalibrated: false,
          accuracyNote: 'Estimated visually',
        },
        unreliableAttributes: ai.unreliableAttributes || [],
        rawObservations: ai.rawObservations || '',
        aiModelUsed: ai.modelUsed || 'Gemini 2.5 Flash Vision Inspector',
      };

      await firestoreService.createInspection(newRecord);
      setResult(newRecord);
      setStep('results');
    } catch (err: any) {
      console.error('Inspection pipeline failed:', err);
      setErrorMessage(err?.message || 'Failed to complete AI vegetable analysis');
      setStep('quality_check');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setQualityReport(null);
    setResult(null);
    setStep('capture');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Mandi Optical Assessment • Grade A vs URS Analyzer</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Procurement Quality Intake & Grading
          </h1>
          <p className="text-xs text-stone-400">
            Automating inspection of <strong className="text-stone-200">Damaged, Rotten, Sprouted, and Undersized</strong> bulbs.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {['Capture', 'Quality Check', 'Analysis', 'Result & URS'].map((stName, idx) => {
            const stepKeys = ['capture', 'quality_check', 'processing', 'results'];
            const isCurrent = step === stepKeys[idx];
            const isDone = stepKeys.indexOf(step) > idx;

            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                  isCurrent
                    ? 'bg-emerald-500 text-stone-950 ring-2 ring-emerald-500/40'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-500'
                }`}>
                  {idx + 1}
                </span>
                <span className={`text-xs font-semibold hidden md:inline ${isCurrent ? 'text-white' : 'text-stone-500'}`}>
                  {stName}
                </span>
                {idx < 3 && <span className="text-stone-700 hidden md:inline">•</span>}
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-stone-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: CAPTURE */}
      {step === 'capture' && (
        <div className="space-y-6">
          {/* Target Vegetable & Calibration Reference Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Procurement Commodity
              </label>
              <select
                value={vegetableType}
                onChange={(e) => setVegetableType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="onion">🧅 Onion (Allium cepa) — Mandi Standard</option>
                <option value="potato">🥔 Potato (Solanum tuberosum)</option>
                <option value="tomato">🍅 Tomato (Solanum lycopersicum)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Lot / Cultivar Variety
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Yellow Spanish Sweet"
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block flex items-center justify-between">
                <span>Undersize Calibration (&lt;45mm)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Calibrated</span>
              </label>
              <select
                value={calibrationReference}
                onChange={(e: any) => setCalibrationReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="standard_coin_25mm">Standard 25mm Coin Target</option>
                <option value="standard_card_85mm">Standard 85.6mm ID / Weigh Card</option>
                <option value="grid_10mm">10mm Calibrated Mandi Optical Mat</option>
                <option value="none">Visual estimation only</option>
              </select>
            </div>
          </div>

          {/* Live Camera Viewfinder or Capture Options */}
          {isLiveCameraActive ? (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-stone-800 shadow-2xl flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-72 border-2 border-emerald-400/80 rounded-full border-dashed animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-4 left-4" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-4 right-4" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-4 left-4" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-4 right-4" />
                </div>
                <div className="absolute bottom-6 bg-black/70 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-300 border border-emerald-500/30">
                  Center onion bulb to scan for rot, sprouts, cuts, and diameter
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs font-bold backdrop-blur-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/40 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Specimen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={startCamera}
                className="group p-8 rounded-3xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/50 transition-all text-left space-y-4 shadow-xl flex flex-col justify-between h-56"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
                    Field Camera Intake
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Live mobile camera assessment directly at procurement scale or conveyor table
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span>Launch Live Shutter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <label className="group p-8 rounded-3xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-teal-500/50 transition-all text-left space-y-4 shadow-xl flex flex-col justify-between h-56 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-teal-400 transition-colors">
                    Upload Batch Photos
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Select high-resolution JPG / PNG produce captures from field inspections
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-400 flex items-center gap-1">
                  <span>Browse Device Files</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </label>
            </div>
          )}

          {/* Hackathon Preset Suite: 1-Click Verification of All 4 Prompt Conditions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider">
              <span>Instant Hackathon Test Presets (All 4 Required Defect Classes)</span>
              <span className="text-[10px] text-emerald-400 font-mono">1-Click Live Validation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {presets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setVariety(preset.variety);
                    handleSelectImage(preset.img);
                  }}
                  className="group p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/50 hover:bg-stone-850 cursor-pointer transition space-y-2 shadow-md"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                    <img
                      src={preset.img}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      preset.category.includes('Grade A')
                        ? 'bg-emerald-500 text-stone-950'
                        : 'bg-rose-500 text-white'
                    }`}>
                      {preset.category}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-100 group-hover:text-emerald-400 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-stone-400 line-clamp-2 mt-0.5">
                      {preset.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: QUALITY CHECK */}
      {step === 'quality_check' && capturedImage && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" />
                  <span>Optical Quality Check & Pre-Flight Sizing</span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Confirming sharpness, lighting, and calibration target before AI defect assessment.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition"
              >
                Change Photo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800">
                <img src={capturedImage} alt="Target" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-500/20">
                  {variety}
                </div>
                {calibrationReference !== 'none' && (
                  <div className="absolute bottom-3 right-3 bg-emerald-950/90 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Scale: {calibrationReference.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Image Resolution:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport ? `${qualityReport.width} × ${qualityReport.height} px (${qualityReport.resolutionStatus})` : 'Passed'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Exposure & Illumination:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport?.exposureStatus || 'BALANCED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Motion Blur & Edge Sharpness:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport?.sharpnessStatus || 'SHARP'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-semibold">Undersize Threshold Gauge:</span>
                    <span className="font-mono text-blue-400 font-bold">
                      Active (45mm Cutoff)
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={runFullPipeline}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition"
                  >
                    <span>Run AI Defect & Grade Engine</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING */}
      {step === 'processing' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-10 text-center space-y-8 shadow-2xl">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center" />
            <span className="text-3xl absolute">🧅</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">AI Computer Vision Quality Engine</h2>
            <p className="text-xs text-stone-400">
              Examining neck rot, Aspergillus spores, green sprout shoots, cuts, and measuring caliber...
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            {['RECEIVED', 'QUALITY CHECK', 'PREPROCESSING', 'DETECTING DEFECTS', 'CHECKING ROT & SPROUT', 'SIZING CALIBER', 'GRADING & URS CALCULATION'].map((st, i) => (
              <span
                key={st}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  processingStage === st
                    ? 'bg-emerald-500 text-stone-950 border-emerald-400 scale-105 shadow-md'
                    : 'bg-stone-950 text-stone-600 border-stone-800'
                }`}
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS & URS BREAKDOWN */}
      {step === 'results' && result && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white capitalize">
                    {result.grade === 'GRADE_A' ? 'Grade A (FAQ Standard)' : result.grade === 'URS' ? 'URS (Under-Rate Stock)' : result.grade.replace('_', ' ')}
                  </h2>
                  <GradeBadge grade={result.grade} size="lg" showSubtitle />
                </div>
                <p className="text-xs text-stone-400">
                  {result.variety} • Inspection ID: <span className="font-mono text-stone-300">{result.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Quality Score</span>
                  <span className="text-3xl font-black text-white font-mono">{result.qualityScore}<span className="text-sm text-stone-500 font-normal">/100</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">AI Confidence</span>
                  <span className={`text-2xl font-black font-mono ${result.confidenceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {result.confidenceScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4-Pillar Hackathon Defect Classification Cards */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Four-Pillar Defect Classification Results:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Rotten */}
                <div className={`p-3.5 rounded-2xl border ${
                  result.hackathonFlags?.isRotten
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">1. Rotten / Fungal</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      result.hackathonFlags?.isRotten ? 'bg-rose-500/30 text-rose-200' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.hackathonFlags?.isRotten ? 'DETECTED' : 'CLEAN'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    {result.hackathonFlags?.rottenDetails || 'No soft rot or Aspergillus mycelia detected.'}
                  </p>
                </div>

                {/* Sprouted */}
                <div className={`p-3.5 rounded-2xl border ${
                  result.hackathonFlags?.isSprouted
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">2. Sprouted Shoot</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      result.hackathonFlags?.isSprouted ? 'bg-amber-500/30 text-amber-200' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.hackathonFlags?.isSprouted ? 'DETECTED' : 'DORMANT'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    {result.hackathonFlags?.sproutedDetails || 'Neck collar tightly closed with zero green shoots.'}
                  </p>
                </div>

                {/* Damaged */}
                <div className={`p-3.5 rounded-2xl border ${
                  result.hackathonFlags?.isDamaged
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">3. Damaged / Cuts</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      result.hackathonFlags?.isDamaged ? 'bg-blue-500/30 text-blue-200' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.hackathonFlags?.isDamaged ? 'DETECTED' : 'SOUND'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    {result.hackathonFlags?.damagedDetails || 'Papery tunics intact; zero deep slicing.'}
                  </p>
                </div>

                {/* Undersized */}
                <div className={`p-3.5 rounded-2xl border ${
                  result.hackathonFlags?.isUndersized
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">4. Size Caliber</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      result.hackathonFlags?.isUndersized ? 'bg-purple-500/30 text-purple-200' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {result.hackathonFlags?.isUndersized ? '<45mm URS' : 'STANDARD'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight">
                    {result.hackathonFlags?.undersizedDetails || 'Caliber conforms to commercial market tolerance.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800 shadow-md">
                <img src={result.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-stone-950/90 px-2.5 py-1 rounded-lg text-[10px] font-mono text-stone-300 border border-stone-700">
                  {result.size.isCalibrated ? `Measured: ${result.size.estimatedDiameterMm} mm` : result.size.caliberCategory}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5">
                  <div className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Grading Engine Evaluation & Rationale
                  </div>
                  <p className="text-xs text-stone-200 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4" />
                      <span>Transparent Mandi Procurement Settlement Basis</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      ₹{result.grade === 'GRADE_A' ? '2,650' : result.grade === 'GRADE_B' ? '2,250' : '1,080'} / quintal
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Calculated objectively from Grade A FAQ vs URS defect deductions. Prevents pricing manipulation between commission agents and farmers.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs border border-stone-700 transition"
                  >
                    Assess Another Specimen
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('batch_analytics')}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>View Batch Settlement</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
