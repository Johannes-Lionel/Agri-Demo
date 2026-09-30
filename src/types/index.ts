export type GradeTier = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECT';

export type UserRole = 'inspector' | 'manager' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  facilityName: string;
  createdAt: string;
}

export interface DefectItem {
  id: string;
  type: string;
  label: string;
  severity: 'minor' | 'moderate' | 'critical';
  locationDesc: string;
  confidence: number;
  estimatedAreaPercent: number;
}

export interface ImageQualityReport {
  width: number;
  height: number;
  megapixels: number;
  resolutionStatus: 'PASSED' | 'WARNING' | 'FAILED';
  exposureStatus: 'PASSED' | 'UNDEREXPOSED' | 'OVEREXPOSED';
  averageBrightness: number;
  sharpnessStatus: 'SHARP' | 'MODERATE' | 'BLURRY';
  sharpnessScore: number;
  framingStatus: 'CENTERED' | 'OFF_CENTER';
  overallQualityPassed: boolean;
  warnings: string[];
}

export interface InspectionRecord {
  id: string;
  userId: string;
  batchId?: string;
  vegetableType: string;
  variety: string;
  imageUrl: string;
  calibrationUsed: boolean;
  calibrationReferenceType?: string;
  imageQuality: ImageQualityReport;
  confidenceScore: number;
  needsHumanReview: boolean;
  humanReviewReason?: string;
  grade: GradeTier;
  gradeName: string;
  qualityScore: number;
  explanation: string;
  status: 'completed' | 'needs_review' | 'reviewed' | 'rejected';
  createdAt: string;
  defects: DefectItem[];
  shape: {
    shapeType: string;
    symmetryRatio: number;
    regularityDescription: string;
  };
  color: {
    dominantColor: string;
    skinColorUniformity: number;
    browningOrDiscoloration: number;
    description: string;
  };
  size: {
    estimatedDiameterMm: number | null;
    caliberCategory: string;
    isCalibrated: boolean;
    calibrationReference?: string;
    accuracyNote: string;
  };
  unreliableAttributes: string[];
  rawObservations: string;
  aiModelUsed: string;
}

export interface BatchRecord {
  id: string;
  batchNumber: string;
  userId: string;
  vegetableType: string;
  variety: string;
  growerOrigin: string;
  quantityInspected: number;
  gradeDistribution: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    reject: number;
  };
  averageConfidence: number;
  averageScore: number;
  defectSummary: Record<string, number>;
  humanReviewCount: number;
  status: 'open' | 'review_pending' | 'certified' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface HumanReviewRecord {
  id: string;
  inspectionId: string;
  userId: string;
  inspectorUid: string;
  inspectorName: string;
  originalGrade: GradeTier;
  finalGrade: GradeTier;
  decision: 'accepted' | 'overridden';
  notes: string;
  reviewedAt: string;
}

export interface CertifiedReport {
  id: string;
  reportNumber: string;
  userId: string;
  batchId: string;
  verificationId: string;
  vegetableType: string;
  variety: string;
  growerOrigin: string;
  totalQuantity: number;
  certifiedGrade: GradeTier;
  averageScore: number;
  averageConfidence: number;
  gradeDistribution: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    reject: number;
  };
  defectSummary: Record<string, number>;
  humanReviewCount: number;
  certifiedBy: string;
  facilityName: string;
  publicVerificationUrl: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  reportId: string;
  reportNumber: string;
  batchNumber: string;
  vegetableType: string;
  variety: string;
  certifiedGrade: GradeTier;
  totalInspected: number;
  overallQualityScore: number;
  certificationDate: string;
  issuer: string;
  facilityName: string;
  isValid: boolean;
}

export interface AppSettings {
  confidenceThresholdForAutoAccept: number; // default 80
  defaultVegetableType: string; // default 'onion'
  calibrationReference: 'standard_coin_25mm' | 'standard_card_85mm' | 'grid_10mm' | 'none';
  selectedModel: 'gemini-2.5-flash' | 'pytorch-yolo-produce';
  facilityName: string;
  inspectorName: string;
}
