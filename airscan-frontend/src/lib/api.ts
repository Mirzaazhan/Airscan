import type { PredictRequest, PredictResponse, RiskLevel, CraniofacialMeasurement } from './types';
import { MEASURE_DEFINITIONS, estimatePixelScale } from './mediapipe';
import type { LandmarkPoint } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_MODEL === 'true';

function mockMeasurements(risk: RiskLevel): CraniofacialMeasurement[] {
  const bias = risk === 'green' ? 0 : risk === 'yellow' ? 0.10 : 0.18;
  return MEASURE_DEFINITIONS.map(m => {
    const deviation = (Math.random() * 2 - 1) * bias * m.refMm;
    const valueMm = Math.round(m.refMm + deviation + (Math.random() * 6 - 3));
    const diff = Math.abs(valueMm - m.refMm) / m.refMm;
    const flag: CraniofacialMeasurement['flag'] = diff > 0.14 ? 'high' : diff > 0.07 ? 'elevated' : 'normal';
    return { name: m.name, valueMm, refMm: m.refMm, norm: m.norm, significance: m.significance, flag };
  });
}

// Exported so scan/page can fall back to it if the API is unreachable
export function predictFallback(demographics: PredictRequest['demographics'], stopBang: PredictRequest['stopBang']): PredictResponse {
  return mockPredict({ demographics, stopBang, landmarks: { front: [], left: [], right: [] } });
}

function estimateMallampati(mouthLandmarks?: PredictRequest['landmarks']['mouth_open']): number {
  if (!mouthLandmarks || mouthLandmarks.length === 0) return 2; // Default
  const upperLip = mouthLandmarks.find(l => l.index === 13);
  const lowerLip = mouthLandmarks.find(l => l.index === 14);
  const menton = mouthLandmarks.find(l => l.index === 152);
  const nasion = mouthLandmarks.find(l => l.index === 168);

  if (!upperLip || !lowerLip || !menton || !nasion) return 2;

  const faceHeight = Math.abs(menton.y - nasion.y);
  const mouthOpening = Math.abs(lowerLip.y - upperLip.y);
  
  if (faceHeight < 0.01) return 2;

  const ratio = mouthOpening / faceHeight;
  
  // Heuristic: Large opening -> Class 1 or 2, Small -> Class 3 or 4
  if (ratio > 0.15) return 1;
  if (ratio > 0.11) return 2;
  if (ratio > 0.08) return 3;
  return 4;
  return 4;
}

function calculateAngle(A: LandmarkPoint, B: LandmarkPoint, C: LandmarkPoint): number {
  // Angle at A between AB and AC
  const vectorAB = { x: B.x - A.x, y: B.y - A.y };
  const vectorAC = { x: C.x - A.x, y: C.y - A.y };
  const dotProduct = vectorAB.x * vectorAC.x + vectorAB.y * vectorAC.y;
  const magAB = Math.sqrt(vectorAB.x * vectorAB.x + vectorAB.y * vectorAB.y);
  const magAC = Math.sqrt(vectorAC.x * vectorAC.x + vectorAC.y * vectorAC.y);
  if (magAB * magAC === 0) return 0;
  return Math.acos(dotProduct / (magAB * magAC)) * (180 / Math.PI);
}

function calculateArea(A: LandmarkPoint, B: LandmarkPoint, C: LandmarkPoint): number {
  return 0.5 * Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
}

function assessNasalRisk(
  nasalLandmarks: PredictRequest['landmarks']['nasal'], 
  gender: string
): PredictResponse['nasalAssessment'] | undefined {
  if (!nasalLandmarks || nasalLandmarks.length === 0) return undefined;
  
  // 4=Apex, 129=Right Alar Base (image left), 358=Left Alar Base (image right)
  // 98=Right Septal Base, 327=Left Septal Base
  const apex = nasalLandmarks.find(l => l.index === 4);
  const alarRight = nasalLandmarks.find(l => l.index === 129); // Patient's right
  const alarLeft = nasalLandmarks.find(l => l.index === 358);  // Patient's left
  const septalRight = nasalLandmarks.find(l => l.index === 98);
  const septalLeft = nasalLandmarks.find(l => l.index === 327);
  
  if (!apex || !alarRight || !alarLeft || !septalRight || !septalLeft) return undefined;

  // Pixel to MM scale. We need a reference width, let's assume a standard 640px video width for normalization if IPD isn't available
  // Or just use the estimatePixelScale which uses Iris points
  const scale = estimatePixelScale(nasalLandmarks, 640, 480) || 0.1; // Default fallback scale

  // 1. Nasal Aperture Width (Alar to Alar distance)
  const dx = (alarRight.x - alarLeft.x) * 640;
  const dy = (alarRight.y - alarLeft.y) * 480;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  const apertureWidthMm = pixelDist * scale;
  
  let apertureRisk: 'normal' | 'elevated' | 'high' = 'normal';
  if (gender.toLowerCase() === 'female') {
    if (apertureWidthMm < 30) apertureRisk = 'high';
    else if (apertureWidthMm < 33) apertureRisk = 'elevated';
  } else {
    // Male or default
    if (apertureWidthMm < 33) apertureRisk = 'high';
    else if (apertureWidthMm < 36) apertureRisk = 'elevated';
  }

  // 2. Internal Nasal Valve Angle (Angle at Apex between Septal Base and Alar Base)
  // Note: we can use normalized coordinates for angles as the aspect ratio (x vs y) is assumed square. 
  // But standard face mesh x is scaled by aspect ratio. Assuming 1:1 for simplicity or just passing as is.
  const angleRight = calculateAngle(apex, septalRight, alarRight);
  const angleLeft = calculateAngle(apex, septalLeft, alarLeft);
  
  const valveRisk = (angleRight < 10 || angleLeft < 10) ? 'high' : 'normal';

  // 3. Nostril Asymmetry (Area of larger / Area of smaller)
  const areaRight = calculateArea(apex, septalRight, alarRight);
  const areaLeft = calculateArea(apex, septalLeft, alarLeft);
  
  let asymmetryRatio = 1.0;
  if (areaRight > 0 && areaLeft > 0) {
    asymmetryRatio = Math.max(areaRight, areaLeft) / Math.min(areaRight, areaLeft);
  }
  
  let asymmetryRisk: 'normal' | 'elevated' | 'high' = 'normal';
  if (asymmetryRatio > 1.5) asymmetryRisk = 'high';
  else if (asymmetryRatio >= 1.3) asymmetryRisk = 'elevated';

  let overallRisk: 'low' | 'moderate' | 'high' = 'low';
  if (valveRisk === 'high' || asymmetryRisk === 'high' || apertureRisk === 'high') {
    overallRisk = 'high';
  } else if (asymmetryRisk === 'elevated' || apertureRisk === 'elevated') {
    overallRisk = 'moderate';
  }

  return {
    valveAngleLeft: angleLeft,
    valveAngleRight: angleRight,
    asymmetryRatio,
    apertureWidthMm,
    flags: {
      valve: valveRisk,
      asymmetry: asymmetryRisk,
      aperture: apertureRisk
    },
    overallRisk
  };
}

function mockPredict(req: PredictRequest): PredictResponse {
  const { weight, height, age } = req.demographics;
  const score = req.stopBang?.score ?? 0;
  
  const mallampatiScore = estimateMallampati(req.landmarks.mouth_open);
  const nasalAssessment = assessNasalRisk(req.landmarks.nasal, req.demographics.gender);
  
  const pct = score / 8;
  let risk: RiskLevel = pct >= 0.50 ? 'red' : pct >= 0.25 || age > 55 ? 'yellow' : 'green';
  
  // High Mallampati increases risk
  if (mallampatiScore >= 3 && risk === 'green') risk = 'yellow';
  if (mallampatiScore === 4 && risk === 'yellow') risk = 'red';

  // Nasal Assessment increases risk
  if (nasalAssessment?.overallRisk === 'high' && risk === 'green') risk = 'yellow';
  if (nasalAssessment?.overallRisk === 'high' && risk === 'yellow') risk = 'red';

  const confidence = Math.min(0.97, 0.72 + Math.random() * 0.22);
  const messages: Record<RiskLevel, string> = {
    green: 'Facial geometry analysis indicates low OSA risk markers. Recommend standard dental check-up.',
    yellow: 'Moderate risk indicators detected. Clinical evaluation by an ENT specialist is advised.',
    red: 'High-risk airway markers present. Urgent referral for polysomnography strongly recommended.',
  };
  return {
    risk, confidence,
    message: messages[risk],
    scan_id: Math.random().toString(36).slice(2, 12),
    measurements: mockMeasurements(risk),
    mallampatiScore,
    nasalAssessment,
  };
}

export async function predict(req: PredictRequest): Promise<PredictResponse> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 3500));
    return mockPredict(req);
  }
  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.statusText}`);
  return res.json();
}
