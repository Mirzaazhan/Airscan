'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconX } from '@/components/ui/Icons';
import { CameraFeed } from '@/components/FaceMesh';
import type { ScanAngle, CapturedFrame } from '@/lib/types';
import { KEY_LANDMARK_INDICES } from '@/lib/mediapipe';

interface Props {
  angle: ScanAngle;
  onCapture: (frame: CapturedFrame) => void;
  onBack: () => void;
  capturedCount: number;
}

type CaptureState = 'detecting' | 'stabilizing' | 'capturing' | 'done';

const ANGLE_LABELS: Record<ScanAngle, string> = { front: 'Face forward', left: 'Turn your head left', right: 'Turn your head right' };
const ANGLE_SUBS:  Record<ScanAngle, string> = { front: 'Look directly at the camera', left: 'Rotate 90° to your left', right: 'Rotate 90° to your right' };
const ANGLE_IDX:   Record<ScanAngle, number> = { front: 0, left: 1, right: 2 };

export function ScanScreen({ angle, onCapture, onBack, capturedCount }: Props) {
  const [stability, setStability] = useState(0);
  const [framesStable, setFramesStable] = useState(0);
  const [captureState, setCaptureState] = useState<CaptureState>('detecting');
  const videoRef = useRef<HTMLVideoElement>(null);
  const angleIdx = ANGLE_IDX[angle];

  // Simulated detection state machine (real MediaPipe replaces this)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setCaptureState(prev => {
        if (prev === 'done') return prev;
        if (prev === 'detecting') {
          setStability(s => {
            const next = Math.min(1, s + 0.03);
            if (next > 0.4) { setTimeout(() => setCaptureState('stabilizing'), 0); }
            return next;
          });
        } else if (prev === 'stabilizing') {
          setFramesStable(f => {
            const next = f + 1;
            if (next >= 10) { setTimeout(() => setCaptureState('capturing'), 0); }
            return next;
          });
          setStability(s => Math.min(1, s + 0.02));
        } else if (prev === 'capturing') {
          setTimeout(() => setCaptureState('done'), 500);
        }
        return prev;
      });
      t = setTimeout(tick, 80);
    };
    t = setTimeout(tick, 80);
    return () => clearTimeout(t);
  }, [angle]);

  useEffect(() => {
    if (captureState === 'done') {
      const timeout = setTimeout(() => {
        const frame: CapturedFrame = {
          angle,
          imageDataUrl: '',
          landmarks: KEY_LANDMARK_INDICES.map(i => ({ index: i, x: 0.5, y: 0.5, z: 0 })),
          yawAtCapture: angle === 'front' ? 0 : angle === 'left' ? -47 : 47,
          capturedAt: new Date().toISOString(),
        };
        onCapture(frame);
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [captureState, angle, onCapture]);

  const statusColor = captureState === 'done' || captureState === 'capturing'
    ? 'var(--sage)'
    : captureState === 'stabilizing' ? 'var(--amber)' : 'var(--ink-4)';

  const statusLabel = captureState === 'done' ? 'Captured'
    : captureState === 'capturing' ? 'Capturing…'
    : captureState === 'stabilizing' ? `Hold still · ${framesStable}/10`
    : 'Align your face';

  const feedSize = 420;

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', background: 'var(--petrol-ink)', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <IconX size={16} /> Cancel
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 3, width: 32, borderRadius: 2, background: i < capturedCount || (i === capturedCount && captureState !== 'done') ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', position: 'relative', overflow: 'hidden' }}>
              {i === angleIdx && captureState !== 'done' && (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${stability * 100}%`, background: 'white', transition: 'width 0.2s' }}/>
              )}
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{angleIdx + 1} / 3</div>
      </div>

      {/* Instruction */}
      <div style={{ padding: '0 40px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>{angle.toUpperCase()} · Angle {angleIdx + 1} of 3</div>
        <h2 className="serif" style={{ fontSize: 40, margin: '8px 0 6px', letterSpacing: '-0.01em' }}>{ANGLE_LABELS[angle]}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{ANGLE_SUBS[angle]}</p>
      </div>

      {/* Camera viewport */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px 0' }}>
        <div style={{
          position: 'relative', width: feedSize, height: feedSize * 1.2, borderRadius: 16, overflow: 'hidden',
          border: `2px solid ${statusColor}`, transition: 'border-color 0.3s',
          boxShadow: captureState === 'capturing' ? '0 0 0 12px oklch(0.62 0.08 155 / 0.2)' : 'none',
        }}>
          <CameraFeed angle={angle} size={feedSize} stability={stability} />

          {captureState === 'stabilizing' && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, oklch(0.62 0.08 155 / 0.3), transparent)', animation: 'scanSweep 2s linear infinite' }}/>
          )}

          {/* Corner brackets */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} style={{
              position: 'absolute',
              top:    c[0] === 't' ? 12 : 'auto', bottom: c[0] === 'b' ? 12 : 'auto',
              left:   c[1] === 'l' ? 12 : 'auto', right:  c[1] === 'r' ? 12 : 'auto',
              width: 18, height: 18,
              borderTop:    c[0] === 't' ? `2px solid ${statusColor}` : 'none',
              borderBottom: c[0] === 'b' ? `2px solid ${statusColor}` : 'none',
              borderLeft:   c[1] === 'l' ? `2px solid ${statusColor}` : 'none',
              borderRight:  c[1] === 'r' ? `2px solid ${statusColor}` : 'none',
              transition: 'border-color 0.3s',
            }}/>
          ))}

          {captureState === 'capturing' && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', animation: 'fadeIn 0.2s ease', opacity: 0.9 }}/>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div style={{ padding: '0 40px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, maxWidth: 440, margin: '0 auto' }}>
          <span className="dot" style={{ background: statusColor, width: 8, height: 8, animation: captureState !== 'done' ? 'softPulse 1.2s infinite' : 'none' }}/>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{statusLabel}</span>
          <span style={{ flex: 1 }}/>
          <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            conf {stability.toFixed(2)} · jitter ±{((1 - stability) * 1.2).toFixed(1)}px
          </span>
        </div>
      </div>

      {/* Hidden video ref for real camera */}
      <video ref={videoRef} style={{ display: 'none' }} />
    </div>
  );
}
