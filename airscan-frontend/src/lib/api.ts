import type { PredictRequest, PredictResponse, RiskLevel, CraniofacialMeasurement } from './types';
import { MEASURE_DEFINITIONS } from './mediapipe';

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

function mockPredict(req: PredictRequest): PredictResponse {
  const { weight, height, age, snoring, gender, medicalHistory } = req.demographics;
  const bmi = weight / Math.pow(height / 100, 2);

  let score = 0;
  if (bmi >= 30) score += 3; else if (bmi >= 25) score += 1;
  if (snoring?.toLowerCase().includes('every')) score += 4;
  else if (snoring?.toLowerCase().includes('sometimes')) score += 2;
  else if (snoring?.toLowerCase().includes('rarely')) score += 1;
  if (gender?.toLowerCase() === 'male') score += 1;
  if (medicalHistory && !medicalHistory.toLowerCase().includes('none')) score += 1;
  const pct = score / 9;

  const risk: RiskLevel = pct >= 0.50 ? 'red' : pct >= 0.22 || age > 55 ? 'yellow' : 'green';
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
