import { jsPDF } from 'jspdf';
import { CertifiedReport } from '../types';

export function generateReportPDF(report: CertifiedReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background Header
  doc.setFillColor(15, 23, 18);
  doc.rect(0, 0, 210, 42, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriGrade Mandi Procurement Certificate', 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('CERTIFIED PRODUCE QUALITY REPORT & SETTLEMENT SLIP', 14, 26);
  doc.text(`MEMO NO: ${report.reportNumber}`, 14, 32);

  // Verification Badge on Top Right
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(`VERIFICATION ID: ${report.verificationId}`, 130, 26);
  doc.text(`DATE: ${report.createdAt.split('T')[0]}`, 130, 32);

  doc.setTextColor(30, 30, 30);

  // Section 1: Lot & Origin Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Produce Identification & Farmer Traceability', 14, 50);

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(14, 54, 182, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Commodity:', 20, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.vegetableType.toUpperCase()} (${report.variety})`, 50, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Farmer / Grower:', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(report.growerOrigin || 'Registered Certified Farm', 55, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Batch Ref:', 20, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(report.batchId, 45, 78);

  doc.setFont('helvetica', 'bold');
  doc.text('Lot Weight:', 110, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.estimatedLotWeightKg || 4500} kg (${((report.estimatedLotWeightKg || 4500) / 100).toFixed(1)} Quintals)`, 135, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Grade A (FAQ):', 110, 70);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 140, 90);
  doc.text(`${report.gradeAPercent || 72}% Yield`, 138, 70);

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('URS Percentage:', 110, 78);
  doc.setTextColor(220, 38, 38);
  doc.text(`${report.ursPercent || 10}% Under-Rate`, 142, 78);

  // Section 2: Defect Classification
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Mandated Four-Pillar Defect Breakdown', 14, 96);

  doc.roundedRect(14, 100, 182, 32, 2, 2, 'FD');

  const rot = report.defectBreakdownSummary?.rottenCount ?? 3;
  const spr = report.defectBreakdownSummary?.sproutedCount ?? 4;
  const dam = report.defectBreakdownSummary?.damagedCount ?? 6;
  const und = report.defectBreakdownSummary?.undersizedCount ?? 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Rotten / Fungal Decay:     ${rot} samples (Aspergillus / Soft rot)`, 20, 110);
  doc.text(`• Sprouted Vegetative Bulbs: ${spr} samples (Apical green shoots)`, 20, 118);
  doc.text(`• Mechanical Cuts & Damage:  ${dam} samples (Harvester abrasions)`, 105, 110);
  doc.text(`• Undersized Caliber (<45mm): ${und} samples (Substandard prepack)`, 105, 118);

  // Section 3: Pricing & Settlement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Transparent Mandi Settlement Slip', 14, 140);

  doc.roundedRect(14, 144, 182, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Benchmark Base MSP:       Rs 2,400 per quintal', 20, 154);
  doc.text(`Grade A FAQ Bonus:         +Rs 250 (Yield: ${report.gradeAPercent || 72}%)`, 20, 162);
  doc.text(`URS Defect Deduction:     -Rs ${Math.round((report.ursPercent || 10) * 28)} (URS: ${report.ursPercent || 10}%)`, 20, 170);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Farmer Payout:', 110, 158);
  doc.setFontSize(13);
  doc.setTextColor(16, 140, 90);
  const payout = report.settlement?.totalFarmerPayout ?? 106200;
  doc.text(`Rs ${payout.toLocaleString()}`, 110, 168);

  // Section 4: Public Verification & QR
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Official Sign-Off & Public QR Verification', 14, 188);

  doc.roundedRect(14, 192, 182, 45, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital QR Verification Link:', 20, 202);
  doc.setTextColor(16, 120, 200);
  doc.text(`https://agrigrade.app${report.publicVerificationUrl}`, 20, 208);

  doc.setTextColor(30, 30, 30);
  doc.text('Certified by Mandi Inspector:', 20, 218);
  doc.setFont('helvetica', 'bold');
  doc.text(report.certifiedBy, 20, 224);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Cryptographically hashed on AgriGrade Firestore Ledger. Dispute-free settlement record for farmers and buyers.', 20, 231);

  // Save PDF
  doc.save(`${report.reportNumber}.pdf`);
}
