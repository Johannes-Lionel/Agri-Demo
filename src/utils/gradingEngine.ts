import { CropCategory, GradeTier, InspectionResult, DefectItem } from '../types/grading';
import { CROP_SPECIFICATIONS, BENCHMARK_MARKET_PRICES } from '../data/produceStandards';

interface ImagePixelAnalysis {
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  colorVariance: number;
  darkSpotRatio: number;
  lightSpotRatio: number;
  saturation: number;
}

export async function analyzeImageWithCanvas(imageUrl: string): Promise<ImagePixelAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        if (!ctx) {
          resolve(getDefaultPixelAnalysis());
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalR = 0, totalG = 0, totalB = 0;
        let darkPixels = 0;
        let lightPixels = 0;
        const totalPixels = sampleSize * sampleSize;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalR += r;
          totalG += g;
          totalB += b;

          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 45) darkPixels++;
          if (brightness > 220) lightPixels++;
        }

        const avgR = totalR / totalPixels;
        const avgG = totalG / totalPixels;
        const avgB = totalB / totalPixels;

        // Variance
        let diffSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          diffSum += Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB);
        }
        const colorVariance = diffSum / (totalPixels * 3);

        const maxC = Math.max(avgR, avgG, avgB);
        const minC = Math.min(avgR, avgG, avgB);
        const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;

        resolve({
          avgRed: Math.round(avgR),
          avgGreen: Math.round(avgG),
          avgBlue: Math.round(avgB),
          colorVariance: Math.round(colorVariance),
          darkSpotRatio: darkPixels / totalPixels,
          lightSpotRatio: lightPixels / totalPixels,
          saturation: Math.round(saturation * 100),
        });
      } catch {
        resolve(getDefaultPixelAnalysis());
      }
    };
    img.onerror = () => {
      resolve(getDefaultPixelAnalysis());
    };
    img.src = imageUrl;
  });
}

function getDefaultPixelAnalysis(): ImagePixelAnalysis {
  return {
    avgRed: 180,
    avgGreen: 90,
    avgBlue: 60,
    colorVariance: 28,
    darkSpotRatio: 0.03,
    lightSpotRatio: 0.05,
    saturation: 65,
  };
}

export async function performGradingInspection(
  crop: CropCategory,
  imageUrl: string,
  varietyName?: string,
  customSampleName?: string
): Promise<InspectionResult> {
  const spec = CROP_SPECIFICATIONS[crop];
  const prices = BENCHMARK_MARKET_PRICES[crop];
  const pixelStats = await analyzeImageWithCanvas(imageUrl);

  // Compute simulated optical metrics grounded in the crop specifications and pixel analysis
  const darkPenalty = Math.min(45, pixelStats.darkSpotRatio * 320);
  const variancePenalty = Math.max(0, (pixelStats.colorVariance - 20) * 0.7);

  // Color uniformity (0-100)
  const colorUniformity = Math.max(40, Math.min(99, Math.round(100 - variancePenalty * 1.2)));

  // Surface defect area percentage
  const surfaceDefectPercent = Number((darkPenalty * 0.45 + (pixelStats.colorVariance > 35 ? 3.5 : 0.8)).toFixed(1));

  // Ripeness (0-100) based on crop color models
  let ripeness = 85;
  if (crop === 'tomato' || crop === 'apple' || crop === 'strawberry') {
    ripeness = Math.min(98, Math.round((pixelStats.avgRed / 255) * 105));
  } else if (crop === 'pepper' || crop === 'avocado') {
    ripeness = Math.min(96, Math.max(65, Math.round(75 + pixelStats.saturation * 0.2)));
  } else if (crop === 'mango' || crop === 'orange') {
    ripeness = Math.min(98, Math.round(((pixelStats.avgRed + pixelStats.avgGreen * 0.8) / 450) * 100));
  } else {
    ripeness = 90;
  }

  // Estimated Brix & Firmness
  const estimatedBrix = Number((spec.minBrix + (ripeness > 85 ? (ripeness - 85) * 0.15 : -0.5)).toFixed(1));
  const baseFirmness = parseFloat(spec.idealFirmness.split('-')[0]) || 5.0;
  const firmnessKg = Number(Math.max(1.8, (baseFirmness + (100 - ripeness) * 0.04)).toFixed(1));

  // Caliber mm
  const caliberMm = Number((68 + (Math.sin(pixelStats.avgRed) * 8)).toFixed(1));
  const shapeSymmetry = Math.max(55, Math.min(98, Math.round(96 - (surfaceDefectPercent * 1.1))));
  const freshnessIndex = Math.max(30, Math.min(99, Math.round(100 - surfaceDefectPercent * 1.8)));

  // Calculate overall score (0-100)
  let overallScore = Math.round(
    colorUniformity * 0.25 +
    (100 - Math.min(100, surfaceDefectPercent * 3.5)) * 0.40 +
    shapeSymmetry * 0.15 +
    freshnessIndex * 0.20
  );

  overallScore = Math.max(25, Math.min(98, overallScore));

  // Defects generation based on detections
  const defects: DefectItem[] = [];

  if (surfaceDefectPercent > 18 || darkPenalty > 35) {
    defects.push({
      id: `def-${Date.now()}-1`,
      type: crop === 'potato' ? 'rot' : 'sunscald',
      label: crop === 'potato' ? 'Late Blight Lesion' : 'Severe Surface Necrosis',
      severity: 'critical',
      confidence: 0.94,
      box: { x: 38, y: 34, w: 28, h: 26 },
      impactScore: 35.0,
    });
  }

  if (surfaceDefectPercent > 5) {
    defects.push({
      id: `def-${Date.now()}-2`,
      type: 'bruise',
      label: 'Mechanical Impact Bruise',
      severity: surfaceDefectPercent > 12 ? 'moderate' : 'minor',
      confidence: 0.86,
      box: { x: 25, y: 55, w: 20, h: 18 },
      impactScore: surfaceDefectPercent > 12 ? 14.5 : 6.0,
    });
  }

  if (surfaceDefectPercent > 2 && defects.length < 2) {
    defects.push({
      id: `def-${Date.now()}-3`,
      type: 'blemish',
      label: 'Epidermal Russeting / Rub Mark',
      severity: 'minor',
      confidence: 0.82,
      box: { x: 60, y: 22, w: 14, h: 12 },
      impactScore: 3.5,
    });
  }

  // Determine Grade
  let assignedGrade: GradeTier = 'GRADE_A';
  let gradeTitle = 'Grade A (Premium Export Quality)';

  if (overallScore >= spec.gradeTolerances.gradeA.minScore && surfaceDefectPercent <= spec.gradeTolerances.gradeA.maxDefectArea) {
    assignedGrade = 'GRADE_A';
    gradeTitle = 'Grade A (Premium Export Quality)';
  } else if (overallScore >= spec.gradeTolerances.gradeB.minScore && surfaceDefectPercent <= spec.gradeTolerances.gradeB.maxDefectArea) {
    assignedGrade = 'GRADE_B';
    gradeTitle = 'Grade B (Domestic Supermarket Grade)';
  } else if (overallScore >= spec.gradeTolerances.gradeC.minScore && surfaceDefectPercent <= spec.gradeTolerances.gradeC.maxDefectArea) {
    assignedGrade = 'GRADE_C';
    gradeTitle = 'Grade C (Commercial Processing / Puree)';
  } else {
    assignedGrade = 'REJECT';
    gradeTitle = 'Culled / Reject (Sub-standard)';
  }

  // Compliance
  const compliance = {
    usdaStandard: assignedGrade === 'GRADE_A' ? spec.gradeTolerances.gradeA.usdaEquivalent :
      assignedGrade === 'GRADE_B' ? spec.gradeTolerances.gradeB.usdaEquivalent :
      assignedGrade === 'GRADE_C' ? spec.gradeTolerances.gradeC.usdaEquivalent : 'Below U.S. No. 2 Standard',
    uneceClass: assignedGrade === 'GRADE_A' ? 'UNECE Class Extra' :
      assignedGrade === 'GRADE_B' ? 'UNECE Class I' :
      assignedGrade === 'GRADE_C' ? 'UNECE Class II' : 'Exempt / Non-compliant',
    exportEligible: assignedGrade === 'GRADE_A',
    supermarketEligible: assignedGrade === 'GRADE_A' || assignedGrade === 'GRADE_B',
    processingEligible: assignedGrade !== 'REJECT',
  };

  // Recommended Routing & Economics
  let suggestedPrice = prices.gradeA;
  let recommendedMarket: 'Premium Export' | 'Domestic Retail' | 'Commercial Processing' | 'Livestock / Compost' = 'Premium Export';
  let rationale = '';
  const valueRecoveryTips: string[] = [];

  switch (assignedGrade) {
    case 'GRADE_A':
      suggestedPrice = prices.gradeA;
      recommendedMarket = 'Premium Export';
      rationale = `Exceptional visual quality and uniform coloring meet top-tier export requirements (${spec.gradeTolerances.gradeA.usdaEquivalent}).`;
      valueRecoveryTips.push('Package in single-layer cell trays to prevent transit vibration damage.');
      valueRecoveryTips.push('Target high-margin retail buyers (premium supermarkets / export consolidators).');
      break;
    case 'GRADE_B':
      suggestedPrice = prices.gradeB;
      recommendedMarket = 'Domestic Retail';
      rationale = `Slight cosmetic variation or minor surface scarring within ${spec.gradeTolerances.gradeB.usdaEquivalent} tolerances. Perfect internal quality.`;
      valueRecoveryTips.push('Channel to domestic supermarket chains, food service, or wholesale bagged programs.');
      valueRecoveryTips.push('Maintain cold-chain storage at 2-4°C to preserve firmness and extend shelf-life.');
      break;
    case 'GRADE_C':
      suggestedPrice = prices.gradeC;
      recommendedMarket = 'Commercial Processing';
      rationale = `Cosmetic blemishes or asymmetry exceed fresh table standards, but pulp, sugar, and turgor remain fully viable for industrial conversion.`;
      valueRecoveryTips.push('Divert immediately to industrial juicing, puree, or IQF dicing to recover up to 60% of crop value.');
      valueRecoveryTips.push('Avoid long-term ambient storage to prevent secondary decay.');
      break;
    case 'REJECT':
      suggestedPrice = prices.reject;
      recommendedMarket = 'Livestock / Compost';
      rationale = `Active fungal decay, severe physiological rot, or pathogen presence exceeds statutory tolerances.`;
      valueRecoveryTips.push('Quarantine affected harvest bins immediately to prevent spore transmission to adjacent lots.');
      valueRecoveryTips.push('Divert to licensed anaerobic digester, biogas facility, or compost enrichment.');
      break;
  }

  return {
    id: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    crop,
    cropName: spec.commonName,
    variety: varietyName || 'Standard Commercial Variety',
    sampleName: customSampleName || `${spec.icon} ${spec.crop.toUpperCase()} Inspection #${Math.floor(1000 + Math.random() * 9000)}`,
    imageUrl,
    overallScore,
    assignedGrade,
    gradeTitle,
    metrics: {
      colorUniformity,
      ripenessPercentage: ripeness,
      estimatedBrix,
      firmnessKg,
      caliberMm,
      surfaceDefectPercent,
      shapeSymmetry,
      freshnessIndex,
      estimatedShelfLifeDays: {
        ambient: assignedGrade === 'GRADE_A' ? 14 : assignedGrade === 'GRADE_B' ? 8 : assignedGrade === 'GRADE_C' ? 4 : 1,
        coldChain: assignedGrade === 'GRADE_A' ? 60 : assignedGrade === 'GRADE_B' ? 30 : assignedGrade === 'GRADE_C' ? 14 : 3,
      },
    },
    defects,
    compliance,
    recommendedRouting: {
      market: recommendedMarket,
      suggestedPricePerKg: suggestedPrice,
      rationale,
      valueRecoveryTips,
    },
  };
}
