import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Camera, Image as ImageIcon, Zap, ZapOff, 
  Check, AlertCircle, RotateCcw, AlertTriangle, 
  Ruler, HelpCircle, Layers, CheckCircle2 
} from 'lucide-react';
import { checkImageQualityFromCanvas } from '../utils/imageQuality';
import { InspectionRecord, ImageQualityReport, GradeTier, BatchRecord, HackathonDefectFlags } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ActivePage } from '../components/Navigation/Navbar';

interface NewInspectionPageProps {
  onNavigate: (page: ActivePage) => void;
  activeBatch?: BatchRecord | null;
  initialImageDataUrl?: string | null;
}

type ScreenMode = 'smart_capture' | 'analyzing' | 'analysis_result' | 'rejection';

export const NewInspectionPage: React.FC<NewInspectionPageProps> = ({ 
  onNavigate, 
  activeBatch,
  initialImageDataUrl = null
}) => {
  const [mode, setMode] = useState<ScreenMode>('smart_capture');
  const [smartGatingActive, setSmartGatingActive] = useState<boolean>(true);
  const [calibrationMode, setCalibrationMode] = useState<boolean>(false);
  const [flashOn, setFlashOn] = useState<boolean>(false);

  // Vegetable selection with Auto-Detect as preferred
  const [selectedVegCategory, setSelectedVegCategory] = useState<string>('auto');
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImageDataUrl);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);

  // Analyzing stage
  const [analyzingProgress, setAnalyzingProgress] = useState<number>(30);
  const [analyzingStage, setAnalyzingStage] = useState<'preprocessing' | 'computervision' | 'defection'>('preprocessing');
  const [result, setResult] = useState<InspectionRecord | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImageDataUrl) {
      handleSelectImage(initialImageDataUrl);
    } else {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [initialImageDataUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream fallback:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      // Turn off torch if it was on
      try {
        const track = streamRef.current.getVideoTracks()[0];
        if (track && (track.getCapabilities?.() as any)?.torch) {
          (track as any).applyConstraints({ advanced: [{ torch: false }] });
        }
      } catch (e) {}
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Hardware Torch Flash Toggle
  const toggleFlash = async () => {
    const nextState = !flashOn;
    setFlashOn(nextState);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities?.() as any) || {};
          if (capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: nextState }],
            });
          }
        } catch (err) {
          console.warn('Hardware torch error:', err);
        }
      }
    }
  };

  const captureFrame = () => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        stopCamera();
        handleSelectImage(dataUrl);
        return;
      }
    }
    galleryInputRef.current?.click();
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          stopCamera();
          handleSelectImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectImage = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setMode('analyzing');
    setAnalyzingProgress(25);
    setAnalyzingStage('preprocessing');
    setRejectionMessage(null);
    setErrorMessage(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const qReport = await checkImageQualityFromCanvas(img);
      setQualityReport(qReport);
    };
    img.src = dataUrl;

    setTimeout(() => {
      setAnalyzingStage('computervision');
      setAnalyzingProgress(60);
    }, 600);

    setTimeout(async () => {
      setAnalyzingStage('defection');
      setAnalyzingProgress(85);

      try {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            vegetableType: selectedVegCategory === 'auto' ? 'vegetable' : selectedVegCategory,
            calibrationReference: calibrationMode ? 'standard_coin_25mm' : 'none',
            confidenceThreshold: 80,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis server error');
        }

        const data = await response.json();
        const ai = data.aiAnalysis;
        const grading = data.grading;

        // CHECK 1: If it's a fruit or non-vegetable, show clear rejection!
        if (ai.isVegetable === false || ai.noVegetableFound === true || grading.grade === 'REJECT') {
          setRejectionMessage(
            ai.rejectionReason || grading.explanation || 'No agricultural vegetables detected in image. AgriGrade strictly inspects agricultural vegetables (such as potato, onion, tomato, carrot), not humans, fruits, or random objects.'
          );
          setMode('rejection');
          return;
        }

        const detectedVeg = ai.vegetableDetected || (selectedVegCategory !== 'auto' ? selectedVegCategory : 'Vegetable');

        const hackathonFlags: HackathonDefectFlags = ai.hackathonFlags || {
          isRotten: grading.grade === 'URS' && grading.explanation?.includes('Rotten'),
          isSprouted: grading.grade === 'URS' && grading.explanation?.includes('Sprouted'),
          isDamaged: grading.grade === 'URS' && grading.explanation?.includes('damage'),
          isUndersized: grading.grade === 'URS' && grading.explanation?.includes('Undersized'),
        };

        const counts = ai.counts || {
          totalCount: 1,
          goodCount: grading.grade === 'GRADE_A' ? 1 : 0,
          defectiveCount: grading.grade === 'GRADE_A' ? 0 : 1,
          goodPercent: grading.grade === 'GRADE_A' ? 100 : 0,
          defectivePercent: grading.grade === 'GRADE_A' ? 0 : 100,
        };

        const newRecord: InspectionRecord = {
          id: `AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: 'usr-default',
          batchId: activeBatch?.id || 'batch-live-01',
          vegetableType: detectedVeg,
          variety: ai.botanicalName || `${detectedVeg} Cultivar`,
          botanicalName: ai.botanicalName,
          imageUrl: dataUrl,
          calibrationUsed: calibrationMode,
          imageQuality: qualityReport || {
            width: 800,
            height: 800,
            megapixels: 0.64,
            resolutionStatus: 'PASSED',
            exposureStatus: 'PASSED',
            averageBrightness: 128,
            sharpnessStatus: 'SHARP',
            sharpnessScore: 82,
            framingStatus: 'CENTERED',
            overallQualityPassed: true,
            warnings: [],
          },
          confidenceScore: ai.overallVegetableConfidence || 94,
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
          counts,
          isVegetable: true,
          shape: ai.shapeCharacteristics || {
            shapeType: 'Characteristic form',
            symmetryRatio: 88,
            regularityDescription: 'Normal symmetry',
          },
          color: ai.colorMetrics || {
            dominantColor: 'Natural pigment',
            skinColorUniformity: 85,
            browningOrDiscoloration: 5,
            description: 'Outer peel evaluated',
          },
          size: ai.sizeEstimates || {
            estimatedDiameterMm: calibrationMode ? 64.0 : null,
            caliberCategory: 'Commercial Caliber',
            isCalibrated: calibrationMode,
            accuracyNote: calibrationMode ? 'Calibrated reference' : 'Visual estimate',
          },
          unreliableAttributes: ai.unreliableAttributes || [],
          rawObservations: ai.rawObservations || '',
          aiModelUsed: 'Agrigrade Multi-Vegetable AI Engine',
        };

        await firestoreService.createInspection(newRecord);
        setResult(newRecord);
        setAnalyzingProgress(100);
        setTimeout(() => {
          setMode('analysis_result');
        }, 300);
      } catch (err: any) {
        console.error('Analysis error:', err);
        setErrorMessage('Failed to connect to AI vision server. Please retake photo.');
        setMode('smart_capture');
        startCamera();
      }
    }, 1400);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setRejectionMessage(null);
    setMode('smart_capture');
    startCamera();
  };

  return (
    <div className="max-w-md mx-auto min-h-[85vh] flex flex-col justify-between select-none animate-in fade-in pb-16">
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryUpload}
        className="hidden"
      />

      {/* Screen Brightness Booster Flash Overlay */}
      {flashOn && (
        <div className="fixed inset-0 z-30 pointer-events-none bg-white/40 backdrop-brightness-150 transition-opacity" />
      )}

      {/* ========================================================================= */}
      {/* 03 SMART CAPTURE SCREEN */}
      {/* ========================================================================= */}
      {mode === 'smart_capture' && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-[#23492C]">Smart Capture</h2>
            <div className="w-9" />
          </div>

          {/* Vegetable Target Selector & Mode Pill */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[11px] bg-white p-1.5 rounded-2xl border border-[#E9DFCF]">
              <span className="font-bold text-[#23492C] px-2">Vegetable:</span>
              <select
                value={selectedVegCategory}
                onChange={(e) => setSelectedVegCategory(e.target.value)}
                className="bg-[#F4EBDC] px-3 py-1 rounded-xl text-xs font-bold text-[#23492C] border-none focus:outline-none"
              >
                <option value="auto">🪄 Auto-Detect Any Vegetable</option>
                <option value="potato">🥔 Potato (Solanum tuberosum)</option>
                <option value="onion">🧅 Onion (Allium cepa)</option>
                <option value="tomato">🍅 Tomato</option>
                <option value="garlic">🧄 Garlic</option>
                <option value="carrot">🥕 Carrot</option>
                <option value="pepper">🫑 Bell Pepper / Capsicum</option>
                <option value="chili">🌶️ Green Chili</option>
                <option value="cabbage">🥬 Cabbage / Cauliflower</option>
                <option value="eggplant">🍆 Brinjal / Eggplant</option>
                <option value="cucumber">🥒 Cucumber</option>
                <option value="radish">🌱 Radish / Beetroot</option>
              </select>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSmartGatingActive(!smartGatingActive)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                  smartGatingActive ? 'bg-white text-[#23492C] border border-[#B8D4B5]' : 'bg-[#EBF4EA] text-[#23492C]/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${smartGatingActive ? 'bg-[#0B7347]' : 'bg-stone-400'}`} />
                <span>Multi-Vegetable Count</span>
              </button>

              <button
                type="button"
                onClick={() => setCalibrationMode(!calibrationMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                  calibrationMode ? 'bg-white text-[#23492C] border border-[#B8D4B5]' : 'bg-[#EBF4EA] text-[#23492C]/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${calibrationMode ? 'bg-[#0B7347]' : 'bg-transparent border border-stone-400'}`} />
                <span>Target size (45mm)</span>
              </button>
            </div>
          </div>

          {/* Camera Viewfinder */}
          <div className="relative aspect-[4/5] rounded-[36px] bg-[#E8E0D2] overflow-hidden shadow-md flex items-center justify-center border-4 border-white">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Produce Target Outline Guide */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-8">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#23492C] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#23492C] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#23492C] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#23492C] rounded-br-xl" />
              </div>

              <div className="absolute bottom-4 bg-[#23492C]/85 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-semibold text-white shadow">
                Center single or multiple vegetables in frame
              </div>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-around px-4 pt-1">
            {/* Flash / Torch Toggle with active state */}
            <button
              type="button"
              onClick={toggleFlash}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition ${
                flashOn 
                  ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-300/50' 
                  : 'bg-white text-[#23492C] border border-[#E9DFCF]'
              }`}
              title={flashOn ? 'Turn Flash Off' : 'Turn Flash On'}
            >
              {flashOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={captureFrame}
              className="w-20 h-20 rounded-full bg-[#23492C] border-4 border-white shadow-xl flex items-center justify-center active:scale-90 transition-transform group"
            >
              <div className="w-14 h-14 rounded-full bg-[#0B7347] border-2 border-white/60 group-hover:scale-95 transition-transform" />
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white border border-[#E9DFCF] text-[#23492C] flex items-center justify-center shadow-md active:scale-95 transition"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 04 PROCESSING / ANALYZING SCREEN */}
      {/* ========================================================================= */}
      {mode === 'analyzing' && (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-[#23492C]">Analyzing</h2>
            <div className="w-9" />
          </div>

          <div className="relative aspect-square max-w-[280px] mx-auto rounded-3xl bg-[#EAF2E9] border-2 border-[#D8E8D9] flex items-center justify-center overflow-hidden shadow-md">
            {capturedImage ? (
              <img src={capturedImage} alt="Crop" className="w-full h-full object-cover" />
            ) : (
              <span className="text-7xl">🥔</span>
            )}
            <div className="absolute left-0 right-0 h-1 bg-[#6CC330] shadow-[0_0_12px_#6CC330] animate-scan-line pointer-events-none" />
          </div>

          <div className="text-center space-y-2 px-2">
            <h3 className="text-base font-extrabold text-[#23492C]">Analyzing vegetable count & quality...</h3>
            <p className="text-xs text-[#0F1A13]/60">Verifying vegetable species and defect pillars</p>
            <div className="w-full h-2 rounded-full bg-[#E5DBCB] overflow-hidden mt-3">
              <div 
                style={{ width: `${analyzingProgress}%` }}
                className="h-full bg-[#0B7347] transition-all duration-300 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-2.5 bg-white rounded-3xl p-5 border border-[#E9DFCF] shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0B7347] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-bold text-[#23492C]">Species Identification</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0B7347]">Done</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  analyzingStage === 'computervision' || analyzingStage === 'defection'
                    ? 'bg-[#0B7347] text-white'
                    : 'border-2 border-[#D8E8D9]'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-bold text-[#23492C]">Specimen Counting</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0F1A13]/60">
                {analyzingStage === 'defection' ? 'Done' : 'Counting'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  analyzingStage === 'defection' ? 'bg-[#0B7347] text-white' : 'border-2 border-[#D8E8D9]'
                }`}>
                  {analyzingStage === 'defection' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="font-bold text-[#23492C]">Defect Audit & Good %</span>
              </div>
              <span className="text-[11px] font-semibold text-[#0F1A13]/60">
                {analyzingStage === 'defection' ? 'Finalizing' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION SCREEN (Non-vegetable or Fruit detected) */}
      {/* ========================================================================= */}
      {mode === 'rejection' && (
        <div className="flex-1 flex flex-col justify-between space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-[#23492C]">Inspection Notice</h2>
            <div className="w-9" />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              🚫
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#23492C]">No Vegetables Found</h3>
              <p className="text-xs text-[#0F1A13]/70 leading-relaxed px-2">
                {rejectionMessage || 'AgriGrade is strictly calibrated for agricultural vegetables only (not fruits or non-produce).'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4EBDC] text-[11px] text-[#23492C] text-left space-y-1">
              <span className="font-bold block">Supported Agricultural Vegetables:</span>
              <p className="text-[#0F1A13]/70">
                Potato, Onion, Tomato, Garlic, Ginger, Carrot, Bell Pepper, Chili, Cabbage, Cauliflower, Brinjal, Cucumber, Radish, Beetroot.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-4 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] text-white font-bold text-sm shadow-md transition"
          >
            Scan a Vegetable
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 05 ANALYSIS RESULT SCREEN */}
      {/* ========================================================================= */}
      {mode === 'analysis_result' && result && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-full bg-white border border-[#E9DFCF] flex items-center justify-center text-[#23492C] shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-[#23492C]">Analysis Result</h2>
            <div className="w-9" />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E9DFCF] space-y-4">
            <div className="aspect-[4/3] rounded-2xl bg-[#EAF2E9] overflow-hidden flex items-center justify-center border border-[#D8E8D9]">
              {result.imageUrl ? (
                <img src={result.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-7xl">🥔</span>
              )}
            </div>

            {/* Accurately Detected Vegetable Name */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#23492C] capitalize">
                  {result.vegetableType}
                </h3>
                <span className="text-[11px] text-[#0F1A13]/60">
                  {result.botanicalName ? `${result.botanicalName} • ` : ''}Sample #{result.id}
                </span>
              </div>

              <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${
                result.grade === 'GRADE_A'
                  ? 'bg-[#23492C] text-white'
                  : result.grade === 'GRADE_B'
                  ? 'bg-[#0B7347] text-white'
                  : 'bg-rose-700 text-white'
              }`}>
                {result.grade === 'GRADE_A' ? 'Grade A' : result.grade === 'GRADE_B' ? 'Grade B' : 'URS (Under-Rate)'}
              </span>
            </div>

            {/* MULTI-VEGETABLE COUNT & GOOD % FEATURE */}
            <div className="p-3 rounded-2xl bg-[#FAF6EE] border border-[#E9DFCF] grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F1A13]/60 block">Vegetables Counted</span>
                <span className="text-lg font-black text-[#23492C]">
                  {result.counts?.totalCount || 1} <span className="text-xs font-normal">items</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#0F1A13]/60 block">Good Vegetables</span>
                <span className="text-lg font-black text-[#0B7347]">
                  {result.counts?.goodPercent ?? 100}% <span className="text-xs font-normal">({result.counts?.goodCount ?? 1} sound)</span>
                </span>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#0F1A13]/70 font-semibold">Confidence</span>
                <span className="font-extrabold text-[#23492C]">{result.confidenceScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EAF2E9] overflow-hidden">
                <div 
                  style={{ width: `${result.confidenceScore}%` }}
                  className="h-full bg-[#0B7347] rounded-full"
                />
              </div>
            </div>

            {/* 4-Pillar Defect Classification Box */}
            <div className="p-3.5 rounded-2xl bg-[#F4EBDC]/60 border border-[#E9DFCF] space-y-1.5">
              <span className="text-[10px] font-bold text-[#23492C] uppercase tracking-wider block">
                Quality Observations
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${result.hackathonFlags?.isRotten ? 'bg-rose-500' : 'bg-[#0B7347]'}`} />
                  <span>Rotten: {result.hackathonFlags?.isRotten ? 'Detected (URS)' : 'Clean'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${result.hackathonFlags?.isSprouted ? 'bg-amber-500' : 'bg-[#0B7347]'}`} />
                  <span>Sprouted: {result.hackathonFlags?.isSprouted ? 'Detected (URS)' : 'Clean'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${result.hackathonFlags?.isDamaged ? 'bg-blue-500' : 'bg-[#0B7347]'}`} />
                  <span>Damaged: {result.hackathonFlags?.isDamaged ? 'Detected' : 'Intact'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${result.hackathonFlags?.isUndersized ? 'bg-purple-500' : 'bg-[#0B7347]'}`} />
                  <span>Caliber: {result.hackathonFlags?.isUndersized ? '<45mm' : 'Standard'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('batch_analytics')}
              className="w-full py-4 rounded-full bg-[#0B7347] hover:bg-[#3F5A3A] active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition"
            >
              Verify Grade & View Ledger
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="py-3 rounded-full bg-white hover:bg-[#FAF6EE] text-[#23492C] font-bold text-xs border border-[#E9DFCF] shadow-sm transition"
              >
                Quality Report
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-3 rounded-full bg-white hover:bg-[#FAF6EE] text-[#23492C] font-bold text-xs border border-[#E9DFCF] shadow-sm transition"
              >
                Scan Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
