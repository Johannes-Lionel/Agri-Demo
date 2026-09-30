import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  InspectionRecord, BatchRecord, HumanReviewRecord, 
  CertifiedReport, VerificationRecord 
} from '../types';

export const INITIAL_BATCHES: BatchRecord[] = [
  {
    id: 'batch-on-881',
    batchNumber: 'LOT-ON-2026-881',
    userId: 'usr-default',
    vegetableType: 'onion',
    variety: 'Yellow Spanish Sweet Onion',
    growerOrigin: 'Treasure Valley Alliums (Plot 4)',
    quantityInspected: 125,
    estimatedLotWeightKg: 4500,
    gradeAPercent: 65.6,
    ursPercent: 12.0,
    gradeDistribution: {
      gradeA: 82,
      gradeB: 28,
      gradeC: 0,
      urs: 15,
      reject: 0,
    },
    defectBreakdownSummary: {
      rottenCount: 3,
      sproutedCount: 4,
      damagedCount: 6,
      undersizedCount: 2,
    },
    settlement: {
      baseMspPerQuintal: 2400,
      gradeAPremium: 250,
      ursPenalty: 380,
      finalRatePerQuintal: 2360,
      estimatedLotWeightKg: 4500,
      totalFarmerPayout: 106200,
      transparencyAuditHash: 'SHA256-AGRI-881-FAQ-OK',
    },
    averageConfidence: 89.4,
    averageScore: 86.2,
    defectSummary: {
      'Superficial Skin Slip': 18,
      'Minor Basal Scar': 8,
      'Sunscald Greening': 4,
      'Aspergillus Black Mold': 3,
    },
    humanReviewCount: 1,
    status: 'open',
    createdAt: '2026-09-28T09:30:00.000Z',
    updatedAt: '2026-09-29T16:45:00.000Z',
  },
  {
    id: 'batch-on-879',
    batchNumber: 'LOT-ON-2026-879',
    userId: 'usr-default',
    vegetableType: 'onion',
    variety: 'Red Creole Bulb',
    growerOrigin: 'Red River Allium Cooperative',
    quantityInspected: 240,
    estimatedLotWeightKg: 8200,
    gradeAPercent: 72.9,
    ursPercent: 8.3,
    gradeDistribution: {
      gradeA: 175,
      gradeB: 45,
      gradeC: 0,
      urs: 20,
      reject: 0,
    },
    defectBreakdownSummary: {
      rottenCount: 5,
      sproutedCount: 3,
      damagedCount: 8,
      undersizedCount: 4,
    },
    settlement: {
      baseMspPerQuintal: 2400,
      gradeAPremium: 250,
      ursPenalty: 210,
      finalRatePerQuintal: 2440,
      estimatedLotWeightKg: 8200,
      totalFarmerPayout: 200080,
      transparencyAuditHash: 'SHA256-AGRI-879-FAQ-OK',
    },
    averageConfidence: 92.1,
    averageScore: 89.8,
    defectSummary: {
      'Superficial Skin Slip': 24,
      'Dry Splitting': 12,
      'Mechanical Bruise': 5,
    },
    humanReviewCount: 1,
    status: 'certified',
    createdAt: '2026-09-26T11:00:00.000Z',
    updatedAt: '2026-09-27T14:15:00.000Z',
  },
];

export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'insp-on-101',
    userId: 'usr-default',
    batchId: 'batch-on-881',
    vegetableType: 'onion',
    variety: 'Yellow Spanish Sweet',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
    calibrationUsed: true,
    calibrationReferenceType: 'standard_coin_25mm',
    imageQuality: {
      width: 1200,
      height: 1200,
      megapixels: 1.44,
      resolutionStatus: 'PASSED',
      exposureStatus: 'PASSED',
      averageBrightness: 125,
      sharpnessStatus: 'SHARP',
      sharpnessScore: 84,
      framingStatus: 'CENTERED',
      overallQualityPassed: true,
      warnings: [],
    },
    confidenceScore: 94,
    needsHumanReview: false,
    grade: 'GRADE_A',
    gradeName: 'Grade A (FAQ / Export Quality)',
    qualityScore: 94,
    explanation: 'Uniform golden skin tunic, intact dry neck closure, clean basal plate. Calibrated diameter 74mm within Jumbo specification.',
    status: 'completed',
    createdAt: '2026-09-29T10:15:00.000Z',
    hackathonFlags: {
      isRotten: false,
      isSprouted: false,
      isDamaged: false,
      isUndersized: false,
    },
    defects: [
      {
        id: 'def-1',
        type: 'skin_peeling',
        label: 'Minor Papery Flake (<3%)',
        severity: 'minor',
        locationDesc: 'Apical shoulder',
        confidence: 91,
        estimatedAreaPercent: 1.2,
      },
    ],
    shape: {
      shapeType: 'Globular',
      symmetryRatio: 92,
      regularityDescription: 'Highly symmetrical globe bulb',
    },
    color: {
      dominantColor: 'Amber Golden Bronze',
      skinColorUniformity: 93,
      browningOrDiscoloration: 2,
      description: 'Evenly cured papery outer scales',
    },
    size: {
      estimatedDiameterMm: 74.2,
      caliberCategory: 'Jumbo (75mm class)',
      isCalibrated: true,
      calibrationReference: 'standard_coin_25mm',
      accuracyNote: 'Calibrated using physical coin marker',
    },
    unreliableAttributes: [],
    rawObservations: 'Zero vegetative sprout shoots detected. Turgid internal scales, dry papery wrapper. Passed Grade A FAQ.',
    aiModelUsed: 'Gemini 2.5 Flash Vision Inspector',
  },
  {
    id: 'insp-on-102',
    userId: 'usr-default',
    batchId: 'batch-on-881',
    vegetableType: 'onion',
    variety: 'Yellow Spanish Sweet',
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    calibrationUsed: false,
    imageQuality: {
      width: 800,
      height: 800,
      megapixels: 0.64,
      resolutionStatus: 'PASSED',
      exposureStatus: 'PASSED',
      averageBrightness: 110,
      sharpnessStatus: 'MODERATE',
      sharpnessScore: 62,
      framingStatus: 'CENTERED',
      overallQualityPassed: true,
      warnings: ['Moderate sharpness due to oblique angle'],
    },
    confidenceScore: 72,
    needsHumanReview: true,
    humanReviewReason: 'Low AI confidence (72% < 80% threshold). Ambiguous dark pigmentation near neck collar.',
    grade: 'GRADE_B',
    gradeName: 'Grade B (Commercial Domestic Retail)',
    qualityScore: 74,
    explanation: 'Localized discoloration near the dried neck. Requires manual tactile check to ensure dryness.',
    status: 'needs_review',
    createdAt: '2026-09-29T11:40:00.000Z',
    hackathonFlags: {
      isRotten: false,
      isSprouted: false,
      isDamaged: true,
      isUndersized: false,
      damagedDetails: 'Superficial neck discoloration (not active rot)',
    },
    defects: [
      {
        id: 'def-2',
        type: 'damage',
        label: 'Localized Dark Pigment at Neck Collar',
        severity: 'moderate',
        locationDesc: 'Neck boundary',
        confidence: 68,
        estimatedAreaPercent: 5.8,
      },
    ],
    shape: {
      shapeType: 'Slightly Flattened Globe',
      symmetryRatio: 81,
      regularityDescription: 'Normal cultivar shape with slight lateral asymmetry',
    },
    color: {
      dominantColor: 'Light Copper',
      skinColorUniformity: 76,
      browningOrDiscoloration: 12,
      description: 'Color slightly uneven across upper shoulder',
    },
    size: {
      estimatedDiameterMm: null,
      caliberCategory: 'Estimated Medium (~65mm)',
      isCalibrated: false,
      accuracyNote: 'Estimated visually without calibration reference',
    },
    unreliableAttributes: ['Neck internal firmness (requires tactile verification)'],
    rawObservations: 'Discoloration could be harmless soil marking or early saprophytic spore. Flagged for human review.',
    aiModelUsed: 'Gemini 2.5 Flash Vision Inspector',
  },
];

export const INITIAL_REPORTS: CertifiedReport[] = [
  {
    id: 'rep-on-2026-01',
    reportNumber: 'CERT-AGRI-2026-0042',
    userId: 'usr-default',
    batchId: 'batch-on-879',
    verificationId: 'VER-AGRI-879-X4',
    vegetableType: 'onion',
    variety: 'Red Creole Bulb',
    growerOrigin: 'Red River Allium Cooperative',
    totalQuantity: 240,
    estimatedLotWeightKg: 8200,
    certifiedGrade: 'GRADE_A',
    gradeAPercent: 72.9,
    ursPercent: 8.3,
    averageScore: 89.8,
    averageConfidence: 92.1,
    gradeDistribution: {
      gradeA: 175,
      gradeB: 45,
      gradeC: 0,
      urs: 20,
      reject: 0,
    },
    defectBreakdownSummary: {
      rottenCount: 5,
      sproutedCount: 3,
      damagedCount: 8,
      undersizedCount: 4,
    },
    settlement: {
      baseMspPerQuintal: 2400,
      gradeAPremium: 250,
      ursPenalty: 210,
      finalRatePerQuintal: 2440,
      estimatedLotWeightKg: 8200,
      totalFarmerPayout: 200080,
      transparencyAuditHash: 'SHA256-AGRI-879-FAQ-OK',
    },
    defectSummary: {
      'Superficial Skin Slip': 24,
      'Dry Splitting': 12,
      'Mechanical Bruise': 5,
    },
    humanReviewCount: 1,
    certifiedBy: 'Dr. Sarah Lin (Lead Q/A Inspector)',
    facilityName: 'AgriGrade Regional Packhouse #4',
    publicVerificationUrl: '/verify/rep-on-2026-01',
    createdAt: '2026-09-27T15:00:00.000Z',
  },
];

export const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'rep-on-2026-01',
    reportId: 'rep-on-2026-01',
    reportNumber: 'CERT-AGRI-2026-0042',
    batchNumber: 'LOT-ON-2026-879',
    vegetableType: 'Onion (Dry Bulb)',
    variety: 'Red Creole Bulb',
    certifiedGrade: 'GRADE_A',
    gradeAPercent: 72.9,
    ursPercent: 8.3,
    totalInspected: 240,
    overallQualityScore: 89.8,
    certificationDate: '2026-09-27',
    issuer: 'AgriGrade Mandi Certification Authority',
    facilityName: 'AgriGrade Regional Packhouse #4',
    isValid: true,
  },
];

let memoryBatches = [...INITIAL_BATCHES];
let memoryInspections = [...INITIAL_INSPECTIONS];
let memoryReports = [...INITIAL_REPORTS];
let memoryVerifications = [...INITIAL_VERIFICATIONS];

export const firestoreService = {
  async getBatches(userId?: string): Promise<BatchRecord[]> {
    try {
      const q = userId
        ? query(collection(db, 'batches'), where('userId', '==', userId))
        : collection(db, 'batches');
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetched = snap.docs.map((d) => d.data() as BatchRecord);
        memoryBatches = fetched;
        return fetched;
      }
    } catch (err) {
      console.warn('Firestore getBatches fallback:', err);
    }
    return memoryBatches;
  },

  async getBatchById(id: string): Promise<BatchRecord | null> {
    try {
      const snap = await getDoc(doc(db, 'batches', id));
      if (snap.exists()) return snap.data() as BatchRecord;
    } catch (err) {
      console.warn('Firestore getBatchById fallback:', err);
    }
    return memoryBatches.find((b) => b.id === id) || null;
  },

  async createBatch(batch: BatchRecord): Promise<void> {
    memoryBatches = [batch, ...memoryBatches.filter((b) => b.id !== batch.id)];
    try {
      await setDoc(doc(db, 'batches', batch.id), batch);
    } catch (err) {
      console.warn('Failed to write batch to Firestore, preserved in memory:', err);
    }
  },

  async updateBatch(id: string, partial: Partial<BatchRecord>): Promise<void> {
    memoryBatches = memoryBatches.map((b) => (b.id === id ? { ...b, ...partial } : b));
    try {
      await updateDoc(doc(db, 'batches', id), partial);
    } catch (err) {
      console.warn('Failed to update batch in Firestore:', err);
    }
  },

  async getInspections(batchId?: string): Promise<InspectionRecord[]> {
    try {
      const q = batchId
        ? query(collection(db, 'inspections'), where('batchId', '==', batchId))
        : collection(db, 'inspections');
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetched = snap.docs.map((d) => d.data() as InspectionRecord);
        memoryInspections = fetched;
        return fetched;
      }
    } catch (err) {
      console.warn('Firestore getInspections fallback:', err);
    }
    if (batchId) {
      return memoryInspections.filter((i) => i.batchId === batchId);
    }
    return memoryInspections;
  },

  async createInspection(inspection: InspectionRecord): Promise<void> {
    memoryInspections = [inspection, ...memoryInspections.filter((i) => i.id !== inspection.id)];
    try {
      await setDoc(doc(db, 'inspections', inspection.id), inspection);
    } catch (err) {
      console.warn('Failed to write inspection to Firestore:', err);
    }

    // Update parent batch statistics if batchId is provided
    if (inspection.batchId) {
      const batch = memoryBatches.find((b) => b.id === inspection.batchId);
      if (batch) {
        const bInsps = memoryInspections.filter((i) => i.batchId === batch.id);
        const count = bInsps.length;
        const gA = bInsps.filter((i) => i.grade === 'GRADE_A').length;
        const gB = bInsps.filter((i) => i.grade === 'GRADE_B').length;
        const gURS = bInsps.filter((i) => i.grade === 'URS' || i.grade === 'REJECT').length;
        const gradeAPct = Number(((gA / count) * 100).toFixed(1));
        const ursPct = Number(((gURS / count) * 100).toFixed(1));

        const rot = bInsps.filter((i) => i.hackathonFlags?.isRotten).length;
        const spr = bInsps.filter((i) => i.hackathonFlags?.isSprouted).length;
        const dam = bInsps.filter((i) => i.hackathonFlags?.isDamaged).length;
        const und = bInsps.filter((i) => i.hackathonFlags?.isUndersized).length;

        await this.updateBatch(batch.id, {
          quantityInspected: count,
          gradeAPercent: gradeAPct,
          ursPercent: ursPct,
          gradeDistribution: {
            gradeA: gA,
            gradeB: gB,
            gradeC: 0,
            urs: gURS,
            reject: 0,
          },
          defectBreakdownSummary: {
            rottenCount: rot,
            sproutedCount: spr,
            damagedCount: dam,
            undersizedCount: und,
          },
        });
      }
    }
  },

  async updateInspection(id: string, partial: Partial<InspectionRecord>): Promise<void> {
    memoryInspections = memoryInspections.map((i) => (i.id === id ? { ...i, ...partial } : i));
    try {
      await updateDoc(doc(db, 'inspections', id), partial);
    } catch (err) {
      console.warn('Failed to update inspection in Firestore:', err);
    }
  },

  async getPendingReviews(): Promise<InspectionRecord[]> {
    const all = await this.getInspections();
    return all.filter((i) => i.status === 'needs_review' || i.needsHumanReview);
  },

  async submitReview(review: HumanReviewRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'humanReviews', review.id), review);
    } catch (err) {
      console.warn('Failed to write humanReview to Firestore:', err);
    }

    await this.updateInspection(review.inspectionId, {
      grade: review.finalGrade,
      status: 'reviewed',
      needsHumanReview: false,
    });
  },

  async getReports(): Promise<CertifiedReport[]> {
    try {
      const snap = await getDocs(collection(db, 'reports'));
      if (!snap.empty) {
        const fetched = snap.docs.map((d) => d.data() as CertifiedReport);
        memoryReports = fetched;
        return fetched;
      }
    } catch (err) {
      console.warn('Firestore getReports fallback:', err);
    }
    return memoryReports;
  },

  async getReportById(id: string): Promise<CertifiedReport | null> {
    try {
      const snap = await getDoc(doc(db, 'reports', id));
      if (snap.exists()) return snap.data() as CertifiedReport;
    } catch (err) {
      console.warn('Firestore getReportById fallback:', err);
    }
    return memoryReports.find((r) => r.id === id) || null;
  },

  async createReport(report: CertifiedReport): Promise<void> {
    memoryReports = [report, ...memoryReports.filter((r) => r.id !== report.id)];
    try {
      await setDoc(doc(db, 'reports', report.id), report);
    } catch (err) {
      console.warn('Failed to write report to Firestore:', err);
    }

    const verRecord: VerificationRecord = {
      id: report.id,
      reportId: report.id,
      reportNumber: report.reportNumber,
      batchNumber: `BATCH-${report.batchId.slice(-6).toUpperCase()}`,
      vegetableType: report.vegetableType,
      variety: report.variety,
      certifiedGrade: report.certifiedGrade,
      gradeAPercent: report.gradeAPercent || 80,
      ursPercent: report.ursPercent || 10,
      totalInspected: report.totalQuantity,
      overallQualityScore: report.averageScore,
      certificationDate: report.createdAt.split('T')[0],
      issuer: report.certifiedBy,
      facilityName: report.facilityName,
      isValid: true,
    };
    await this.createVerificationRecord(verRecord);
  },

  async getVerificationRecord(reportId: string): Promise<VerificationRecord | null> {
    try {
      const snap = await getDoc(doc(db, 'verificationRecords', reportId));
      if (snap.exists()) return snap.data() as VerificationRecord;
    } catch (err) {
      console.warn('Firestore getVerificationRecord fallback:', err);
    }
    return memoryVerifications.find((v) => v.id === reportId || v.reportId === reportId) || null;
  },

  async createVerificationRecord(record: VerificationRecord): Promise<void> {
    memoryVerifications = [record, ...memoryVerifications.filter((v) => v.id !== record.id)];
    try {
      await setDoc(doc(db, 'verificationRecords', record.id), record);
    } catch (err) {
      console.warn('Failed to write verificationRecord to Firestore:', err);
    }
  },
};
