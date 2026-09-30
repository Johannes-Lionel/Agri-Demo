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

    if (!aiAnalysis.detectionPresent) {
      return {
        qualityScore: 0,
        grade: 'URS',
        gradeName: 'URS (Unfit / No Onion Detected)',
        isGradeA: false,
        isURS: true,
        ursReason: 'No valid produce specimen detected in the camera frame.',
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
    // If the onion is Rotten, Sprouted, severely Damaged, or Undersized, it is categorized as URS!
    let isURS = false;
    let ursReason = '';
    const ursConditions: string[] = [];

    if (flags.isRotten) {
      isURS = true;
      ursConditions.push('Rotten / Fungal decay (Aspergillus/Botrytis)');
    }
    if (flags.isSprouted) {
      isURS = true;
      ursConditions.push('Sprouted vegetative shoot');
    }
    if (flags.isUndersized) {
      isURS = true;
      ursConditions.push('Undersized caliber (<45mm diameter)');
    }
    if (flags.isDamaged && (aiAnalysis.defectsDetected.some((d) => d.severity === 'critical') || flags.damagedDetails?.includes('severe'))) {
      isURS = true;
      ursConditions.push('Severe mechanical damage / puncture');
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
      explanation = `Assigned as URS due to procurement defect condition: ${ursReason}. Disqualified from Fair Average Quality (FAQ) Grade A standard.`;
    } else if (
      qualityScore >= this.config.gradeA.minScore &&
      totalDefectArea <= this.config.gradeA.maxDefectPercent &&
      shapeScore >= this.config.gradeA.minSymmetry
    ) {
      grade = 'GRADE_A';
      gradeName = 'Grade A (FAQ / Premium Export Standard)';
      isGradeA = true;
      explanation = 'Meets Fair Average Quality (FAQ) Grade A benchmark: Cured dry tunics, intact neck closure, sound flesh, zero rot, zero sprouting, and standard size.';
    } else if (qualityScore >= this.config.gradeB.minScore && totalDefectArea <= this.config.gradeB.maxDefectPercent) {
      grade = 'GRADE_B';
      gradeName = 'Grade B (Commercial Domestic Retail)';
      isGradeA = false;
      explanation = 'Acceptable domestic commercial quality with minor superficial skin slip (<9%), but sound internal scales.';
    } else {
      grade = 'URS';
      gradeName = 'URS (Under-Rate Stock)';
      isGradeA = false;
      explanation = `Cumulative defects (${totalDefectArea.toFixed(1)}% affected area) fall below commercial table standards; classified as URS.`;
    }

    // Pricing estimation per quintal
    let fairPriceRatePerQuintal = this.config.baseMspRatePerQuintal;
    if (grade === 'GRADE_A') {
      fairPriceRatePerQuintal += 250; // +₹250 premium for Grade A FAQ
    } else if (grade === 'GRADE_B') {
      fairPriceRatePerQuintal -= 150; // -₹150 for minor skin defects
    } else {
      fairPriceRatePerQuintal = Math.round(this.config.baseMspRatePerQuintal * 0.45); // URS discount
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
    } else if (Math.abs(qualityScore - this.config.gradeA.minScore) <= 2) {
      needsHumanReview = true;
      reviewReason = 'Borderline score between Grade A and commercial grade. Joint review recommended.';
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
