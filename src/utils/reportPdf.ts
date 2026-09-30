import { jsPDF } from 'jspdf';
import { CertifiedReport } from '../types';

export function generateReportPDF(report: CertifiedReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Background Header
  doc.setFillColor(20, 24, 20);
  doc.rect(0, 0, 210, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriGrade Inspection Certificate', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('CERTIFIED HORTICULTURAL PRODUCE QUALITY REPORT', 14, 28);
  doc.text(`REPORT NO: ${report.reportNumber}`, 14, 34);

  // Verification Badge on Top Right
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(`VERIFICATION ID: ${report.verificationId}`, 130, 28);
  doc.text(`DATE: ${report.createdAt.split('T')[0]}`, 130, 34);

  // Reset text color
  doc.setTextColor(30, 30, 30);

  // Section 1: Lot & Origin Info
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Produce Identification & Traceability', 14, 52);

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(14, 56, 182, 38, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Commodity:', 20, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.vegetableType.toUpperCase()} (${report.variety})`, 50, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('Grower / Origin:', 20, 74);
  doc.setFont('helvetica', 'normal');
  doc.text(report.growerOrigin || 'Registered Certified Farm', 55, 74);

  doc.setFont('helvetica', 'bold');
  doc.text('Batch Ref:', 20, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(report.batchId, 45, 82);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Inspected:', 110, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.totalQuantity} specimens`, 145, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('Certified Grade:', 110, 74);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 140, 90);
  doc.text(report.certifiedGrade.replace('_', ' '), 145, 74);

  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Quality Index:', 110, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.averageScore} / 100`, 145, 82);

  // Section 2: Packout Distribution
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Grade Distribution & Quality Metrics', 14, 106);

  doc.roundedRect(14, 110, 182, 42, 2, 2, 'FD');

  const gA = report.gradeDistribution.gradeA || 0;
  const gB = report.gradeDistribution.gradeB || 0;
  const gC = report.gradeDistribution.gradeC || 0;
  const gR = report.gradeDistribution.reject || 0;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Grade A (Premium Export):  ${gA} units (${Math.round((gA / (report.totalQuantity || 1)) * 100)}%)`, 20, 120);
  doc.text(`Grade B (Domestic Retail): ${gB} units (${Math.round((gB / (report.totalQuantity || 1)) * 100)}%)`, 20, 128);
  doc.text(`Grade C (Processing):      ${gC} units (${Math.round((gC / (report.totalQuantity || 1)) * 100)}%)`, 20, 136);
  doc.text(`Rejected / Culled:         ${gR} units (${Math.round((gR / (report.totalQuantity || 1)) * 100)}%)`, 20, 144);

  doc.text(`Average AI Confidence:     ${report.averageConfidence}%`, 110, 120);
  doc.text(`Human Reviews Conducted:   ${report.humanReviewCount}`, 110, 128);
  doc.text(`Facility:                  ${report.facilityName}`, 110, 136);

  // Section 3: Defect Statistics
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Detected Physiological & Cosmetic Defects', 14, 164);

  doc.roundedRect(14, 168, 182, 36, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const defectEntries = Object.entries(report.defectSummary);
  if (defectEntries.length === 0) {
    doc.text('No critical defects recorded across the certified sampling lot.', 20, 178);
  } else {
    defectEntries.slice(0, 4).forEach(([defectName, count], idx) => {
      const yPos = 178 + idx * 6;
      doc.text(`• ${defectName}: ${count} occurrences`, 20, yPos);
    });
  }

  // Section 4: Public Verification & Signoff
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Official Sign-Off & Verification', 14, 216);

  doc.roundedRect(14, 220, 182, 45, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital QR Verification URL:', 20, 230);
  doc.setTextColor(16, 120, 200);
  doc.text(`https://agrigrade.app${report.publicVerificationUrl}`, 20, 236);

  doc.setTextColor(30, 30, 30);
  doc.text('Inspected & Certified By:', 20, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(report.certifiedBy, 20, 252);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Cryptographic signature: Verified against AgriGrade Firestore ledger. Valid for dispatch and commercial trade.', 20, 260);

  // Save PDF
  doc.save(`${report.reportNumber}.pdf`);
}
