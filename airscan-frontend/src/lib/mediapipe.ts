'use client';

import type { AnthropometricLandmark, MeasureDefinition } from './types';

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
export const KEY_LANDMARK_INDICES = ANTHROPOMETRIC_LANDMARKS.map(l => l.mediapipeIndex);

// Returns yaw in degrees. Negative = turned left. Positive = turned right.
export function estimateYaw(landmarks: Array<{ x: number; y: number; z: number }>): number {
  const nose       = landmarks[4];
  const leftCheek  = landmarks[234];
  const rightCheek = landmarks[454];
  if (!nose || !leftCheek || !rightCheek) return 0;
  const distLeft  = Math.abs(nose.x - leftCheek.x);
  const distRight = Math.abs(nose.x - rightCheek.x);
  const ratio = (distRight - distLeft) / (distRight + distLeft);
  return ratio * 90;
}

export function isInTargetZone(yaw: number, angle: 'front' | 'left' | 'right'): boolean {
  switch (angle) {
    case 'front': return yaw >= -10 && yaw <= 10;
    case 'left':  return yaw >= -55 && yaw <= -40;
    case 'right': return yaw >= 40  && yaw <= 55;
  }
}

let faceMeshInstance: unknown = null;

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

export function resetMediaPipe() { faceMeshInstance = null; }
