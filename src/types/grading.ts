export type CropCategory = 'apple' | 'tomato' | 'pepper' | 'mango' | 'potato' | 'orange' | 'strawberry' | 'avocado';

export type GradeTier = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'URS' | 'REJECT';

export interface DefectItem {
  id: string;
  type: string;
  label: string;
  severity: 'minor' | 'moderate' | 'critical';
  confidence: number;
  box: {
    x: number; // percentage 0-100
    y: number;
    w: number;
    h: number;
  };
  impactScore?: number;
}

export interface MetricBreakdown {
  colorUniformity: number; // 0-100
  ripenessPercentage: number; // 0-100
  estimatedBrix: number; // in °Bx
  firmnessKg: number; // in kg/cm²
  caliberMm: number; // in mm diameter
  surfaceDefectPercent: number; // % of surface affected
  shapeSymmetry: number; // 0-100
  freshnessIndex: number; // 0-100
  estimatedShelfLifeDays: {
    ambient: number;
    coldChain: number;
  };
}

export interface InspectionResult {
  id: string;
  timestamp: string;
  crop: CropCategory;
  cropName: string;
  variety: string;
  sampleName: string;
  imageUrl: string;
  overallScore: number; // 0-100
  assignedGrade: GradeTier;
  gradeTitle: string;
  metrics: MetricBreakdown;
  defects: DefectItem[];
  compliance: {
    usdaStandard: string;
    uneceClass: string;
    exportEligible: boolean;
    supermarketEligible: boolean;
    processingEligible: boolean;
  };
  recommendedRouting: {
    market: 'Premium Export' | 'Domestic Retail' | 'Commercial Processing' | 'Livestock / Compost' | 'URS Under-Rate';
    suggestedPricePerKg: number;
    rationale: string;
    valueRecoveryTips: string[];
  };
}

export interface BatchLot {
  id: string;
  lotNumber: string;
  growerName: string;
  farmOrchard: string;
  harvestDate: string;
  inspectionDate: string;
  crop: CropCategory;
  variety: string;
  totalWeightKg: number;
  sampleCount: number;
  certifiedGrade: GradeTier;
  scoreAvg: number;
  defectRateAvg: number;
  inspectorName: string;
  status: 'Certified' | 'Pending Review' | 'Flagged' | 'Dispatched';
  notes?: string;
}

export interface CropSpecification {
  crop: CropCategory;
  commonName: string;
  scientificName: string;
  icon: string;
  idealCaliberRange: string;
  minBrix: number;
  idealFirmness: string;
  gradeTolerances: {
    gradeA: {
      minScore: number;
      maxDefectArea: number;
      minColorMatch: number;
      usdaEquivalent: string;
      typicalDestination: string;
    };
    gradeB: {
      minScore: number;
      maxDefectArea: number;
      minColorMatch: number;
      usdaEquivalent: string;
      typicalDestination: string;
    };
    gradeC: {
      minScore: number;
      maxDefectArea: number;
      minColorMatch: number;
      usdaEquivalent: string;
      typicalDestination: string;
    };
    reject: {
      reasons: string[];
    };
  };
}

export interface PresetSample {
  id: string;
  crop: CropCategory;
  name: string;
  subtitle: string;
  variety: string;
  intendedGrade: GradeTier;
  imageUrl: string;
  score: number;
  metrics: MetricBreakdown;
  defects: DefectItem[];
  rationale: string;
}
