import { jsPDF } from 'jspdf';
import { CertifiedReport } from '../types';

export function generateReportPDF(report: CertifiedReport): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const vegName = (report.vegetableType || 'Vegetable').toUpperCase();
    const repNum = report.reportNumber || `AGRI-${Date.now().toString().slice(-6)}`;
    const dateStr = report.createdAt ? report.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

    // Background Header
    doc.setFillColor(35, 73, 44); // #23492C
    doc.rect(0, 0, 210, 42, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Agrigrade Quality Inspection Certificate', 14, 18);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 195, 48); // #6CC330
    doc.text('CERTIFIED AGRICULTURAL VEGETABLE REPORT & SETTLEMENT SLIP', 14, 26);
    doc.text(`MEMO NO: ${repNum}`, 14, 32);

    // Verification Badge on Top Right
    doc.setTextColor(220, 235, 220);
    doc.setFontSize(8);
    doc.text(`VERIFICATION ID: ${report.verificationId || 'VER-AGRI-2.3'}`, 125, 26);
    doc.text(`DATE: ${dateStr}`, 125, 32);

    doc.setTextColor(15, 26, 19);

    // Section 1: Lot & Origin Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Produce Identification & Traceability', 14, 50);

    doc.setDrawColor(216, 232, 217);
    doc.setFillColor(244, 235, 220); // Cream
    doc.roundedRect(14, 54, 182, 36, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Commodity:', 20, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vegName} (${report.variety || 'Commercial Cultivar'})`, 55, 62);

    doc.setFont('helvetica', 'bold');
    doc.text('Origin / Mandi Bay:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(report.growerOrigin || 'Registered Intake Bay #1', 55, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Specimens Counted:', 20, 78);
    doc.setFont('helvetica', 'normal');
    const totalCount = report.counts?.totalCount ?? report.totalQuantity ?? 1;
    const goodCount = report.counts?.goodCount ?? Math.round(totalCount * ((report.gradeAPercent || 75) / 100));
    doc.text(`${totalCount} specimens (${goodCount} Good, ${totalCount - goodCount} Defective)`, 55, 78);

    doc.setFont('helvetica', 'bold');
    doc.text('Lot Weight:', 125, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.estimatedLotWeightKg || 4000} kg`, 150, 62);

    doc.setFont('helvetica', 'bold');
    doc.text('Grade A (FAQ):', 125, 70);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 115, 71);
    doc.text(`${report.gradeAPercent || 75}% Yield`, 152, 70);

    doc.setTextColor(15, 26, 19);
    doc.setFont('helvetica', 'bold');
    doc.text('URS Percentage:', 125, 78);
    doc.setTextColor(217, 83, 79);
    doc.text(`${report.ursPercent || 25}% Under-Rate`, 155, 78);

    // Section 2: Defect Classification
    doc.setTextColor(15, 26, 19);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Mandated Four-Pillar Defect Breakdown', 14, 98);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 102, 182, 32, 2, 2, 'FD');

    const rot = report.defectBreakdownSummary?.rottenCount ?? 1;
    const spr = report.defectBreakdownSummary?.sproutedCount ?? 1;
    const dam = report.defectBreakdownSummary?.damagedCount ?? 1;
    const und = report.defectBreakdownSummary?.undersizedCount ?? 0;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Rotten / Fungal Decay:     ${rot} item(s) (Tissue decay / soft rot)`, 20, 112);
    doc.text(`• Sprouted Vegetative Shoots: ${spr} item(s) (Apical sprouts / eyes)`, 20, 120);
    doc.text(`• Mechanical Cuts & Damage:  ${dam} item(s) (Harvest slicing)`, 110, 112);
    doc.text(`• Undersized Caliber (<45mm): ${und} item(s) (Substandard size)`, 110, 120);

    // Section 3: Pricing & Settlement
    doc.setTextColor(15, 26, 19);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Transparent Mandi Settlement Slip', 14, 142);

    doc.roundedRect(14, 146, 182, 34, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Benchmark Base MSP:       Rs 2,400 per quintal', 20, 156);
    doc.text(`Grade A FAQ Bonus:         +Rs 250 (Yield: ${report.gradeAPercent || 75}%)`, 20, 164);
    doc.text(`URS Defect Deduction:     -Rs ${Math.round((report.ursPercent || 25) * 25)} (URS: ${report.ursPercent || 25}%)`, 20, 172);

    doc.setFont('helvetica', 'bold');
    doc.text('Total Farmer Payout:', 110, 160);
    doc.setFontSize(13);
    doc.setTextColor(11, 115, 71);
    const payout = report.settlement?.totalFarmerPayout ?? 96000;
    doc.text(`Rs ${payout.toLocaleString()}`, 110, 170);

    // Section 4: Public Verification & QR
    doc.setTextColor(15, 26, 19);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Official Sign-Off & Public QR Verification', 14, 190);

    doc.roundedRect(14, 194, 182, 42, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Digital QR Verification Record:', 20, 204);
    doc.setTextColor(11, 115, 71);
    doc.text(`https://agrigrade.app/verify/${report.id}`, 20, 210);

    doc.setTextColor(15, 26, 19);
    doc.text('Certified by Mandi Inspector:', 20, 220);
    doc.setFont('helvetica', 'bold');
    doc.text(report.certifiedBy || 'Agrigrade AI Vision (Version 2.3)', 20, 226);

    // Reliable Cross-Browser & Iframe Download Mechanism
    const fileName = `${repNum}.pdf`;
    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 500);
      return true;
    } catch (blobErr) {
      doc.save(fileName);
      return true;
    }
  } catch (err) {
    console.error('generateReportPDF failed:', err);
    return false;
  }
}
