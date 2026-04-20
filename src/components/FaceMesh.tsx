'use client';

import { useMemo, useEffect, useState } from 'react';
import type { ScanAngle } from '@/lib/types';

function useMeshPoints(angle: ScanAngle) {
  return useMemo(() => {
    const offX = angle === 'left' ? 0.04 : angle === 'right' ? -0.04 : 0;
    const skewX = angle === 'left' || angle === 'right' ? 0.88 : 1;
    const pts: [number, number][] = [
      [0.50,0.12],[0.42,0.14],[0.35,0.18],[0.30,0.24],[0.26,0.32],[0.23,0.42],
      [0.22,0.52],[0.24,0.62],[0.28,0.71],[0.33,0.79],[0.40,0.86],[0.50,0.90],
      [0.60,0.86],[0.67,0.79],[0.72,0.71],[0.76,0.62],[0.78,0.52],[0.77,0.42],
      [0.74,0.32],[0.70,0.24],[0.65,0.18],[0.58,0.14],[0.50,0.12],[0.50,0.90],
      [0.40,0.20],[0.50,0.18],[0.60,0.20],[0.50,0.24],
      [0.31,0.32],[0.35,0.30],[0.39,0.30],[0.43,0.31],[0.45,0.33],[0.36,0.31],
      [0.69,0.32],[0.65,0.30],[0.61,0.30],[0.57,0.31],[0.55,0.33],[0.64,0.31],
      [0.33,0.40],[0.37,0.38],[0.41,0.39],[0.44,0.41],[0.41,0.43],[0.37,0.43],[0.39,0.405],[0.35,0.415],
      [0.67,0.40],[0.63,0.38],[0.59,0.39],[0.56,0.41],[0.59,0.43],[0.63,0.43],[0.61,0.405],[0.65,0.415],
      [0.50,0.40],[0.50,0.46],[0.50,0.52],[0.50,0.58],
      [0.46,0.58],[0.48,0.60],[0.50,0.61],[0.52,0.60],[0.54,0.58],[0.47,0.55],[0.53,0.55],[0.50,0.55],
      [0.42,0.68],[0.45,0.67],[0.48,0.665],[0.50,0.67],[0.52,0.665],[0.55,0.67],[0.58,0.68],
      [0.43,0.72],[0.47,0.73],[0.50,0.74],[0.53,0.73],[0.57,0.72],
      [0.44,0.82],[0.50,0.86],[0.56,0.82],
      [0.30,0.55],[0.32,0.62],[0.35,0.68],[0.70,0.55],[0.68,0.62],[0.65,0.68],
      [0.36,0.78],[0.64,0.78],[0.40,0.82],[0.60,0.82],
      [0.24,0.36],[0.76,0.36],[0.26,0.46],[0.74,0.46],
      [0.38,0.48],[0.62,0.48],[0.42,0.54],[0.58,0.54],[0.40,0.64],[0.60,0.64],
      [0.45,0.60],[0.55,0.60],[0.48,0.50],[0.52,0.50],[0.36,0.58],[0.64,0.58],
      [0.34,0.50],[0.66,0.50],[0.42,0.78],[0.58,0.78],
      [0.48,0.78],[0.52,0.78],[0.44,0.74],[0.56,0.74],
    ];
    const cx = 0.5;
    return pts.map(([x, y]) => {
      const dx = (x - cx) * skewX;
      return [cx + dx + offX, y] as [number, number];
    });
  }, [angle]);
}

const CONNECTIONS = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
  [28,29,30,31,32],[34,35,36,37,38],
  [40,41,42,43,44,45,40],[48,49,50,51,52,53,48],
  [56,57,58,59],[60,61,62,63,64],
  [68,69,70,71,72,73,74],[75,76,77,78,79],
];

interface FaceMeshProps {
  angle?: ScanAngle;
  stability?: number;
  active?: boolean;
  size?: number;
  monochrome?: boolean;
}

export function FaceMeshOverlay({ angle = 'front', stability = 0, active = true, size = 300, monochrome = false }: FaceMeshProps) {
  const pts = useMeshPoints(angle);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf: number;
    const loop = () => { setTick(t => t + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const amp = (1 - stability) * 1.2;
  const j = (i: number) => {
    if (!active) return 0;
    const n = Math.sin(i * 12.9898 + tick * 0.1) * 43758.5453;
    return (n - Math.floor(n) - 0.5) * amp;
  };

  const strokeColor = monochrome
    ? 'rgba(255,255,255,0.55)'
    : `oklch(${0.75 - stability * 0.15} ${0.08 + stability * 0.05} ${160 - stability * 5} / ${0.45 + stability * 0.4})`;
  const dotColor = monochrome
    ? 'rgba(255,255,255,0.85)'
    : `oklch(${0.78 - stability * 0.1} ${0.1 + stability * 0.07} ${160 - stability * 5} / ${0.7 + stability * 0.25})`;

  const S = size;
  return (
    <svg width={S} height={S * 1.2} viewBox={`0 0 ${S} ${S * 1.2}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {CONNECTIONS.map((seq, idx) => (
        <polyline key={idx}
          points={seq.map(i => {
            const p = pts[i % pts.length];
            return `${p[0] * S + j(i)},${p[1] * S * 1.2 + j(i + 7)}`;
          }).join(' ')}
          stroke={strokeColor} strokeWidth="0.7" fill="none"/>
      ))}
      {pts.map((p, i) => (
        <circle key={i}
          cx={p[0] * S + j(i)} cy={p[1] * S * 1.2 + j(i + 3)}
          r={i < 24 ? 1.2 : 0.9} fill={dotColor}/>
      ))}
    </svg>
  );
}

export function FaceSilhouette({ angle = 'front', size = 300, dark = false }: { angle?: ScanAngle; size?: number; dark?: boolean }) {
  const fg  = dark ? 'rgba(255,255,255,0.08)' : 'oklch(0.86 0.015 230)';
  const fg2 = dark ? 'rgba(255,255,255,0.12)' : 'oklch(0.8 0.02 230)';
  const S = size, H = S * 1.2;
  const paths = {
    front: `M ${S*0.5} ${S*0.12} C ${S*0.72} ${S*0.13}, ${S*0.78} ${S*0.3}, ${S*0.78} ${S*0.5} C ${S*0.78} ${S*0.72}, ${S*0.66} ${S*0.88}, ${S*0.5} ${S*0.9} C ${S*0.34} ${S*0.88}, ${S*0.22} ${S*0.72}, ${S*0.22} ${S*0.5} C ${S*0.22} ${S*0.3}, ${S*0.28} ${S*0.13}, ${S*0.5} ${S*0.12} Z`,
    left:  `M ${S*0.66} ${S*0.14} C ${S*0.8} ${S*0.18}, ${S*0.84} ${S*0.36}, ${S*0.8} ${S*0.55} C ${S*0.78} ${S*0.72}, ${S*0.72} ${S*0.87}, ${S*0.58} ${S*0.9} L ${S*0.35} ${S*0.88} C ${S*0.3} ${S*0.7}, ${S*0.28} ${S*0.52}, ${S*0.3} ${S*0.4} C ${S*0.34} ${S*0.25}, ${S*0.48} ${S*0.14}, ${S*0.66} ${S*0.14} Z`,
    right: `M ${S*0.34} ${S*0.14} C ${S*0.2} ${S*0.18}, ${S*0.16} ${S*0.36}, ${S*0.2} ${S*0.55} C ${S*0.22} ${S*0.72}, ${S*0.28} ${S*0.87}, ${S*0.42} ${S*0.9} L ${S*0.65} ${S*0.88} C ${S*0.7} ${S*0.7}, ${S*0.72} ${S*0.52}, ${S*0.7} ${S*0.4} C ${S*0.66} ${S*0.25}, ${S*0.52} ${S*0.14}, ${S*0.34} ${S*0.14} Z`,
  };
  return (
    <svg width={S} height={H} viewBox={`0 0 ${S} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <path d={paths[angle]} fill={fg} stroke={fg2} strokeWidth="1"/>
    </svg>
  );
}

export function CameraFeed({ angle = 'front', size = 300, stability = 0 }: { angle?: ScanAngle; size?: number; stability?: number }) {
  return (
    <div style={{
      position: 'relative', width: size, height: size * 1.2,
      background: 'radial-gradient(ellipse at 50% 40%, oklch(0.25 0.02 230) 0%, oklch(0.12 0.015 230) 80%)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px)',
        backgroundSize: '3px 3px',
      }}/>
      <FaceSilhouette angle={angle} size={size} dark/>
      <FaceMeshOverlay angle={angle} size={size} stability={stability} monochrome/>
    </div>
  );
}
