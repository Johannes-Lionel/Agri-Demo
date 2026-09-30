import { AIAnalysisOutput } from './aiTypes';

export interface GradingConfig {
  confidenceThresholdForAutoAccept: number; // e.g. 80%
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
  gradeC: {
    minScore: number;
    maxDefectPercent: number;
    minSymmetry: number;
  };
}

export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  confidenceThresholdForAutoAccept: 80,
  gradeA: {
    minScore: 88,
    maxDefectPercent: 3.5,
    minSymmetry: 80,
  },
  gradeB: {
    minScore: 70,
    maxDefectPercent: 9.0,
    minSymmetry: 65,
  },
  gradeC: {
    minScore: 50,
    maxDefectPercent: 20.0,
    minSymmetry: 50,
  },
};

export interface GradingEngineResult {
  qualityScore: number; // 0 - 100
  grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECT';
  gradeName: string;
  explanation: string;
  needsHumanReview: boolean;
  reviewReason?: string;
  defectPenaltyTotal: number;
  scoreBreakdown: {
    shapeScore: number;
    colorScore: number;
    defectDeductions: number;
    confidenceFactor: number;
  };
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
        grade: 'REJECT',
        gradeName: 'Reject / Undetected',
        explanation: 'No vegetable specimen detected in the provided image field.',
        needsHumanReview: true,
        reviewReason: 'No produce detected in image frame.',
        defectPenaltyTotal: 100,
        scoreBreakdown: {
          shapeScore: 0,
          colorScore: 0,
          defectDeductions: 100,
          confidenceFactor: 0,
        },
      };
    }

    // Calculate defect deduction based on detected defects & severity
    let defectPenaltyTotal = 0;
    let hasCriticalDefect = false;
    let criticalDefectName = '';

    for (const defect of aiAnalysis.defectsDetected) {
      let weight = 1.0;
      if (defect.severity === 'critical') {
        weight = 3.5;
        hasCriticalDefect = true;
        criticalDefectName = defect.label;
      } else if (defect.severity === 'moderate') {
        weight = 2.0;
      } else {
        weight = 1.0;
      }

      defectPenaltyTotal += defect.estimatedAreaPercent * weight * (defect.confidence / 100);
    }

    // Special crop logic for Onions:
    // Check for black mold (Aspergillus), neck rot (Botrytis), or green sprouting
    const totalDefectArea = aiAnalysis.defectsDetected.reduce(
      (sum, d) => sum + d.estimatedAreaPercent,
      0
    );

    const shapeScore = Math.max(40, aiAnalysis.shapeCharacteristics.symmetryRatio || 80);
    const colorScore = Math.max(40, aiAnalysis.colorMetrics.skinColorUniformity || 80);

    // Baseline calculation:
    // 40% Defect-free surface + 30% Color & curing + 30% Shape regularity
    const baseDefectScore = Math.max(0, 100 - defectPenaltyTotal * 4.5);
    let qualityScore = Math.round(
      baseDefectScore * 0.50 +
      colorScore * 0.25 +
      shapeScore * 0.25
    );

    qualityScore = Math.max(10, Math.min(99, qualityScore));

    // Determine Grade according to configurable standards
    let grade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECT';
    let gradeName: string;
    let explanation: string;

    if (hasCriticalDefect) {
      grade = 'REJECT';
      gradeName = 'Reject / Culled';
      explanation = `Rejected due to critical defect condition: ${criticalDefectName}. Violates food safety / storage thresholds.`;
    } else if (
      qualityScore >= this.config.gradeA.minScore &&
      totalDefectArea <= this.config.gradeA.maxDefectArea &&
      shapeScore >= this.config.gradeA.minSymmetry
    ) {
      grade = 'GRADE_A';
      gradeName = 'Grade A (Premium Export Quality)';
      explanation = `Excellent specimen with high surface integrity (≤${this.config.gradeA.maxDefectArea}% blemishes), uniform coloring, and sound morphological symmetry.`;
    } else if (
      qualityScore >= this.config.gradeB.minScore &&
      totalDefectArea <= this.config.gradeB.maxDefectArea &&
      shapeScore >= this.config.gradeB.minSymmetry
    ) {
      grade = 'GRADE_B';
      gradeName = 'Grade B (Commercial Domestic Retail)';
      explanation = `Good commercial quality with minor cosmetic surface blemishes within acceptable commercial tolerances.`;
    } else if (
      qualityScore >= this.config.gradeC.minScore &&
      totalDefectArea <= this.config.gradeC.maxDefectArea
    ) {
      grade = 'GRADE_C';
      gradeName = 'Grade C (Industrial Processing / Dicing)';
      explanation = `Cosmetic defects or asymmetry exceed fresh retail appearance standards, but internal edible flesh is suitable for industrial peeling/dicing.`;
    } else {
      grade = 'REJECT';
      gradeName = 'Reject / Culled';
      explanation = `Severe cumulative skin defects (${totalDefectArea.toFixed(1)}% affected area) or structural distortion below commercial processing thresholds.`;
    }

    // Confidence & Human Review Flagging
    let needsHumanReview = false;
    let reviewReason: string | undefined;

    if (aiAnalysis.overallVegetableConfidence < threshold) {
      needsHumanReview = true;
      reviewReason = `Low AI confidence (${aiAnalysis.overallVegetableConfidence}% < ${threshold}% threshold). Inspector verification required.`;
    } else if (aiAnalysis.unreliableAttributes.length > 0) {
      needsHumanReview = true;
      reviewReason = `Some physical attributes could not be reliably determined: ${aiAnalysis.unreliableAttributes.join(', ')}.`;
    } else if (Math.abs(qualityScore - this.config.gradeA.minScore) <= 2 || Math.abs(qualityScore - this.config.gradeB.minScore) <= 2) {
      needsHumanReview = true;
      reviewReason = 'Borderline score between grade boundaries. Human spot-check recommended.';
    }

    return {
      qualityScore,
      grade,
      gradeName,
      explanation,
      needsHumanReview,
      reviewReason,
      defectPenaltyTotal: Number(defectPenaltyTotal.toFixed(1)),
      scoreBreakdown: {
        shapeScore,
        colorScore,
        defectDeductions: Math.round(defectPenaltyTotal * 4.5),
        confidenceFactor: aiAnalysis.overallVegetableConfidence,
      },
    };
  }
}
