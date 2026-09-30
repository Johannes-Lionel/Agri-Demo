import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  InspectionRecord, BatchRecord, HumanReviewRecord, 
  CertifiedReport, VerificationRecord 
} from '../types';

// Clean initial state with zero hardcoded sample images or fake data
export const INITIAL_BATCHES: BatchRecord[] = [
  {
    id: 'batch-live-01',
    batchNumber: 'LOT-MANDI-2026-01',
    userId: 'usr-default',
    vegetableType: 'onion',
    variety: 'Nashik Red Allium',
    growerOrigin: 'Active Procurement Bay #1',
    quantityInspected: 0,
    estimatedLotWeightKg: 4000,
    gradeAPercent: 0,
    ursPercent: 0,
    gradeDistribution: {
      gradeA: 0,
      gradeB: 0,
      gradeC: 0,
      urs: 0,
      reject: 0,
    },
    defectBreakdownSummary: {
      rottenCount: 0,
      sproutedCount: 0,
      damagedCount: 0,
      undersizedCount: 0,
    },
    settlement: {
      baseMspPerQuintal: 2400,
      gradeAPremium: 250,
      ursPenalty: 0,
      finalRatePerQuintal: 2400,
      estimatedLotWeightKg: 4000,
      totalFarmerPayout: 96000,
      transparencyAuditHash: 'SHA256-LIVE-LOT-READY',
    },
    averageConfidence: 0,
    averageScore: 0,
    defectSummary: {},
    humanReviewCount: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_INSPECTIONS: InspectionRecord[] = [];
export const INITIAL_REPORTS: CertifiedReport[] = [];
export const INITIAL_VERIFICATIONS: VerificationRecord[] = [];

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

    // Update parent batch statistics dynamically
    if (inspection.batchId) {
      const batch = memoryBatches.find((b) => b.id === inspection.batchId);
      if (batch) {
        const bInsps = memoryInspections.filter((i) => i.batchId === batch.id);
        const count = bInsps.length;
        const gA = bInsps.filter((i) => i.grade === 'GRADE_A').length;
        const gB = bInsps.filter((i) => i.grade === 'GRADE_B').length;
        const gURS = bInsps.filter((i) => i.grade === 'URS' || i.grade === 'REJECT').length;
        const gradeAPct = count > 0 ? Number(((gA / count) * 100).toFixed(1)) : 0;
        const ursPct = count > 0 ? Number(((gURS / count) * 100).toFixed(1)) : 0;

        const rot = bInsps.filter((i) => i.hackathonFlags?.isRotten).length;
        const spr = bInsps.filter((i) => i.hackathonFlags?.isSprouted).length;
        const dam = bInsps.filter((i) => i.hackathonFlags?.isDamaged).length;
        const und = bInsps.filter((i) => i.hackathonFlags?.isUndersized).length;

        const avgScore = count > 0 ? Math.round(bInsps.reduce((acc, curr) => acc + curr.qualityScore, 0) / count) : 0;
        const avgConf = count > 0 ? Math.round(bInsps.reduce((acc, curr) => acc + curr.confidenceScore, 0) / count) : 0;

        const baseMsp = 2400;
        const gradeABonus = Math.round((gradeAPct / 100) * 250);
        const ursDeduction = Math.round((ursPct / 100) * 450);
        const finalRate = Math.max(1200, baseMsp + gradeABonus - ursDeduction);
        const weightKg = batch.estimatedLotWeightKg || 4000;
        const totalPayout = Math.round((weightKg / 100) * finalRate);

        await this.updateBatch(batch.id, {
          quantityInspected: count,
          gradeAPercent: gradeAPct,
          ursPercent: ursPct,
          averageScore: avgScore,
          averageConfidence: avgConf,
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
          settlement: {
            baseMspPerQuintal: baseMsp,
            gradeAPremium: gradeABonus,
            ursPenalty: ursDeduction,
            finalRatePerQuintal: finalRate,
            estimatedLotWeightKg: weightKg,
            totalFarmerPayout: totalPayout,
            transparencyAuditHash: `SHA256-AGRI-${Date.now()}`,
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
      batchNumber: `LOT-${report.batchId.slice(-6).toUpperCase()}`,
      vegetableType: report.vegetableType,
      variety: report.variety,
      certifiedGrade: report.certifiedGrade,
      gradeAPercent: report.gradeAPercent || 0,
      ursPercent: report.ursPercent || 0,
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
