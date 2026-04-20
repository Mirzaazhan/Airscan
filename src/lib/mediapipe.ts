'use client';

// PLACEHOLDER — confirm final list with Dr. Iqmal before production
export const KEY_LANDMARK_INDICES = [
  4,    // Nose tip         — midface reference
  6,    // Nose bridge      — upper face axis
  33,   // Left eye corner  — orbital width
  263,  // Right eye corner — orbital width
  234,  // Left cheekbone   — facial width
  454,  // Right cheekbone  — facial width
  152,  // Chin             — lower jaw length
  0,    // Upper lip        — midface height
  172,  // Left jaw         — jaw width
  397,  // Right jaw        — jaw width
  10,   // Forehead centre  — face height top
  168,  // Mid nose         — nose bridge depth
];

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

  // Return cached instance if already initialised
  if (faceMeshInstance) {
    (faceMeshInstance as { onResults: (cb: (r: unknown) => void) => void }).onResults(onResults);
    return faceMeshInstance;
  }

  const { FaceMesh } = await import('@mediapipe/face_mesh');

  const faceMesh = new FaceMesh({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  faceMesh.onResults(onResults);
  await faceMesh.initialize();
  faceMeshInstance = faceMesh;
  return faceMesh;
}

export function resetMediaPipe() {
  faceMeshInstance = null;
}
