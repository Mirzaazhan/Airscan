import type { PredictRequest, PredictResponse, RiskLevel, CraniofacialMeasurement } from './types';
import { MEASURE_DEFINITIONS, ANTHROPOMETRIC_LANDMARKS, estimatePixelScale } from './mediapipe';
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

function computeCraniofacialMeasurements(frontLandmarks: LandmarkPoint[]): CraniofacialMeasurement[] | null {
  if (!frontLandmarks || frontLandmarks.length === 0) return null;
  const scale = estimatePixelScale(frontLandmarks, 640, 480);
  if (!scale) return null;

  const idToIdx = new Map<string, number>(ANTHROPOMETRIC_LANDMARKS.map(l => [l.id, l.mediapipeIndex]));
  const getPt = (id: string) => {
    const idx = idToIdx.get(id);
    return idx !== undefined ? frontLandmarks.find(l => l.index === idx) : undefined;
  };

  return MEASURE_DEFINITIONS.map(m => {
    const from = getPt(m.from);
    const to = getPt(m.to);
    if (!from || !to) return { name: m.name, valueMm: m.refMm, refMm: m.refMm, norm: m.norm, significance: m.significance, flag: 'normal' as const };
    const dx = (to.x - from.x) * 640;
    const dy = (to.y - from.y) * 480;
    const valueMm = Math.round(Math.sqrt(dx * dx + dy * dy) * scale);
    const diff = Math.abs(valueMm - m.refMm) / m.refMm;
    const flag: CraniofacialMeasurement['flag'] = diff > 0.14 ? 'high' : diff > 0.07 ? 'elevated' : 'normal';
    return { name: m.name, valueMm, refMm: m.refMm, norm: m.norm, significance: m.significance, flag };
  });
}

// Exported so scan/page can fall back to it if the API is unreachable
export function predictFallback(
  demographics: PredictRequest['demographics'],
  stopBang: PredictRequest['stopBang'],
  landmarks: PredictRequest['landmarks'] = { front: [], left: [], right: [] },
  psq?: PredictRequest['psq']
): PredictResponse {
  return mockPredict({ demographics, patientType: demographics.patientType, stopBang, psq, landmarks });
}

// ── Profile analysis: chin projection + facial convexity from a side-profile capture ──
function computeProfileMeasurements(
  profileLandmarks: LandmarkPoint[],
  frontScale: number
): CraniofacialMeasurement[] {
  if (!profileLandmarks.length || !frontScale) return [];
  const get = (idx: number) => profileLandmarks.find(l => l.index === idx);
  const glabella  = get(9);
  const subnasale = get(4);
  const pogonion  = get(199);
  const menton    = get(152);
  const nasion    = get(168);
  if (!subnasale || !pogonion || !nasion || !menton) return [];

  // Detect profile direction: nose (1) closer to left edge (234) = left profile
  const nose = get(1); const zyL = get(234); const zyR = get(454);
  const isLeft = nose && zyL && zyR ? (nose.x - zyL.x) < (zyR.x - nose.x) : true;

  const results: CraniofacialMeasurement[] = [];
  const faceHeightPx = Math.abs(menton.y - nasion.y) * 480;

  if (faceHeightPx > 20) {
    // Left profile: face points left, lower x = more anterior
    // Right profile: face points right, higher x = more anterior
    const chinOffsetPx = isLeft
      ? (subnasale.x - pogonion.x) * 640
      : (pogonion.x - subnasale.x) * 640;
    const chinMm = Math.round(chinOffsetPx * frontScale);
    results.push({
      name: 'Chin Projection',
      valueMm: chinMm,
      refMm: 5,
      norm: '3–8 mm',
      significance: 'Chin recession (retrognathia) is the #1 structural OSA predictor; narrows the posterior pharyngeal airway',
      flag: chinMm < 0 ? 'high' : chinMm < 3 ? 'elevated' : 'normal',
    });
  }

  if (glabella) {
    // Scale to pixels for accurate angle (corrects 4:3 aspect ratio distortion)
    const px = (l: LandmarkPoint) => ({ ...l, x: l.x * 640, y: l.y * 480 });
    const angle = Math.round(calculateAngle(px(subnasale), px(glabella), px(pogonion)));
    results.push({
      name: 'Facial Convexity',
      valueMm: angle,
      refMm: 168,
      norm: '163–175°',
      significance: 'Convex facial profile (chin behind nose line) indicates mandibular retrognathia and posterior airway narrowing',
      flag: angle < 155 ? 'high' : angle < 163 ? 'elevated' : 'normal',
      unit: '°',
    });
  }

  return results;
}

// ── Maxillary constriction index: nasal width / bizygomatic width ──
function computeMaxillaryConstriction(
  frontLandmarks: LandmarkPoint[],
  frontScale: number
): CraniofacialMeasurement | null {
  const alarL = frontLandmarks.find(l => l.index === 358);
  const alarR = frontLandmarks.find(l => l.index === 129);
  const zyL   = frontLandmarks.find(l => l.index === 234);
  const zyR   = frontLandmarks.find(l => l.index === 454);
  if (!alarL || !alarR || !zyL || !zyR) return null;

  const dist = (a: LandmarkPoint, b: LandmarkPoint) =>
    Math.sqrt(Math.pow((b.x - a.x) * 640, 2) + Math.pow((b.y - a.y) * 480, 2));

  const nasalPx = dist(alarL, alarR);
  const bizygoPx = dist(zyL, zyR);
  if (bizygoPx < 10) return null;

  const index = Math.round((nasalPx / bizygoPx) * 100);
  return {
    name: 'Maxillary Width Index',
    valueMm: index,
    refMm: 18,
    norm: '16–20',
    significance: 'Low maxillary width index indicates maxillary constriction; linked to nasal obstruction and increased OSA risk',
    flag: index < 14 ? 'high' : index < 16 ? 'elevated' : 'normal',
    unit: '%',
  };
}

// ── Resting lip gap from tongue_rest capture (mouth breathing indicator) ──
function computeRestingLipGap(
  tongueRestLandmarks: LandmarkPoint[],
  frontScale: number
): CraniofacialMeasurement | null {
  if (!tongueRestLandmarks.length || !frontScale) return null;
  const upper = tongueRestLandmarks.find(l => l.index === 13);
  const lower = tongueRestLandmarks.find(l => l.index === 14);
  if (!upper || !lower) return null;
  const gapMm = Math.round(Math.abs(lower.y - upper.y) * 480 * frontScale);
  return {
    name: 'Resting Lip Gap',
    valueMm: gapMm,
    refMm: 1,
    norm: '0–2 mm',
    significance: 'Open mouth at rest indicates lip incompetence and potential mouth breathing; associated with nasal obstruction and OSA',
    flag: gapMm > 5 ? 'high' : gapMm > 2 ? 'elevated' : 'normal',
  };
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
  const { age, weight, height } = req.demographics;
  const bmi = weight / Math.pow(height / 100, 2);
  const isPaeds = req.patientType === 'paeds';

  // ── Compute all image measurements (shared for both types) ──
  const mallampatiScore = estimateMallampati(req.landmarks.mouth_open);
  const nasalAssessment = assessNasalRisk(req.landmarks.nasal, req.demographics.gender);
  const frontScale = estimatePixelScale(req.landmarks.front, 640, 480);

  const frontMeasurements = computeCraniofacialMeasurements(req.landmarks.front) ?? mockMeasurements('yellow');

  const profileLandmarks = (req.landmarks.left?.length ? req.landmarks.left : req.landmarks.right) ?? [];
  const profileMeasurements = frontScale ? computeProfileMeasurements(profileLandmarks, frontScale) : [];

  const maxConstr = frontScale ? computeMaxillaryConstriction(req.landmarks.front, frontScale) : null;
  const lipGap    = frontScale ? computeRestingLipGap(req.landmarks.tongue_rest ?? [], frontScale) : null;

  // ── Extract key ratios for scoring ──
  const mMap       = new Map(frontMeasurements.map(m => [m.name, m.valueMm]));
  const bizygo     = mMap.get('Bizygomatic Width');
  const bigon      = mMap.get('Bigonial Width');
  const totH       = mMap.get('Total Facial Height');
  const lowH       = mMap.get('Lower Face Height');
  const jawRatio   = bizygo && bigon ? bigon / bizygo : undefined;
  const lfRatio    = lowH && totH   ? lowH / totH   : undefined;
  const chinMm     = profileMeasurements.find(m => m.name === 'Chin Projection')?.valueMm;
  const convexDeg  = profileMeasurements.find(m => m.name === 'Facial Convexity')?.valueMm;
  const maxIdx     = maxConstr?.valueMm;
  const lipGapMm   = lipGap?.valueMm ?? 0;

  // ── Module A: Image score (weighted average of each feature, 0–1) ──
  let aSum = 0; let aN = 0;
  const a = (v: number) => { aSum += v; aN++; };

  a((mallampatiScore - 1) / 3);
  if (jawRatio   !== undefined) a(jawRatio < 0.65 ? 0.9 : jawRatio < 0.70 ? 0.5 : 0.1);
  if (lfRatio    !== undefined) a(lfRatio  > 0.65 ? 0.9 : lfRatio  > 0.60 ? 0.5 : 0.1);
  if (chinMm     !== undefined) a(chinMm   < 0    ? 0.9 : chinMm   < 3    ? 0.5 : 0.1);
  if (convexDeg  !== undefined) a(convexDeg < 155 ? 0.9 : convexDeg < 163 ? 0.5 : 0.1);
  if (nasalAssessment) a(nasalAssessment.overallRisk === 'high' ? 0.9 : nasalAssessment.overallRisk === 'moderate' ? 0.5 : 0.1);
  if (maxIdx     !== undefined) a(maxIdx   < 14   ? 0.9 : maxIdx   < 16   ? 0.5 : 0.1);
  if (lipGapMm   >  0)         a(lipGapMm  > 5   ? 0.9 : lipGapMm  > 2   ? 0.5 : 0.1);

  const imageScore = aN > 0 ? aSum / aN : 0.30;

  let questionnaireScore: number;
  let clinicalScore: number;
  let risk: RiskLevel;

  if (isPaeds) {
    // ── Module B (Paeds): PSQ score (already 0–1, score = yes / (yes+no)) ──
    questionnaireScore = req.psq?.score ?? 0;

    // ── Module C (Paeds): overweight flag from PSQ Q16, no neck threshold ──
    const overweight = req.psq?.answers[15] === 'yes';
    clinicalScore = overweight ? 0.9 : bmi > 25 ? 0.5 : 0.1;

    const fs = imageScore * 0.45 + questionnaireScore * 0.35 + clinicalScore * 0.20;
    risk = fs >= 0.55 ? 'red' : fs >= 0.30 ? 'yellow' : 'green';
  } else {
    // ── Module B (Adult): STOP-BANG score / 8 ──
    questionnaireScore = (req.stopBang?.score ?? 0) / 8;

    // ── Module C (Adult): BMI + neck circumference ──
    const bmiScore  = bmi > 35 ? 1.0 : bmi > 30 ? 0.6 : bmi > 25 ? 0.3 : 0.1;
    const neckScore = (req.stopBang?.neck ?? false) ? 0.9 : 0.1;
    clinicalScore = bmiScore * 0.6 + neckScore * 0.4;

    const fs = imageScore * 0.45 + questionnaireScore * 0.35 + clinicalScore * 0.20;
    risk = fs >= 0.55 ? 'red' : fs >= 0.30 ? 'yellow' : 'green';
    if (age > 55 && risk === 'green') risk = 'yellow';
  }

  const finalScore = imageScore * 0.45 + questionnaireScore * 0.35 + clinicalScore * 0.20;
  const confidence = Math.min(0.97, 0.65 + finalScore * 0.20 + (frontScale ? 0.08 : 0) + Math.random() * 0.04);

  const adultMessages: Record<RiskLevel, string> = {
    green:  'Facial geometry analysis indicates low OSA risk markers. Recommend standard dental check-up.',
    yellow: 'Moderate risk indicators detected. Clinical evaluation by an ENT specialist is advised.',
    red:    'High-risk airway markers present. Urgent referral for polysomnography strongly recommended.',
  };
  const paedsMessages: Record<RiskLevel, string> = {
    green:  'No significant markers of sleep-disordered breathing detected. Routine follow-up recommended.',
    yellow: 'Moderate indicators of sleep-disordered breathing detected. Paediatric ENT evaluation is advised.',
    red:    'High-risk markers for paediatric sleep-disordered breathing present. Prompt referral to a paediatric sleep specialist is strongly recommended.',
  };

  return {
    risk, confidence,
    message: (isPaeds ? paedsMessages : adultMessages)[risk],
    scan_id: Math.random().toString(36).slice(2, 12),
    measurements: [
      ...frontMeasurements,
      ...profileMeasurements,
      ...(maxConstr ? [maxConstr] : []),
      ...(lipGap    ? [lipGap]    : []),
    ],
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
