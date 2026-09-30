import type { AIAnalysisOutput } from './aiTypes.ts';

export interface GradingConfig {
  confidenceThresholdForAutoAccept: number;
  baseMspRatePerQuintal: number; // e.g. ₹2,400 benchmark price
  gradeA: {
    minScore: number;
    maxDefectPercent: number;
    minSymmetry: number;
  };
  gradeB: {
    minScore: number;
    maxDefectPercent: number;
    minSymmetry: number;
  };
}

export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  confidenceThresholdForAutoAccept: 80,
  baseMspRatePerQuintal: 2400,
  gradeA: {
    minScore: 85,
    maxDefectPercent: 3.5,
    minSymmetry: 80,
  },
  gradeB: {
    minScore: 70,
    maxDefectPercent: 9.0,
    minSymmetry: 65,
  },
};

export interface GradingEngineResult {
  qualityScore: number;
  grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'URS' | 'REJECT';
  gradeName: string;
  isGradeA: boolean;
  isURS: boolean;
  ursReason?: string;
  explanation: string;
  needsHumanReview: boolean;
  reviewReason?: string;
  fairPriceRatePerQuintal: number;
}

export class VegetableGradingEngine {
  private config: GradingConfig;

  constructor(customConfig?: Partial<GradingConfig>) {
    this.config = { ...DEFAULT_GRADING_CONFIG, ...customConfig };
  }

  evaluate(
    vegetableType: string,
    aiAnalysis: AIAnalysisOutput,
    customConfidenceThreshold?: number
  ): GradingEngineResult {
    const threshold = customConfidenceThreshold ?? this.config.confidenceThresholdForAutoAccept;
    const detectedName = aiAnalysis.vegetableDetected || vegetableType || 'Vegetable';

    // Check non-vegetable or rejection
    if (aiAnalysis.noVegetableFound || aiAnalysis.isVegetable === false) {
      return {
        qualityScore: 0,
        grade: 'REJECT',
        gradeName: 'Invalid (Non-Vegetable)',
        isGradeA: false,
        isURS: true,
        ursReason: aiAnalysis.rejectionReason || 'No agricultural vegetables detected in the camera frame.',
        explanation: aiAnalysis.rejectionReason || 'The scanned image does not contain an agricultural vegetable. AgriGrade only inspects agricultural vegetables (e.g. potato, onion, tomato, garlic, carrot, pepper).',
        needsHumanReview: false,
        reviewReason: 'Non-vegetable item submitted',
        fairPriceRatePerQuintal: 0,
      };
    }

    if (!aiAnalysis.detectionPresent) {
      return {
        qualityScore: 0,
        grade: 'URS',
        gradeName: `URS (Unfit / No ${detectedName} Detected)`,
        isGradeA: false,
        isURS: true,
        ursReason: 'No clear produce specimen detected in the camera frame.',
        explanation: 'Specimen failed detection. Cannot be certified for procurement intake.',
        needsHumanReview: true,
        reviewReason: 'Detection absent in frame.',
        fairPriceRatePerQuintal: 0,
      };
    }

    const flags = aiAnalysis.hackathonFlags || {
      isRotten: false,
      isSprouted: false,
      isDamaged: false,
      isUndersized: false,
    };

    // Calculate URS Qualification
    let isURS = false;
    let ursReason = '';
    const ursConditions: string[] = [];

    if (flags.isRotten) {
      isURS = true;
      ursConditions.push('Rotten / Fungal decay');
    }
    if (flags.isSprouted) {
      isURS = true;
      ursConditions.push('Sprouted shoot / eyes');
    }
    if (flags.isUndersized) {
      isURS = true;
      ursConditions.push('Undersized caliber (<45mm diameter)');
    }
    if (flags.isDamaged && (aiAnalysis.defectsDetected.some((d) => d.severity === 'critical') || flags.damagedDetails?.includes('severe'))) {
      isURS = true;
      ursConditions.push('Severe mechanical damage / cut');
    }

    // Also factor in multi-vegetable batch counts
    if (aiAnalysis.counts && aiAnalysis.counts.totalCount > 1) {
      if (aiAnalysis.counts.goodPercent < 70) {
        isURS = true;
        ursConditions.push(`High defect batch ratio (${aiAnalysis.counts.defectivePercent}% defective items)`);
      }
    }

    if (isURS) {
      ursReason = ursConditions.join(' + ');
    }

    // Baseline scoring
    let defectPenaltyTotal = 0;
    for (const defect of aiAnalysis.defectsDetected) {
      const weight = defect.severity === 'critical' ? 3.5 : defect.severity === 'moderate' ? 2.0 : 1.0;
      defectPenaltyTotal += defect.estimatedAreaPercent * weight * (defect.confidence / 100);
    }

    const totalDefectArea = aiAnalysis.defectsDetected.reduce((sum, d) => sum + d.estimatedAreaPercent, 0);
    const shapeScore = Math.max(40, aiAnalysis.shapeCharacteristics?.symmetryRatio || 80);
    const colorScore = Math.max(40, aiAnalysis.colorMetrics?.skinColorUniformity || 80);

    const baseDefectScore = Math.max(0, 100 - defectPenaltyTotal * 5.0);
    let qualityScore = Math.round(baseDefectScore * 0.50 + colorScore * 0.25 + shapeScore * 0.25);

    // If multi-item, weight with goodPercent
    if (aiAnalysis.counts && aiAnalysis.counts.totalCount > 1) {
      qualityScore = Math.round(qualityScore * 0.4 + aiAnalysis.counts.goodPercent * 0.6);
    }
    qualityScore = Math.max(10, Math.min(99, qualityScore));

    let grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'URS' | 'REJECT';
    let gradeName: string;
    let explanation: string;
    let isGradeA = false;

    if (isURS) {
      grade = 'URS';
      gradeName = 'URS (Under-Rate Stock / Under-Sized & Reject)';
      isGradeA = false;
      qualityScore = Math.min(qualityScore, 48);
      explanation = `Assigned as URS due to procurement defect condition: ${ursReason}. Disqualified from Fair Average Quality (FAQ) Grade A standard for ${detectedName}.`;
    } else if (
      qualityScore >= this.config.gradeA.minScore &&
      totalDefectArea <= this.config.gradeA.maxDefectPercent &&
      shapeScore >= this.config.gradeA.minSymmetry
    ) {
      grade = 'GRADE_A';
      gradeName = 'Grade A (FAQ / Premium Export Standard)';
      isGradeA = true;
      explanation = `Meets Fair Average Quality (FAQ) Grade A benchmark for ${detectedName}: Sound flesh, intact skin, zero rot, zero sprouting, and standard commercial size.`;
    } else if (qualityScore >= this.config.gradeB.minScore && totalDefectArea <= this.config.gradeB.maxDefectPercent) {
      grade = 'GRADE_B';
      gradeName = 'Grade B (Commercial Domestic Retail)';
      isGradeA = false;
      explanation = `Acceptable domestic commercial quality for ${detectedName} with minor superficial marks (<9%), but sound internal edible flesh.`;
    } else {
      grade = 'URS';
      gradeName = 'URS (Under-Rate Stock)';
      isGradeA = false;
      explanation = `Cumulative defects on ${detectedName} (${totalDefectArea.toFixed(1)}% affected area) fall below commercial table standards; classified as URS.`;
    }

    // Pricing estimation per quintal
    let fairPriceRatePerQuintal = this.config.baseMspRatePerQuintal;
    if (grade === 'GRADE_A') {
      fairPriceRatePerQuintal += 250;
    } else if (grade === 'GRADE_B') {
      fairPriceRatePerQuintal -= 150;
    } else {
      fairPriceRatePerQuintal = Math.round(this.config.baseMspRatePerQuintal * 0.45);
    }

    // Confidence & review flagging
    let needsHumanReview = false;
    let reviewReason: string | undefined;

    if (aiAnalysis.overallVegetableConfidence < threshold) {
      needsHumanReview = true;
      reviewReason = `Low AI confidence (${aiAnalysis.overallVegetableConfidence}% < ${threshold}% threshold). Inspector spot-check required to eliminate dispute.`;
    } else if (aiAnalysis.unreliableAttributes.length > 0) {
      needsHumanReview = true;
      reviewReason = `Physical attributes could not be reliably determined: ${aiAnalysis.unreliableAttributes.join(', ')}.`;
    }

    return {
      qualityScore,
      grade,
      gradeName,
      isGradeA,
      isURS: grade === 'URS' || isURS,
      ursReason: isURS ? ursReason : undefined,
      explanation,
      needsHumanReview,
      reviewReason,
      fairPriceRatePerQuintal,
    };
  }
}
