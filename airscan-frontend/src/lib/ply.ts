import type { LandmarkPoint } from './types';

let cachedTriangles: number[][] | null = null;

// @mediapipe/face_mesh's FACEMESH_TESSELATION is laid out as edge-triples,
// each triple forming one triangle, e.g. [127,34],[34,139],[139,127] -> (127,34,139).
async function getFaceTriangles(): Promise<number[][]> {
  if (cachedTriangles) return cachedTriangles;
  const mod = await import('@mediapipe/face_mesh');
  const edges = (mod as unknown as { FACEMESH_TESSELATION: Array<[number, number]> }).FACEMESH_TESSELATION;
  const triangles: number[][] = [];
  for (let i = 0; i < edges.length; i += 3) {
    triangles.push([edges[i][0], edges[i + 1][0], edges[i + 2][0]]);
  }
  cachedTriangles = triangles;
  return triangles;
}

export async function generateFacePLY(
  landmarks: LandmarkPoint[],
  videoWidth: number,
  videoHeight: number,
  scaleMmPerPixel: number
): Promise<string> {
  const triangles = await getFaceTriangles();
  const validTriangles = triangles.filter(([a, b, c]) => a < landmarks.length && b < landmarks.length && c < landmarks.length);

  const vertices = landmarks.map(l => {
    const vx = (l.x - 0.5) * videoWidth * scaleMmPerPixel;
    const vy = -(l.y - 0.5) * videoHeight * scaleMmPerPixel;
    const vz = -l.z * videoWidth * scaleMmPerPixel;
    return `${vx.toFixed(4)} ${vy.toFixed(4)} ${vz.toFixed(4)}`;
  });

  const header = [
    'ply',
    'format ascii 1.0',
    `element vertex ${vertices.length}`,
    'property float x',
    'property float y',
    'property float z',
    `element face ${validTriangles.length}`,
    'property list uchar int vertex_indices',
    'end_header',
  ];

  const faces = validTriangles.map(([a, b, c]) => `3 ${a} ${b} ${c}`);

  return [...header, ...vertices, ...faces].join('\n') + '\n';
}

export function downloadPLY(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
