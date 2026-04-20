'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconX } from '@/components/ui/Icons';
import { FaceMeshOverlay, FaceSilhouette } from '@/components/FaceMesh';
import type { ScanAngle, CapturedFrame, LandmarkPoint } from '@/lib/types';
import { KEY_LANDMARK_INDICES, estimateYaw, isInTargetZone, initMediaPipe } from '@/lib/mediapipe';

interface Props {
  angle: ScanAngle;
  onCapture: (frame: CapturedFrame) => void;
  onBack: () => void;
  capturedCount: number;
}

type CaptureState = 'loading' | 'detecting' | 'stabilizing' | 'capturing' | 'done' | 'error';

const STABLE_FRAMES_REQUIRED: Record<ScanAngle, number> = { front: 10, left: 8, right: 8 };
const ANGLE_LABELS: Record<ScanAngle, string> = { front: 'Face forward', left: 'Turn your head left', right: 'Turn your head right' };
const ANGLE_SUBS:   Record<ScanAngle, string> = { front: 'Look directly at the camera', left: 'Rotate ~45° to your left', right: 'Rotate ~45° to your right' };
const ANGLE_IDX:    Record<ScanAngle, number> = { front: 0, left: 1, right: 2 };

export function ScanScreen({ angle, onCapture, onBack, capturedCount }: Props) {
  const [captureState, setCaptureState] = useState<CaptureState>('loading');
  const [stability, setStability] = useState(0);
  const [stableFrames, setStableFrames] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [liveLandmarks, setLiveLandmarks] = useState<Array<{ x: number; y: number; z: number }>>([]);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const stateRef    = useRef<CaptureState>('loading');
  const stableRef   = useRef(0);
  const capturedRef = useRef(false);
  const angleIdx    = ANGLE_IDX[angle];

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = captureState; }, [captureState]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Snapshot the current video frame to a dataURL
  const captureFrame = useCallback((landmarks: Array<{ x: number; y: number; z: number }>): CapturedFrame => {
    const video  = videoRef.current!;
    const canvas = canvasRef.current!;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/png');

    const keyLandmarks: LandmarkPoint[] = KEY_LANDMARK_INDICES.map(i => ({
      index: i,
      x: landmarks[i]?.x ?? 0,
      y: landmarks[i]?.y ?? 0,
      z: landmarks[i]?.z ?? 0,
    }));

    return {
      angle,
      imageDataUrl,
      landmarks: keyLandmarks,
      yawAtCapture: estimateYaw(landmarks),
      capturedAt: new Date().toISOString(),
    };
  }, [angle]);

  useEffect(() => {
    let faceMesh: { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null = null;
    let cancelled = false;

    async function start() {
      // 1. Camera access
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch {
        if (cancelled) return;
        setErrorMsg('Camera access denied. Please allow camera access and try again.');
        setCaptureState('error');
        return;
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});
      if (cancelled) return;

      // 2. Init MediaPipe
      let mp: Awaited<ReturnType<typeof initMediaPipe>>;
      try {
        mp = await initMediaPipe((results: unknown) => {
          if (cancelled || stateRef.current === 'done') return;

          const r = results as { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> };
          const pts = r.multiFaceLandmarks?.[0];

          if (!pts || pts.length === 0) {
            stableRef.current = 0;
            setStableFrames(0);
            setStability(0);
            setCaptureState(prev => prev === 'stabilizing' ? 'detecting' : prev);
            return;
          }

          setLiveLandmarks(pts);
          const yaw = estimateYaw(pts);
          const inZone = isInTargetZone(yaw, angle);
          const required = STABLE_FRAMES_REQUIRED[angle];

          if (!inZone) {
            stableRef.current = 0;
            setStableFrames(0);
            setStability(Math.max(0, stableRef.current / required));
            setCaptureState(prev => prev === 'stabilizing' ? 'detecting' : prev);
            return;
          }

          stableRef.current += 1;
          const sf = stableRef.current;
          const stab = Math.min(1, sf / required);
          setStableFrames(sf);
          setStability(stab);

          if (sf >= required * 0.3 && stateRef.current === 'detecting') {
            setCaptureState('stabilizing');
          }

          if (sf >= required && !capturedRef.current) {
            capturedRef.current = true;
            setCaptureState('capturing');

            // Flash then capture
            setTimeout(() => {
              if (cancelled) return;
              const frame = captureFrame(pts);
              setCaptureState('done');
              setTimeout(() => { if (!cancelled) onCapture(frame); }, 600);
            }, 200);
          }
        });
      } catch {
        if (cancelled) return;
        setErrorMsg('Failed to initialise face detection. Please refresh and try again.');
        setCaptureState('error');
        return;
      }

      faceMesh = mp as { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null;
      if (cancelled) return;
      setCaptureState('detecting');

      // 3. RAF send loop
      let sending = false;
      const loop = async () => {
        if (cancelled || stateRef.current === 'done') return;
        if (!sending && video.readyState >= 2) {
          sending = true;
          try { await faceMesh?.send({ image: video }); } catch { /* ignore */ }
          sending = false;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [angle, captureFrame, onCapture, stopCamera]);

  const statusColor = captureState === 'done' || captureState === 'capturing'
    ? 'var(--sage)'
    : captureState === 'stabilizing' ? 'var(--amber)'
    : captureState === 'error'       ? 'var(--terra)'
    : 'var(--ink-4)';

  const required = STABLE_FRAMES_REQUIRED[angle];
  const statusLabel =
    captureState === 'loading'     ? 'Starting camera…'
    : captureState === 'error'     ? errorMsg
    : captureState === 'done'      ? 'Captured ✓'
    : captureState === 'capturing' ? 'Capturing…'
    : captureState === 'stabilizing' ? `Hold still · ${stableFrames}/${required}`
    : 'Align your face in the frame';

  const feedW = 420;
  const feedH = feedW * 1.2;

  // Map live landmarks to overlay positions for the 140-pt simulated mesh display
  const meshPoints = liveLandmarks.length > 0
    ? KEY_LANDMARK_INDICES.map(i => ({ x: liveLandmarks[i]?.x ?? 0.5, y: liveLandmarks[i]?.y ?? 0.5 }))
    : null;

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', background: 'var(--petrol-ink)', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <button onClick={() => { stopCamera(); onBack(); }} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <IconX size={16} /> Cancel
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 3, width: 32, borderRadius: 2, background: i < capturedCount ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', position: 'relative', overflow: 'hidden' }}>
              {i === angleIdx && captureState !== 'done' && (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${stability * 100}%`, background: 'white', transition: 'width 0.15s' }} />
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
          position: 'relative', width: feedW, height: feedH, borderRadius: 16, overflow: 'hidden',
          border: `2px solid ${statusColor}`, transition: 'border-color 0.3s',
          boxShadow: captureState === 'capturing' ? '0 0 0 12px oklch(0.62 0.08 155 / 0.2)' : 'none',
        }}>
          {/* Live video — mirrored */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />

          {/* Silhouette guide overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: captureState === 'detecting' || captureState === 'loading' ? 0.6 : 0.25, transition: 'opacity 0.4s' }}>
            <FaceSilhouette angle={angle} size={feedW} />
          </div>

          {/* MediaPipe mesh dots overlay */}
          {meshPoints && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <FaceMeshOverlay angle={angle} size={feedW} stability={stability} />
            </div>
          )}

          {/* Scan sweep animation */}
          {captureState === 'stabilizing' && (
            <div style={{ position: 'absolute', left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, oklch(0.62 0.08 155 / 0.3), transparent)', animation: 'scanSweep 2s linear infinite', pointerEvents: 'none' }} />
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
              transition: 'border-color 0.3s', pointerEvents: 'none',
            }} />
          ))}

          {/* Capture flash */}
          {captureState === 'capturing' && (
            <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.85, pointerEvents: 'none', animation: 'fadeIn 0.15s ease' }} />
          )}

          {/* Loading state */}
          {captureState === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'oklch(0.18 0.02 230 / 0.7)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Starting camera…</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div style={{ padding: '0 40px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, maxWidth: 440, margin: '0 auto' }}>
          <span className="dot" style={{ background: statusColor, width: 8, height: 8, flexShrink: 0, animation: captureState !== 'done' && captureState !== 'error' ? 'softPulse 1.2s infinite' : 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{statusLabel}</span>
          {captureState === 'stabilizing' || captureState === 'detecting' ? (
            <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              stab {stability.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Hidden canvases — for capture + mediapipe */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={overlayRef} style={{ display: 'none' }} />
    </div>
  );
}
