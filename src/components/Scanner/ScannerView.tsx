import React, { useState } from 'react';
import { CropCategory, InspectionResult, PresetSample } from '../../types/grading';
import { CROP_SPECIFICATIONS } from '../../data/produceStandards';
import { PRESET_SAMPLES } from '../../data/presetSamples';
import { performGradingInspection } from '../../utils/gradingEngine';
import { InspectionResults } from './InspectionResults';
import { CameraModal } from './CameraModal';
import { GradeBadge } from '../common/Badge';
import { 
  Camera, Upload, Sparkles, CheckCircle2, 
  HelpCircle, Eye, RefreshCw, Zap
} from 'lucide-react';

interface ScannerViewProps {
  onCreateLotFromScan: (result: InspectionResult) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onCreateLotFromScan }) => {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>('apple');
  const [varietyName, setVarietyName] = useState<string>('Honeycrisp');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<InspectionResult | null>(null);

  const cropKeys = Object.keys(CROP_SPECIFICATIONS) as CropCategory[];
  const currentSpec = CROP_SPECIFICATIONS[selectedCrop];

  // Filter preset samples for current crop or show matching ones
  const relevantPresets = PRESET_SAMPLES.filter((p) => p.crop === selectedCrop);
  const otherPresets = PRESET_SAMPLES.filter((p) => p.crop !== selectedCrop).slice(0, 3);

  const handleSelectCrop = (crop: CropCategory) => {
    setSelectedCrop(crop);
    // suggest sensible default variety
    if (crop === 'apple') setVarietyName('Honeycrisp');
    else if (crop === 'tomato') setVarietyName('Vine Tomato');
    else if (crop === 'pepper') setVarietyName('Bell Red');
    else if (crop === 'mango') setVarietyName('Alphonso');
    else if (crop === 'potato') setVarietyName('Russet Burbank');
    else if (crop === 'orange') setVarietyName('Valencia');
    else if (crop === 'strawberry') setVarietyName('Albion');
    else if (crop === 'avocado') setVarietyName('Hass');
  };

  const runGradingProcess = async (imageUrl: string, sampleTitle?: string) => {
    setIsAnalyzing(true);
    try {
      // Simulate real-time optical scan latency (800ms)
      await new Promise((r) => setTimeout(r, 750));
      const res = await performGradingInspection(
        selectedCrop,
        imageUrl,
        varietyName,
        sampleTitle
      );
      setCurrentResult(res);
    } catch (err) {
      console.error('Inspection error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          runGradingProcess(event.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    runGradingProcess(imageDataUrl, `Live Camera Capture (${new Date().toLocaleTimeString()})`);
  };

  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedCrop(preset.crop);
    setVarietyName(preset.variety);
    runGradingProcess(preset.imageUrl, preset.name);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* If a result is active, display the comprehensive report */}
      {currentResult ? (
        <InspectionResults
          result={currentResult}
          onNewScan={() => setCurrentResult(null)}
          onCreateLotFromScan={onCreateLotFromScan}
        />
      ) : (
        <>
          {/* Hero / Introduction Bar */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Agricultural Computer Vision</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Automated Produce Quality & Defect Grading
              </h1>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                Analyze harvest specimens against international USDA & UNECE standards in seconds.
                Detect skin defects, measure color ripeness, evaluate caliber sizing, and classify produce into Grade A, B, C, or Culled.
              </p>
            </div>
          </div>

          {/* Step 1: Select Commodity Crop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <span>1. Select Produce Commodity</span>
              </h2>
              <span className="text-xs text-stone-400">8 Supported Crops</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {cropKeys.map((c) => {
                const spec = CROP_SPECIFICATIONS[c];
                const isSelected = selectedCrop === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectCrop(c)}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-200 text-center ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-500/15 scale-[1.03] ring-1 ring-emerald-500/50'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}
                  >
                    <span className="text-3xl mb-1.5 filter drop-shadow">{spec.icon}</span>
                    <span className="text-xs font-bold capitalize text-stone-100">{c}</span>
                    <span className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {spec.idealCaliberRange.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Upload / Capture or Pick Benchmark Preset */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Selection Options (Left 7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider">
                  2. Provide Produce Specimen
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Variety:</span>
                  <input
                    type="text"
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    placeholder="e.g. Honeycrisp, Gala"
                    className="text-xs px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Upload & Camera Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Live Camera Button */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isAnalyzing}
                  className="group relative p-6 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 hover:border-emerald-500/60 transition-all duration-200 text-left shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between h-44"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Live Camera Capture
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      Use webcam or mobile camera for real-time grading of physical produce
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Live Feed
                  </div>
                </button>

                {/* File Upload Drop Area */}
                <label className="group relative p-6 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 hover:border-emerald-500/60 transition-all duration-200 text-left shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between h-44 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                      Upload Harvest Photo
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      JPG, PNG, or WebP from packhouse sorting lines or orchard inspections
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                    File Import
                  </div>
                </label>
              </div>

              {/* Specification Peek */}
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Target Standard Parameters for {currentSpec.commonName}
                  </span>
                  <span className="font-mono text-stone-400">{currentSpec.scientificName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-stone-400">
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                    <span className="block text-stone-500 text-[10px]">Min. Sugar (Brix)</span>
                    <span className="font-bold text-amber-400 font-mono">≥ {currentSpec.minBrix}° Bx</span>
                  </div>
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                    <span className="block text-stone-500 text-[10px]">Ideal Sizing</span>
                    <span className="font-bold text-blue-400 font-mono">{currentSpec.idealCaliberRange}</span>
                  </div>
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                    <span className="block text-stone-500 text-[10px]">Grade A Tolerance</span>
                    <span className="font-bold text-emerald-400 font-mono">≤ {currentSpec.gradeTolerances.gradeA.maxDefectArea}% defect</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Preset Test Samples (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Instant Benchmark Presets
                </h2>
                <span className="text-xs text-stone-400">One-click test</span>
              </div>

              <div className="space-y-3">
                {(relevantPresets.length > 0 ? relevantPresets : otherPresets).map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="group p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-emerald-500/50 hover:bg-stone-850 cursor-pointer transition-all duration-200 flex items-center gap-3.5 shadow-md"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-950 shrink-0 border border-stone-800 relative">
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1">
                        <span className="text-xs">{CROP_SPECIFICATIONS[preset.crop].icon}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-stone-100 truncate group-hover:text-emerald-400 transition-colors">
                          {preset.name}
                        </h4>
                        <GradeBadge grade={preset.intendedGrade} size="sm" />
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1">
                        {preset.subtitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-stone-500 font-mono">
                        <span>Score: {preset.score}/100</span>
                        <span>Defects: {preset.metrics.surfaceDefectPercent}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {relevantPresets.length === 0 && (
                  <div className="text-xs text-stone-400 p-4 text-center bg-stone-900/50 rounded-xl border border-stone-800">
                    Use the camera or upload button above to test custom {selectedCrop} photos, or click any preset above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analysis Radar Overlay Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full border-2 border-emerald-400/80 border-t-transparent animate-spin flex items-center justify-center shadow-lg shadow-emerald-500/20" />
              <span className="text-4xl absolute animate-bounce">
                {currentSpec.icon}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Computer Vision Analysis
              </h3>
              <p className="text-xs text-stone-400">
                Segmenting epidermis, scanning blemish coordinates, and calculating USDA/UNECE compliance...
              </p>
            </div>

            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
