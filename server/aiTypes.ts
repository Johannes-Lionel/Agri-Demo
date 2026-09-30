export interface AIInspectionRequest {
  imageBase64: string;
  mimeType?: string;
  vegetableType: string;
  variety?: string;
  calibrationReference?: 'standard_coin_25mm' | 'standard_card_85mm' | 'grid_10mm' | 'none';
}

export interface DefectObservation {
  id: string;
  type: string;
  label: string;
  severity: 'minor' | 'moderate' | 'critical';
  locationDesc: string;
  confidence: number; // 0-100
  estimatedAreaPercent: number; // percentage of surface affected
  isUnreliable?: boolean;
}

export interface ShapeMetrics {
  shapeType: string;
  symmetryRatio: number; // 0-100
  regularityDescription: string;
  isUnreliable?: boolean;
}

export interface ColorMetrics {
  dominantColor: string;
  skinColorUniformity: number; // 0-100
  browningOrDiscoloration: number; // 0-100
  description: string;
  isUnreliable?: boolean;
}

export interface SizeEstimates {
  estimatedDiameterMm: number | null;
  caliberCategory: string;
  isCalibrated: boolean;
  calibrationReference?: string;
  accuracyNote: string;
}

export interface HackathonDefectFlags {
  isRotten: boolean;
  isSprouted: boolean;
  isDamaged: boolean;
  isUndersized: boolean;
  rottenDetails?: string;
  sproutedDetails?: string;
  damagedDetails?: string;
  undersizedDetails?: string;
}

export interface AIAnalysisOutput {
  detectionPresent: boolean;
  vegetableDetected: string;
  isTargetVegetable: boolean;
  shapeCharacteristics: ShapeMetrics;
  colorMetrics: ColorMetrics;
  defectsDetected: DefectObservation[];
  hackathonFlags: HackathonDefectFlags;
  sizeEstimates: SizeEstimates;
  overallVegetableConfidence: number; // 0-100
  confidenceRating: 'HIGH' | 'LOW';
  unreliableAttributes: string[];
  rawObservations: string;
  modelUsed: string;
}

export interface IVegetableAIService {
  name: string;
  version: string;
  analyze(request: AIInspectionRequest): Promise<AIAnalysisOutput>;
}
