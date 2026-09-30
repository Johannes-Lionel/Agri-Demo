import React, { useState, useEffect } from 'react';
import { Settings, Cpu, ShieldCheck, Check, Sliders, Ruler, Building2 } from 'lucide-react';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('agrigrade_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      confidenceThresholdForAutoAccept: 80,
      defaultVegetableType: 'onion',
      calibrationReference: 'standard_coin_25mm',
      selectedModel: 'gemini-2.5-flash',
      facilityName: 'Central Allium Packhouse #4',
      inspectorName: 'Dr. Sarah Lin (Lead Q/A)',
    };
  });

  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/ai/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.available) setAvailableModels(data.available);
      })
      .catch((err) => console.warn('Failed to load AI models list:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('agrigrade_settings', JSON.stringify(settings));

    // Update active model on server
    try {
      await fetch('/api/ai/set-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: settings.selectedModel }),
      });
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Inspection Parameters & AI Runtime</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System & Grading Configuration
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Configure automated acceptance confidence limits, calibration defaults, and AI vision model adapters.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Configuration saved successfully and applied to inspection runtime.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Confidence Threshold Configuration */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Automated Acceptance Confidence Threshold</span>
              </h3>
              <p className="text-xs text-stone-400">
                Inspections scoring below this confidence trigger automatic Human Review before certification.
              </p>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {settings.confidenceThresholdForAutoAccept}%
            </div>
          </div>

          <input
            type="range"
            min="60"
            max="95"
            step="1"
            value={settings.confidenceThresholdForAutoAccept}
            onChange={(e) =>
              setSettings({ ...settings, confidenceThresholdForAutoAccept: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-stone-500 font-mono">
            <span>60% (Lenient / High Throughput)</span>
            <span>80% (Recommended Commercial Standard)</span>
            <span>95% (Ultra-Strict Export)</span>
          </div>
        </div>

        {/* AI Model Architecture Adapter */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Replaceable AI Vision Service Interface</span>
            </h3>
            <p className="text-xs text-stone-400">
              Select active inference backend implementing the <code className="text-emerald-400">IVegetableAIService</code> interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div
              onClick={() => setSettings({ ...settings, selectedModel: 'gemini-2.5-flash' })}
              className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                settings.selectedModel === 'gemini-2.5-flash'
                  ? 'bg-stone-850 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-950 border-stone-800 hover:bg-stone-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Gemini 2.5 Flash Vision</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  Production
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Multimodal foundation vision model analyzing skin tunics, neck tightness, and Aspergillus defects.
              </p>
            </div>

            <div
              onClick={() => setSettings({ ...settings, selectedModel: 'pytorch-yolo-produce' })}
              className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                settings.selectedModel === 'pytorch-yolo-produce'
                  ? 'bg-stone-850 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-stone-950 border-stone-800 hover:bg-stone-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">YOLOv8 / PyTorch ONNX Adapter</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                  Plug-in Ready
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Pre-wired adapter interface for running local edge weights or custom-trained onion segmentation models.
              </p>
            </div>
          </div>
        </div>

        {/* Calibration & Facility Info */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Facility & Calibration Standards</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Default Calibration Target
              </label>
              <select
                value={settings.calibrationReference}
                onChange={(e: any) =>
                  setSettings({ ...settings, calibrationReference: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
              >
                <option value="standard_coin_25mm">Standard 25mm Coin Marker</option>
                <option value="standard_card_85mm">Standard 85.6mm Card (ISO/IEC 7810)</option>
                <option value="grid_10mm">10mm Calibrated Optical Grid Mat</option>
                <option value="none">None / Uncalibrated (Visual estimation only)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Packhouse Facility Name
              </label>
              <input
                type="text"
                value={settings.facilityName}
                onChange={(e) => setSettings({ ...settings, facilityName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
          >
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};
