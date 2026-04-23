export type ScanAngle = 'front' | 'left' | 'right';
export type RiskLevel = 'green' | 'yellow' | 'red';
export type LandmarkGroup = 'Cranial' | 'Airway' | 'Jaw' | 'Oral' | 'Facial' | 'Orbital';

export interface LandmarkPoint {
  index: number;
  x: number;
  y: number;
  z: number;
}

export interface CapturedFrame {
  angle: ScanAngle;
  imageDataUrl: string;
  landmarks: LandmarkPoint[];
  yawAtCapture: number;
  capturedAt: string;
}

export interface Demographics {
  age: number;
  gender: string;
  weight: number;
  height: number;
  race: string;
  snoring?: string;
  oxygenCondition?: string;
  medicalHistory?: string;
}

// ── Craniofacial anthropometric landmark (from LMS definitions) ──
export interface AnthropometricLandmark {
  id: string;
  name: string;
  mediapipeIndex: number;
  relativePos: [number, number];
  position3d: [number, number, number];
  color: string;
  group: LandmarkGroup;
}

// ── Clinical measurement definition ──
export interface MeasureDefinition {
  name: string;
  from: string;  // landmark id
  to: string;    // landmark id
  refMm: number;
  norm: string;
  significance: string;
}

// ── Computed measurement result (included in PredictResponse) ──
export interface CraniofacialMeasurement {
  name: string;
  valueMm: number;
  refMm: number;
  norm: string;
  significance: string;
  flag: 'normal' | 'elevated' | 'high';
}

// ── Smart watch sleep data (ready for Fitbit/Garmin OAuth) ──
export interface SleepData {
  brand: string;
  ahi: number;
  spo2Min: number;
  spo2Avg: number;
  hrv: number;
  sleepEfficiency: number;
  snoringMinutes: number;
  totalHours: number;
  remPct: number;
  deepPct: number;
  lightPct: number;
  wakePct: number;
  breathingEvents: number;
  date: string;
}

export interface PredictRequest {
  demographics: Demographics;
  landmarks: {
    front: LandmarkPoint[];
    left: LandmarkPoint[];
    right: LandmarkPoint[];
  };
}

export interface PredictResponse {
  risk: RiskLevel;
  confidence: number;
  message: string;
  scan_id: string;
  measurements?: CraniofacialMeasurement[];
}

export interface ScanRecord {
  id: string;
  date: string;
  risk: RiskLevel;
  confidence: number;
  message: string;
  demographics: Demographics;
  measurements?: CraniofacialMeasurement[];
  sleepData?: SleepData;
  imageRefs?: { front: string; left: string; right: string };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  scanCount: number;
}
