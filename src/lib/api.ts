import type { PredictRequest, PredictResponse, RiskLevel } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_MODEL === 'true';

function mockPredict(req: PredictRequest): PredictResponse {
  const { weight, height, age } = req.demographics;
  const bmi = weight / Math.pow(height / 100, 2);
  const risk: RiskLevel = bmi > 30 ? 'red' : bmi > 26 || age > 55 ? 'yellow' : 'green';
  const confidence = 0.72 + Math.random() * 0.22;
  const messages: Record<RiskLevel, string> = {
    green: 'Your airway structure appears normal based on the captured landmarks and demographic profile.',
    yellow: 'A potential concern has been detected. Please consult a doctor for further evaluation.',
    red: 'A significant concern was detected. Please seek medical advice promptly.',
  };
  return {
    risk,
    confidence,
    message: messages[risk],
    scan_id: Math.random().toString(36).slice(2, 12),
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
