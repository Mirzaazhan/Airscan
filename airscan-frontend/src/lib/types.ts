export type ScanAngle = 'front' | 'left' | 'right' | 'mouth_open' | 'tongue_out' | 'tongue_rest' | 'neck' | 'nasal';
export type RiskLevel = 'green' | 'yellow' | 'red';
export type LandmarkGroup = 'Cranial' | 'Airway' | 'Jaw' | 'Oral' | 'Facial' | 'Orbital';
export type PatientType = 'adult' | 'paeds';

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
  neckMeasurement?: NeckMeasurement;
  fullLandmarks?: LandmarkPoint[];
  videoWidth?: number;
  videoHeight?: number;
}

export interface FaceMeshExport {
  landmarks: LandmarkPoint[];
  videoWidth: number;
  videoHeight: number;
  scaleMmPerPixel: number;
}

export interface NeckMeasurement {
  widthMm: number;
  circumferenceMm: number;
  scaleMmPerPixel: number;
}

export interface Demographics {
  age: number;
  gender: string;
  weight: number;
  height: number;
  race: string;
  patientType: PatientType;
}

export interface PaediatricSleepQuestionnaire {
  answers: ('yes' | 'no' | 'dont_know')[];
  numYes: number;
  numAnswered: number;
  score: number;
  positiveScreen: boolean;
}

export interface StopBang {
  snoring: boolean;
  tired: boolean;
  observed: boolean;
  pressure: boolean;
  bmi: boolean;
  age: boolean;
  neck: boolean;
  gender: boolean;
  score: number;
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
  unit?: string; // defaults to 'mm'; use '°' for angles, '%' for ratios
}

export interface NasalAssessment {
  valveAngleLeft: number;
  valveAngleRight: number;
  asymmetryRatio: number;
  apertureWidthMm: number;
  flags: {
    valve: 'normal' | 'high';
    asymmetry: 'normal' | 'elevated' | 'high';
    aperture: 'normal' | 'elevated' | 'high';
  };
  overallRisk: 'low' | 'moderate' | 'high';
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
  patientType: PatientType;
  stopBang?: StopBang;
  psq?: PaediatricSleepQuestionnaire;
  landmarks: {
    front: LandmarkPoint[];
    left: LandmarkPoint[];
    right: LandmarkPoint[];
    mouth_open?: LandmarkPoint[];
    tongue_out?: LandmarkPoint[];
    tongue_rest?: LandmarkPoint[];
    neck?: LandmarkPoint[];
    nasal?: LandmarkPoint[];
  };
}

export interface PredictResponse {
  risk: RiskLevel;
  confidence: number;
  message: string;
  scan_id: string;
  measurements?: CraniofacialMeasurement[];
  neckMeasurement?: NeckMeasurement;
  mallampatiScore?: number;
  nasalAssessment?: NasalAssessment;
  faceMesh?: FaceMeshExport;
}

export interface ScanRecord {
  id: string;
  date: string;
  risk: RiskLevel;
  confidence: number;
  message: string;
  demographics: Demographics;
  patientType?: PatientType;
  stopBang?: StopBang;
  psq?: PaediatricSleepQuestionnaire;
  measurements?: CraniofacialMeasurement[];
  neckMeasurement?: NeckMeasurement;
  nasalAssessment?: NasalAssessment;
  sleepData?: SleepData;
  imageRefs?: { front: string; left: string; right: string; mouth_open?: string; tongue_out?: string; tongue_rest?: string; neck?: string; nasal?: string };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  scanCount: number;
  role?: 'admin' | 'user';
  lastLoginAt?: number;
}
