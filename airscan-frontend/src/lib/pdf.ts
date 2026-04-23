import type { RiskLevel, Demographics, CraniofacialMeasurement } from './types';

interface PDFData {
  scanId: string;
  date: string;
  risk: RiskLevel;
  confidence: number;
  message: string;
  demographics: Demographics;
  measurements?: CraniofacialMeasurement[];
}

const RISK_RGB: Record<RiskLevel, [number, number, number]> = {
  green:  [0, 180, 140],
  yellow: [220, 140, 50],
  red:    [220, 60, 60],
};
const RISK_LABEL: Record<RiskLevel, string> = {
  green: 'Low Risk', yellow: 'Moderate Risk', red: 'High Risk',
};

export async function downloadPDF(data: PDFData): Promise<void> {
  const jspdfModule = await import('jspdf');
  const doc = new jspdfModule.jsPDF('p', 'mm', 'a4');
  const W = 210, M = 16, CW = 178;
  const [rr, rg, rb] = RISK_RGB[data.risk];

  function header(subtitle: string) {
    doc.setFillColor(10, 22, 40);
    doc.rect(0, 0, W, 40, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 201, 167);
    doc.text('AIRSCAN', M, 21);
    doc.setFontSize(8);
    doc.setTextColor(100, 140, 180);
    doc.text(`by Morlytics  |  ${subtitle}`, M, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 200, 230);
    doc.text(data.date, W - M, 21, { align: 'right' });
    doc.text(`ID: ${data.scanId}`, W - M, 30, { align: 'right' });
  }

  function section(title: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(10, 22, 40);
    doc.text(title, M, y);
    doc.setDrawColor(0, 201, 167);
    doc.setLineWidth(0.5);
    doc.line(M, y + 3, M + CW, y + 3);
    return y + 10;
  }

  // ── PAGE 1: Patient summary + risk ──────────────────────────
  header('OSA Screening Report');
  let Y = 50;

  Y = section('Patient Information', Y);
  const d = data.demographics;
  const bmi = (d.weight / Math.pow(d.height / 100, 2)).toFixed(1);
  const rows: [string, string, string, string][] = [
    ['Gender:', d.gender, 'Age:', `${d.age} years`],
    ['Height / Weight:', `${d.height} cm / ${d.weight} kg`, 'BMI:', bmi],
    ['Ethnicity:', d.race, 'Snoring:', d.snoring ?? 'Not specified'],
    ['Medical Hx:', d.medicalHistory ?? 'None', 'O2 Condition:', d.oxygenCondition ?? 'Normal'],
  ];
  doc.setFontSize(9);
  rows.forEach(r => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 80, 100); doc.text(r[0], M, Y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 35, 55); doc.text(r[1], M + 30, Y);
    if (r[2]) { doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 80, 100); doc.text(r[2], M + CW / 2, Y); }
    if (r[3]) { doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 35, 55); doc.text(r[3], M + CW / 2 + 28, Y); }
    Y += 6;
  });

  Y += 4;
  Y = section('OSA Risk Assessment', Y);

  // Risk badge box
  doc.setFillColor(Math.min(255, rr + 200), Math.min(255, rg + 200), Math.min(255, rb + 200));
  doc.rect(M, Y, CW, 26, 'F');
  doc.setDrawColor(rr, rg, rb); doc.setLineWidth(0.8); doc.rect(M, Y, CW, 26, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(rr, rg, rb);
  doc.text(RISK_LABEL[data.risk], M + CW / 2, Y + 11, { align: 'center' });
  const descLines = doc.splitTextToSize(data.message, CW - 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text(descLines, M + 4, Y + 19);
  Y += 33;

  // Metric tiles
  const tiles = [
    ['Confidence', `${Math.round(data.confidence * 100)}%`],
    ['Risk Level', RISK_LABEL[data.risk]],
    ['Landmarks', '16'],
    ['Scan Angles', '3'],
  ];
  const tW = CW / 4;
  tiles.forEach(([label, val], i) => {
    const tx = M + i * tW;
    doc.setFillColor(235, 245, 255); doc.rect(tx, Y, tW - 2, 16, 'F');
    doc.setDrawColor(190, 215, 240); doc.setLineWidth(0.25); doc.rect(tx, Y, tW - 2, 16, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 22, 40);
    doc.text(val, tx + tW / 2 - 1, Y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(90, 115, 140);
    doc.text(label, tx + tW / 2 - 1, Y + 13, { align: 'center' });
  });
  Y += 23;

  // Disclaimer
  doc.setFillColor(240, 250, 245); doc.rect(M, Y, CW, 16, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(0, 140, 100);
  doc.text('Disclaimer:', M + 3, Y + 6);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 70, 60);
  const disc = doc.splitTextToSize('AirScan is a screening tool only — not a clinical diagnosis. Results must be reviewed by a qualified medical practitioner before any clinical decision is made.', CW - 26);
  doc.text(disc, M + 22, Y + 6);

  // ── PAGE 2: Craniofacial measurements ───────────────────────
  if (data.measurements && data.measurements.length > 0) {
    doc.addPage();
    header('Craniofacial Measurements');
    Y = 50;
    Y = section('Anthropometric Measurements', Y);

    // Table header
    doc.setFillColor(220, 235, 250);
    doc.rect(M, Y, CW, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 55, 90);
    doc.text('Measurement', M + 2, Y + 5.5);
    doc.text('Value', M + 78, Y + 5.5);
    doc.text('Norm (mm)', M + 98, Y + 5.5);
    doc.text('Flag', M + 128, Y + 5.5);
    Y += 10;

    data.measurements.forEach((m, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 252, 255); doc.rect(M, Y - 1, CW, 8, 'F'); }
      const fc: [number, number, number] = m.flag === 'high' ? [200, 50, 50] : m.flag === 'elevated' ? [200, 130, 30] : [0, 150, 100];
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 45, 65);
      doc.text(m.name, M + 2, Y + 4);
      doc.setFont('helvetica', 'bold'); doc.text(`${m.valueMm} mm`, M + 78, Y + 4);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 100, 120); doc.text(m.norm, M + 98, Y + 4);
      doc.setTextColor(...fc); doc.text(m.flag.toUpperCase(), M + 128, Y + 4);
      Y += 8;
    });

    Y += 4;
    Y = section('Clinical Significance', Y);
    doc.setFontSize(8);
    data.measurements.forEach(m => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 55, 90); doc.text(`${m.name}:`, M, Y + 3);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 80, 95);
      const lines = doc.splitTextToSize(m.significance, CW - 50);
      doc.text(lines, M + 48, Y + 3);
      Y += 7;
    });

    Y += 4;
    doc.setFillColor(230, 248, 240); doc.rect(M, Y, CW, 14, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(0, 130, 100);
    doc.text('Clinical note:', M + 3, Y + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 70, 60);
    doc.text('Bigonial/bizygomatic ratio < 0.68 and lower face ratio > 0.60 are established OSA structural predictors.', M + 30, Y + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 100, 90);
    doc.text('Mandibular length is the strongest single anatomical OSA predictor in craniofacial analysis.', M + 3, Y + 11);
  }

  doc.save(`AIRSCAN-Report-${data.scanId.slice(0, 8)}.pdf`);
}
