import React, { useState } from 'react';
import { CropCategory } from '../../types/grading';
import { CROP_SPECIFICATIONS, BENCHMARK_MARKET_PRICES } from '../../data/produceStandards';
import { 
  DollarSign, TrendingUp, AlertOctagon, Lightbulb, 
  ArrowUpRight, BarChart2, ShieldAlert, Check
} from 'lucide-react';

export const YieldCalculator: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<CropCategory>('apple');
  const [harvestWeightKg, setHarvestWeightKg] = useState<number>(10000); // 10 metric tons default
  const [gradeAPercent, setGradeAPercent] = useState<number>(55);
  const [gradeBPercent, setGradeBPercent] = useState<number>(25);
  const [gradeCPercent, setGradeCPercent] = useState<number>(14);
  const [rejectPercent, setRejectPercent] = useState<number>(6);

  // Price overrides (defaults to benchmark)
  const defaultPrices = BENCHMARK_MARKET_PRICES[selectedCrop];
  const [customPriceA, setCustomPriceA] = useState<number>(defaultPrices.gradeA);
  const [customPriceB, setCustomPriceB] = useState<number>(defaultPrices.gradeB);
  const [customPriceC, setCustomPriceC] = useState<number>(defaultPrices.gradeC);
  const [customPriceReject, setCustomPriceReject] = useState<number>(defaultPrices.reject);

  const spec = CROP_SPECIFICATIONS[selectedCrop];

  const handleCropChange = (crop: CropCategory) => {
    setSelectedCrop(crop);
    const p = BENCHMARK_MARKET_PRICES[crop];
    setCustomPriceA(p.gradeA);
    setCustomPriceB(p.gradeB);
    setCustomPriceC(p.gradeC);
    setCustomPriceReject(p.reject);
  };

  // Weight distributions
  const weightA = (harvestWeightKg * gradeAPercent) / 100;
  const weightB = (harvestWeightKg * gradeBPercent) / 100;
  const weightC = (harvestWeightKg * gradeCPercent) / 100;
  const weightReject = (harvestWeightKg * rejectPercent) / 100;

  // Revenues
  const revA = weightA * customPriceA;
  const revB = weightB * customPriceB;
  const revC = weightC * customPriceC;
  const revReject = weightReject * customPriceReject;
  const totalRevenue = revA + revB + revC + revReject;

  // Ideal scenario (100% Grade A)
  const idealRevenue = harvestWeightKg * customPriceA;
  const lostPotential = idealRevenue - totalRevenue;

  // Value recovery potential: Upgrading sorting precision & converting 50% of Grade C to Grade B, and saving 40% of rejects into Grade C processing
  const recoveredRev =
    (weightC * 0.5 * (customPriceB - customPriceC)) +
    (weightReject * 0.4 * (customPriceC - customPriceReject));

  const totalPercent = gradeAPercent + gradeBPercent + gradeCPercent + rejectPercent;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Packhouse & Orchard Economics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Crop Yield & Grade Realization Calculator
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              Estimate gross packhouse revenue across Grade A, B, C, and Reject tiers, and uncover value recovery opportunities.
            </p>
          </div>

          {/* Commodity Selector Dropdown */}
          <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-2xl border border-stone-800">
            <span className="text-xl pl-2">{spec.icon}</span>
            <select
              value={selectedCrop}
              onChange={(e) => handleCropChange(e.target.value as CropCategory)}
              className="bg-transparent text-white font-bold text-sm focus:outline-none pr-3 py-1 cursor-pointer"
            >
              {(Object.keys(CROP_SPECIFICATIONS) as CropCategory[]).map((c) => (
                <option key={c} value={c} className="bg-stone-900 text-stone-100">
                  {CROP_SPECIFICATIONS[c].commonName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 6 Columns: Inputs & Sliders */}
        <div className="lg:col-span-6 space-y-6">
          {/* Harvest Volume */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Harvest Volume
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                {(harvestWeightKg / 1000).toFixed(1)} Metric Tons
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="100"
                step="500"
                value={harvestWeightKg}
                onChange={(e) => setHarvestWeightKg(Math.max(100, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-lg font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-sm font-semibold text-stone-400 px-2 shrink-0">kg</span>
            </div>

            <div className="flex gap-2">
              {[2500, 5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHarvestWeightKg(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition ${
                    harvestWeightKg === preset
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  {preset / 1000}t
                </button>
              ))}
            </div>
          </div>

          {/* Grade Distribution Sliders */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Packout Grade Distribution
              </h3>
              <span className={`text-xs font-mono font-bold ${totalPercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Sum: {totalPercent}%
              </span>
            </div>

            {/* Grade A */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Grade A (Export Tier)
                </span>
                <span className="font-mono text-stone-200">{gradeAPercent}% ({weightA.toLocaleString()} kg)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={gradeAPercent}
                onChange={(e) => setGradeAPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Grade B */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Grade B (Supermarket Retail)
                </span>
                <span className="font-mono text-stone-200">{gradeBPercent}% ({weightB.toLocaleString()} kg)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={gradeBPercent}
                onChange={(e) => setGradeBPercent(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Grade C */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Grade C (Industrial Processing)
                </span>
                <span className="font-mono text-stone-200">{gradeCPercent}% ({weightC.toLocaleString()} kg)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={gradeCPercent}
                onChange={(e) => setGradeCPercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Reject */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Culled / Reject (Defective)
                </span>
                <span className="font-mono text-stone-200">{rejectPercent}% ({weightReject.toLocaleString()} kg)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rejectPercent}
                onChange={(e) => setRejectPercent(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Pricing Adjusters */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Market Price Realization ($ / kg)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-emerald-400 font-bold block mb-1">Grade A</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={customPriceA}
                    onChange={(e) => setCustomPriceA(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-blue-400 font-bold block mb-1">Grade B</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={customPriceB}
                    onChange={(e) => setCustomPriceB(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-amber-400 font-bold block mb-1">Grade C</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={customPriceC}
                    onChange={(e) => setCustomPriceC(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-rose-400 font-bold block mb-1">Culled / Waste</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customPriceReject}
                    onChange={(e) => setCustomPriceReject(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-100 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Financial Realization, Recovery Strategy */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Gross Revenue Card */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                  Gross Realized Value
                </span>
                <div className="text-4xl font-black text-white font-mono mt-1">
                  ${Math.round(totalRevenue).toLocaleString()}
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  Blended Realization: ${(totalRevenue / harvestWeightKg).toFixed(2)} / kg
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-wider text-stone-400">
                  Theoretical 100% Grade A
                </span>
                <div className="text-xl font-bold text-stone-400 font-mono line-through">
                  ${Math.round(idealRevenue).toLocaleString()}
                </div>
                <div className="text-xs text-rose-400 font-semibold mt-1">
                  -${Math.round(lostPotential).toLocaleString()} downgrade gap
                </div>
              </div>
            </div>

            {/* Visual Value Distribution Bar */}
            <div className="space-y-2">
              <div className="text-xs text-stone-400 font-medium">Revenue Contribution by Tier:</div>
              <div className="w-full h-4 rounded-full bg-stone-950 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${(revA / totalRevenue) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`Grade A: $${Math.round(revA).toLocaleString()}`}
                />
                <div
                  style={{ width: `${(revB / totalRevenue) * 100}%` }}
                  className="bg-blue-500 h-full transition-all duration-300"
                  title={`Grade B: $${Math.round(revB).toLocaleString()}`}
                />
                <div
                  style={{ width: `${(revC / totalRevenue) * 100}%` }}
                  className="bg-amber-500 h-full transition-all duration-300"
                  title={`Grade C: $${Math.round(revC).toLocaleString()}`}
                />
                <div
                  style={{ width: `${(revReject / totalRevenue) * 100}%` }}
                  className="bg-rose-500 h-full transition-all duration-300"
                  title={`Reject: $${Math.round(revReject).toLocaleString()}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-emerald-400 font-semibold">Grade A</div>
                  <div className="text-xs font-bold text-white font-mono">${Math.round(revA).toLocaleString()}</div>
                </div>
                <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-blue-400 font-semibold">Grade B</div>
                  <div className="text-xs font-bold text-white font-mono">${Math.round(revB).toLocaleString()}</div>
                </div>
                <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-amber-400 font-semibold">Grade C</div>
                  <div className="text-xs font-bold text-white font-mono">${Math.round(revC).toLocaleString()}</div>
                </div>
                <div className="bg-stone-950/70 p-2 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-rose-400 font-semibold">Reject</div>
                  <div className="text-xs font-bold text-white font-mono">${Math.round(revReject).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Recovery Recommendations */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lightbulb className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Automated Value Recovery Tactics
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-stone-950 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-stone-200">
                  Sub-Grade Precision Recovery Potential
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  By routing borderline Grade C produce to IQF / juice rather than waste
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-400 font-mono">
                  +${Math.round(recoveredRev).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-300/80 uppercase font-semibold">
                  Recoverable Value
                </div>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-stone-300">
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-950/50 border border-stone-800/60">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Precision Optical Re-Sorting:</strong> Up to 15% of mechanically down-graded Grade B fruit can be recategorized as Grade A after computerized surface blemish filtering.
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-950/50 border border-stone-800/60">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Pre-Cooling Hydrocooler Integration:</strong> Reducing field core temperature within 2 hours of harvest doubles shelf life from 14 to 30 days, preventing rapid skin wrinkling.
                </div>
              </li>
              <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-950/50 border border-stone-800/60">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Industrial Puree Contracting:</strong> Selling Grade C {selectedCrop} directly to puree or cider processors at ${customPriceC.toFixed(2)}/kg avoids costly disposal fees.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
