'use client';

import type { AnthropometricLandmark, MeasureDefinition, ScanAngle } from './types';

// ── 16 anthropometric landmarks mapped to MediaPipe FaceMesh indices ──
// MediaPipe indices are approximate — confirm final list with Dr. Iqmal / Prof. Alfah
export const ANTHROPOMETRIC_LANDMARKS: AnthropometricLandmark[] = [
  { id: 'Tr',   name: 'Trichion',      mediapipeIndex: 10,  relativePos: [0.50, 0.04], position3d: [0,     1.18,  0.08], color: '#00c9a7', group: 'Cranial'  },
  { id: 'G',    name: 'Glabella',      mediapipeIndex: 9,   relativePos: [0.50, 0.21], position3d: [0,     0.68,  0.88], color: '#00c9a7', group: 'Cranial'  },
  { id: 'N',    name: 'Nasion',        mediapipeIndex: 168, relativePos: [0.50, 0.28], position3d: [0,     0.44,  0.92], color: '#ffa94d', group: 'Airway'   },
  { id: 'Rh',   name: 'Rhinion',       mediapipeIndex: 6,   relativePos: [0.50, 0.40], position3d: [0,     0.04,  1.08], color: '#ffa94d', group: 'Airway'   },
  { id: 'Sn',   name: 'Subnasale',     mediapipeIndex: 4,   relativePos: [0.50, 0.50], position3d: [0,    -0.22,  1.02], color: '#ffa94d', group: 'Airway'   },
  { id: 'Ls',   name: 'Labiale Sup',   mediapipeIndex: 13,  relativePos: [0.50, 0.57], position3d: [0,    -0.38,  0.98], color: '#60a5fa', group: 'Oral'     },
  { id: 'Li',   name: 'Labiale Inf',   mediapipeIndex: 14,  relativePos: [0.50, 0.63], position3d: [0,    -0.52,  0.95], color: '#60a5fa', group: 'Oral'     },
  { id: 'B',    name: 'B-point',       mediapipeIndex: 17,  relativePos: [0.50, 0.68], position3d: [0,    -0.64,  0.90], color: '#ff5c5c', group: 'Jaw'      },
  { id: 'Pog',  name: 'Pogonion',      mediapipeIndex: 199, relativePos: [0.50, 0.76], position3d: [0,    -0.80,  0.88], color: '#ff5c5c', group: 'Jaw'      },
  { id: 'Me',   name: 'Menton',        mediapipeIndex: 152, relativePos: [0.50, 0.85], position3d: [0,    -1.10,  0.48], color: '#ff5c5c', group: 'Jaw'      },
  { id: 'Go-L', name: 'Gonion L',      mediapipeIndex: 172, relativePos: [0.20, 0.73], position3d: [-0.70, -0.80, 0.30], color: '#ff5c5c', group: 'Jaw'      },
  { id: 'Go-R', name: 'Gonion R',      mediapipeIndex: 397, relativePos: [0.80, 0.73], position3d: [ 0.70, -0.80, 0.30], color: '#ff5c5c', group: 'Jaw'      },
  { id: 'Zy-L', name: 'Zygion L',      mediapipeIndex: 234, relativePos: [0.07, 0.38], position3d: [-1.10,  0.10, 0.22], color: '#c084fc', group: 'Facial'   },
  { id: 'Zy-R', name: 'Zygion R',      mediapipeIndex: 454, relativePos: [0.93, 0.38], position3d: [ 1.10,  0.10, 0.22], color: '#c084fc', group: 'Facial'   },
  { id: 'Or-L', name: 'Orbitale L',    mediapipeIndex: 253, relativePos: [0.30, 0.32], position3d: [-0.48,  0.32, 0.86], color: '#60a5fa', group: 'Orbital'  },
  { id: 'Or-R', name: 'Orbitale R',    mediapipeIndex: 23,  relativePos: [0.70, 0.32], position3d: [ 0.48,  0.32, 0.86], color: '#60a5fa', group: 'Orbital'  },
];

// ── 6 clinical craniofacial measurements ──
export const MEASURE_DEFINITIONS: MeasureDefinition[] = [
  { name: 'Total Facial Height', from: 'Tr',   to: 'Me',   refMm: 120, norm: '115–130', significance: 'Shorter height combined with retrognathia increases OSA severity' },
  { name: 'Lower Face Height',   from: 'Sn',   to: 'Me',   refMm: 68,  norm: '60–75',   significance: 'Elongated lower face (vertical pattern) is a high OSA risk marker' },
  { name: 'Bizygomatic Width',   from: 'Zy-L', to: 'Zy-R', refMm: 140, norm: '130–150', significance: 'Reference baseline for all craniofacial proportions' },
  { name: 'Bigonial Width',      from: 'Go-L', to: 'Go-R', refMm: 102, norm: '95–115',  significance: 'Narrow jaw causes tongue crowding and airway collapse during sleep' },
  { name: 'Mandibular Length',   from: 'Go-L', to: 'Me',   refMm: 84,  norm: '78–95',   significance: 'Short mandible is the #1 anatomical OSA structural predictor' },
  { name: 'Midface Height',      from: 'N',    to: 'Sn',   refMm: 52,  norm: '48–60',   significance: 'Midface deficiency is linked to nasal obstruction and OSA' },
];

// ── Legacy KEY_LANDMARK_INDICES for backward compat (MediaPipe indices of the 16 landmarks) ──
export const KEY_LANDMARK_INDICES = Array.from(new Set([
  ...ANTHROPOMETRIC_LANDMARKS.map(l => l.mediapipeIndex),
  129, 358, 98, 327, // Nasal Assessment (4 is already in ANTHROPOMETRIC_LANDMARKS)
  469, 471, 474, 476 // Iris scaling
]));

// Returns yaw as a ratio in [-1, +1].
// Negative = face turned left (nose closer to left face boundary).
// Positive = face turned right (nose closer to right face boundary).
export function estimateYaw(landmarks: Array<{ x: number; y: number; z: number }>): number {
  const nose      = landmarks[1];    // nose tip — more forward-stable than index 4
  const leftEdge  = landmarks[234];
  const rightEdge = landmarks[454];
  if (!nose || !leftEdge || !rightEdge) return 0;

  const distLeft  = nose.x - leftEdge.x;
  const distRight = rightEdge.x - nose.x;
  const total = distLeft + distRight;
  if (total < 0.05) return 0;

  return (distRight - distLeft) / total;
}

// Target zones in the [-1, +1] yaw scale.
// Left/right are open-ended so users just need to turn far enough — no narrow window to hit.
export const YAW_ZONES: Record<ScanAngle, [number, number]> = {
  front: [-0.15,  0.15],
  left:  [-5.0,  -0.18],
  right: [ 0.18,  5.0],
  mouth_open: [-0.15, 0.15],
  tongue_out: [-0.15, 0.15],
  tongue_rest: [-0.15, 0.15],
  neck: [-0.15, 0.15],
  nasal: [-0.15, 0.15]
};

export function isInTargetZone(yaw: number, angle: ScanAngle): boolean {
  const [lo, hi] = YAW_ZONES[angle];
  return yaw >= lo && yaw <= hi;
}

export function isMouthOpen(landmarks: Array<{ x: number; y: number; z: number }>): boolean {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const menton = landmarks[152];
  const nasion = landmarks[168];
  
  if (!upperLip || !lowerLip || !menton || !nasion) return false;
  
  const faceHeight = Math.abs(menton.y - nasion.y);
  if (faceHeight < 0.01) return false;
  
  const mouthOpening = Math.abs(lowerLip.y - upperLip.y);
  // An opening of > 4% of the face height indicates the mouth is intentionally open
  return (mouthOpening / faceHeight) > 0.04; 
}

let faceMeshInstance: unknown = null;
let poseInstance: unknown = null;

// Estimate pixel-to-mm scale using the average iris diameter = ~11.7mm.
// FaceMesh left iris: right(469) to left(471)
// FaceMesh right iris: right(474) to left(476)
export function estimatePixelScale(landmarks: Array<any>, videoWidth: number, videoHeight: number): number {
  const getPt = (idx: number) => {
    if (landmarks.length < 100 && landmarks[0] && 'index' in landmarks[0]) {
      return landmarks.find((l: any) => l.index === idx);
    }
    return landmarks[idx];
  };

  const leftIrisRight = getPt(469);
  const leftIrisLeft = getPt(471);
  const rightIrisRight = getPt(474);
  const rightIrisLeft = getPt(476);
  if (!leftIrisRight || !leftIrisLeft || !rightIrisRight || !rightIrisLeft) return 0;
  
  const dxLeft = (leftIrisRight.x - leftIrisLeft.x) * videoWidth;
  const dyLeft = (leftIrisRight.y - leftIrisLeft.y) * videoHeight;
  const diamLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);
  
  const dxRight = (rightIrisRight.x - rightIrisLeft.x) * videoWidth;
  const dyRight = (rightIrisRight.y - rightIrisLeft.y) * videoHeight;
  const diamRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);
  
  const avgDiam = (diamLeft + diamRight) / 2;
  if (avgDiam < 1) return 0;
  
  return 11.7 / avgDiam; // mm per pixel
}

export function estimateNeckMeasurement(
  faceLandmarks: Array<{ x: number; y: number; z: number }>,
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null,
  videoWidth: number,
  videoHeight: number
): { widthMm: number; circumferenceMm: number; scaleMmPerPixel: number; shouldersVisible: boolean } | null {
  const scale = estimatePixelScale(faceLandmarks, videoWidth, videoHeight);
  if (!scale) return null;

  let shouldersVisible = false;
  if (poseLandmarks && poseLandmarks[11] && poseLandmarks[12]) {
    // Check if both left (11) and right (12) shoulders are visible in frame
    const v11 = poseLandmarks[11].visibility ?? 0;
    const v12 = poseLandmarks[12].visibility ?? 0;
    if (v11 > 0.5 && v12 > 0.5) {
      shouldersVisible = true;
    }
  }

  // Use Bigonial Width (Jaw width, Gonion L 172 to Gonion R 397) as a proxy/baseline for neck width.
  // Neck is typically ~90-95% of the jaw width in a straight-on profile.
  const goL = faceLandmarks[172];
  const goR = faceLandmarks[397];
  if (!goL || !goR) return null;

  const dx = (goR.x - goL.x) * videoWidth;
  const dy = (goR.y - goL.y) * videoHeight;
  const jawPixelWidth = Math.sqrt(dx * dx + dy * dy);
  
  const neckPixelWidth = jawPixelWidth * 0.92;
  const widthMm = neckPixelWidth * scale;
  
  // Approximate circumference of a cylinder (C = pi * d)
  const circumferenceMm = widthMm * Math.PI;

  return { widthMm, circumferenceMm, scaleMmPerPixel: scale, shouldersVisible };
}

export async function initMediaPipe(onResults: (results: unknown) => void) {
  if (typeof window === 'undefined') return null;
  if (faceMeshInstance) {
    (faceMeshInstance as { onResults: (cb: (r: unknown) => void) => void }).onResults(onResults);
    return faceMeshInstance;
  }
  const { FaceMesh } = await import('@mediapipe/face_mesh');
  const faceMesh = new FaceMesh({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
  faceMesh.onResults(onResults);
  await faceMesh.initialize();
  faceMeshInstance = faceMesh;
  return faceMesh;
}

export function resetMediaPipe() { 
  faceMeshInstance = null; 
  poseInstance = null;
}

export async function initPose(onResults: (results: unknown) => void) {
  if (typeof window === 'undefined') return null;
  if (poseInstance) {
    (poseInstance as { onResults: (cb: (r: unknown) => void) => void }).onResults(onResults);
    return poseInstance;
  }
  const { Pose } = await import('@mediapipe/pose');
  const pose = new Pose({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
  pose.onResults(onResults);
  await pose.initialize();
  poseInstance = pose;
  return pose;
}
