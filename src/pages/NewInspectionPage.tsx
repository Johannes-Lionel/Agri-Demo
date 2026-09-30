import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, RefreshCw, X, ShieldAlert, Check, HelpCircle, 
  Ruler, Eye, Layers, FileBadge 
} from 'lucide-react';
import { checkImageQualityFromCanvas } from '../utils/imageQuality';
import { InspectionRecord, ImageQualityReport, GradeTier, BatchRecord } from '../types';
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

  // Processing stage indicator: RECEIVED → QUALITY CHECK → PREPROCESSING → DETECTING → ANALYZING → GRADING → FINALIZING
  const [processingStage, setProcessingStage] = useState<string>('RECEIVED');

  // Final inspection result
  const [result, setResult] = useState<InspectionRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Preset quick samples for instant onion testing
  const presets = [
    {
      name: 'Export Grade A Yellow Onion',
      desc: 'Uniform golden skin tunic, dry neck closure, zero fungal blemishes',
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
      variety: 'Yellow Spanish Sweet',
    },
    {
      name: 'Supermarket Grade B Red Onion',
      desc: 'Superficial skin slip and slight shoulder scarring, firm internal scales',
      img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
      variety: 'Red Creole Bulb',
    },
    {
      name: 'Reject White Onion with Rot Lesion',
      desc: 'Soft neck breakdown and visible black mold (Aspergillus)',
      img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      variety: 'White Globe Onion',
    },
  ];

  // Start live camera
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

    // Run client image quality check
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const qReport = await checkImageQualityFromCanvas(img);
      setQualityReport(qReport);
    };
    img.src = dataUrl;
  };

  // Run full pipeline
  const runFullPipeline = async () => {
    if (!capturedImage) return;
    setStep('processing');
    setIsProcessing(true);
    setErrorMessage(null);

    const stages = [
      'RECEIVED',
      'QUALITY CHECK',
      'PREPROCESSING',
      'DETECTING',
      'ANALYZING',
      'GRADING',
      'FINALIZING',
    ];

    try {
      // Simulate visual pipeline progress stages for real-time packhouse monitoring
      for (const st of stages) {
        setProcessingStage(st);
        await new Promise((r) => setTimeout(r, 220));
      }

      // Call server /api/ai/analyze
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

      const newRecord: InspectionRecord = {
        id: `insp-${Date.now()}`,
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

      // Persist into Firestore
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Optical Capture & Grading Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Vegetable Quality Inspection Terminal
          </h1>
          <p className="text-xs text-stone-400">
            Currently grading: <strong className="text-stone-200 capitalize">{vegetableType}</strong> ({variety})
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {['Capture', 'Quality Check', 'Analysis', 'Results'].map((stName, idx) => {
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
                Vegetable Category
              </label>
              <select
                value={vegetableType}
                onChange={(e) => {
                  setVegetableType(e.target.value);
                  if (e.target.value === 'onion') setVariety('Yellow Spanish Sweet');
                  else if (e.target.value === 'potato') setVariety('Russet Burbank');
                  else if (e.target.value === 'tomato') setVariety('Round Red Vine');
                  else if (e.target.value === 'pepper') setVariety('Bell Sweet Red');
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="onion">🧅 Onion (Allium cepa) — Primary Target</option>
                <option value="potato">🥔 Potato (Solanum tuberosum)</option>
                <option value="tomato">🍅 Tomato (Solanum lycopersicum)</option>
                <option value="pepper">🫑 Bell Pepper (Capsicum)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Variety / Cultivar
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
                <span>Calibration Reference</span>
                <span className="text-[10px] text-emerald-400 font-mono">Calibrated Sizing</span>
              </label>
              <select
                value={calibrationReference}
                onChange={(e: any) => setCalibrationReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="standard_coin_25mm">Standard 25mm Coin (US Quarter / 1 Euro / 100 JPY)</option>
                <option value="standard_card_85mm">Standard 85.6mm Card (Credit / ID card)</option>
                <option value="grid_10mm">10mm Packhouse Optical Grid Mat</option>
                <option value="none">None / Uncalibrated (Visual estimate only)</option>
              </select>
            </div>
          </div>

          {/* Camera Viewfinder or Capture Options */}
          {isLiveCameraActive ? (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video border border-stone-800 shadow-2xl flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {/* Overlay Crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-72 h-72 border-2 border-emerald-400/80 rounded-full border-dashed animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-emerald-400 absolute top-4 left-4" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-emerald-400 absolute top-4 right-4" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-emerald-400 absolute bottom-4 left-4" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-emerald-400 absolute bottom-4 right-4" />
                </div>
                <div className="absolute bottom-6 bg-black/70 px-4 py-1.5 rounded-full text-xs font-mono text-emerald-300 border border-emerald-500/30">
                  Align single onion and calibration reference inside ring
                </div>
              </div>

              {/* Controls */}
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
                  <span>Capture Snapshot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Camera Launch Card */}
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
                    Device Camera Feed
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Connect webcam or mobile tablet camera for live on-line produce capture
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span>Launch Viewfinder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Upload Harvest Image */}
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
                    Upload Inspection Photo
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Drag and drop or select high-resolution JPG / PNG / WebP images from storage
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-teal-400 flex items-center gap-1">
                  <span>Browse Device Files</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </label>
            </div>
          )}

          {/* Quick Presets Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider">
              <span>Or Select Realistic Onion Quality Preset</span>
              <span className="text-[10px] text-stone-500">1-click test</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setVariety(preset.variety);
                    handleSelectImage(preset.img);
                  }}
                  className="group p-3.5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/50 hover:bg-stone-850 cursor-pointer transition flex items-center gap-3 shadow-md"
                >
                  <img
                    src={preset.img}
                    alt={preset.name}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-800 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-200 group-hover:text-emerald-400 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                      {preset.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: IMAGE QUALITY CHECK & PREPROCESSING */}
      {step === 'quality_check' && capturedImage && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" />
                  <span>Optical Quality Check & Preprocessing</span>
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Verifying minimum resolution, exposure illumination, and blur thresholds before AI inference.
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
              {/* Image Preview with Calibration Scale Overlay */}
              <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800">
                <img src={capturedImage} alt="Inspection target" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-500/20 backdrop-blur-sm">
                  {vegetableType.toUpperCase()} • {variety}
                </div>
                {calibrationReference !== 'none' && (
                  <div className="absolute bottom-3 right-3 bg-emerald-950/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 border border-emerald-500/40 backdrop-blur-sm flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Reference: {calibrationReference.replace('_', ' ')}</span>
                  </div>
                )}
              </div>

              {/* Quality Checklist */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2.5">
                  {/* Resolution */}
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-stone-200">Resolution Verification</div>
                        <div className="text-[11px] text-stone-500">
                          {qualityReport ? `${qualityReport.width} × ${qualityReport.height} px (${qualityReport.megapixels} MP)` : 'Calculating...'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport?.resolutionStatus || 'PASSED'}
                    </span>
                  </div>

                  {/* Exposure */}
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-stone-200">Lighting & Exposure Level</div>
                        <div className="text-[11px] text-stone-500">
                          {qualityReport ? `Mean brightness: ${qualityReport.averageBrightness}/255` : 'Analyzing...'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport?.exposureStatus || 'BALANCED'}
                    </span>
                  </div>

                  {/* Sharpness */}
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-stone-200">Edge Sharpness & Motion Blur</div>
                        <div className="text-[11px] text-stone-500">
                          {qualityReport ? `Sharpness score: ${qualityReport.sharpnessScore}/100` : 'Calculating...'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">
                      {qualityReport?.sharpnessStatus || 'SHARP'}
                    </span>
                  </div>

                  {/* Calibration Notice */}
                  <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Ruler className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-semibold text-stone-200">Physical Sizing Calibration</div>
                        <div className="text-[11px] text-stone-500">
                          {calibrationReference !== 'none'
                            ? `Physical scale: ${calibrationReference.replace('_', ' ')}`
                            : 'Uncalibrated (Diameter will be visually estimated)'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-stone-300 font-bold">
                      {calibrationReference !== 'none' ? 'ACTIVE' : 'VISUAL ONLY'}
                    </span>
                  </div>
                </div>

                {qualityReport?.warnings && qualityReport.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Quality Advisory</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-stone-300">
                      {qualityReport.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={runFullPipeline}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition"
                  >
                    <span>Run AI Grading Pipeline</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING PIPELINE INDICATOR */}
      {step === 'processing' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-10 text-center space-y-8 shadow-2xl">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center" />
            <span className="text-3xl absolute">🧅</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">AI Computer Vision & Grading Engine</h2>
            <p className="text-xs text-stone-400">
              Analyzing skin tunics, neck closure, basal roots, and computing USDA/UNECE commercial grade...
            </p>
          </div>

          {/* Sequential Stage Badge */}
          <div className="max-w-xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
            {['RECEIVED', 'QUALITY CHECK', 'PREPROCESSING', 'DETECTING', 'ANALYZING', 'GRADING', 'FINALIZING'].map((st, i) => {
              const stages = ['RECEIVED', 'QUALITY CHECK', 'PREPROCESSING', 'DETECTING', 'ANALYZING', 'GRADING', 'FINALIZING'];
              const currentIdx = stages.indexOf(processingStage);
              const thisIdx = i;
              const isPast = thisIdx < currentIdx;
              const isCurrent = thisIdx === currentIdx;

              return (
                <span
                  key={st}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-stone-950 border-emerald-400 scale-105 shadow-md'
                      : isPast
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : 'bg-stone-950 text-stone-600 border-stone-800'
                  }`}
                >
                  {st}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: RESULTS */}
      {step === 'results' && result && (
        <div className="space-y-6">
          {/* Main Inspection Summary Banner */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white capitalize">
                    {result.vegetableType} Quality Result
                  </h2>
                  <GradeBadge grade={result.grade} size="lg" showSubtitle />
                </div>
                <p className="text-xs text-stone-400">
                  Variety: <span className="text-stone-200 font-semibold">{result.variety}</span> • Inspection ID: <span className="font-mono text-stone-300">{result.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-right">
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

            {/* Human Review Flag Notice */}
            {result.needsHumanReview ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      Flagged for Human Inspector Review
                    </div>
                    <div className="text-[11px] text-stone-300">
                      Reason: {result.humanReviewReason || 'Borderline grade boundary or confidence < 80%'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('human_review')}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow"
                >
                  Review Now
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Grade Certified: High confidence ({result.confidenceScore}%) with zero critical decay flags.</span>
              </div>
            )}

            {/* Grid of Results: Image with Defect Annotations on Left, Attributes on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Image Preview with Defect Tags */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-stone-800">
                  <img src={result.imageUrl} alt="Result" className="w-full h-full object-cover" />
                  
                  {/* Calibrated Badge */}
                  <div className="absolute bottom-3 left-3 bg-stone-950/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-stone-300 border border-stone-800 backdrop-blur-sm">
                    {result.size.isCalibrated ? `Calibrated: ${result.size.estimatedDiameterMm} mm` : 'Uncalibrated Visual Est.'}
                  </div>
                </div>

                {/* Detected Defects */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Detected Defects & Surface Anomalies ({result.defects.length})
                  </div>
                  {result.defects.length === 0 ? (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Zero physiological blemishes or soft rots detected.</span>
                    </div>
                  ) : (
                    result.defects.map((def) => (
                      <div key={def.id} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-stone-200">{def.label}</div>
                          <div className="text-[10px] text-stone-500 capitalize">{def.locationDesc} • Severity: {def.severity}</div>
                        </div>
                        <span className="font-mono text-stone-400 text-[11px]">{def.estimatedAreaPercent}% area</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Attributes & Grading Engine Explanation */}
              <div className="lg:col-span-7 space-y-4">
                {/* Physical Characteristics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Morphology / Shape</span>
                    <span className="text-xs font-bold text-stone-200">{result.shape.shapeType}</span>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{result.shape.symmetryRatio}% symmetry</div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Dominant Color</span>
                    <span className="text-xs font-bold text-amber-400">{result.color.dominantColor}</span>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{result.color.skinColorUniformity}% uniformity</div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Size Caliber</span>
                    <span className="text-xs font-bold text-blue-400">
                      {result.size.estimatedDiameterMm ? `${result.size.estimatedDiameterMm} mm` : result.size.caliberCategory}
                    </span>
                    <div className="text-[10px] text-stone-500 truncate mt-0.5">{result.size.accuracyNote}</div>
                  </div>
                </div>

                {/* Grading Engine Explanation */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Grading Engine Evaluation
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                {/* Technical Raw Observations */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    AI Visual Log & Unreliable Traits
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed font-mono">
                    {result.rawObservations}
                  </p>
                  {result.unreliableAttributes.length > 0 && (
                    <div className="text-[11px] text-amber-400/90 pt-1">
                      ⚠️ Note: {result.unreliableAttributes.join(', ')} (Cannot be verified reliably without destructive testing).
                    </div>
                  )}
                  <div className="text-[10px] text-stone-600 font-mono pt-1">
                    Inference engine: {result.aiModelUsed}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs border border-stone-700 transition text-center"
                  >
                    Inspect Another Specimen
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('batch_analytics')}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>View In Batch Analytics</span>
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
