export type ScanAngle = 'front' | 'left' | 'right';
export type RiskLevel = 'green' | 'yellow' | 'red';

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
}

export interface ScanRecord {
  id: string;
  date: string;
  risk: RiskLevel;
  confidence: number;
  message: string;
  demographics: Demographics;
  imageRefs?: { front: string; left: string; right: string };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  scanCount: number;
}
