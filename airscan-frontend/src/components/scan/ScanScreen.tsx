'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconX } from '@/components/ui/Icons';
import { FaceMeshOverlay, FaceSilhouette } from '@/components/FaceMesh';
import type { ScanAngle, CapturedFrame, LandmarkPoint } from '@/lib/types';
import { KEY_LANDMARK_INDICES, estimateYaw, isInTargetZone, isMouthOpen, YAW_ZONES, initMediaPipe, initPose, estimateNeckMeasurement } from '@/lib/mediapipe';

interface Props {
  angle: ScanAngle;
  onCapture: (frame: CapturedFrame) => void;
  onBack: () => void;
  capturedCount: number;
}

type CaptureState = 'loading' | 'detecting' | 'stabilizing' | 'countdown' | 'capturing' | 'done' | 'error';

const STABLE_FRAMES_REQUIRED: Record<ScanAngle, number> = { front: 10, left: 8, right: 8, mouth_open: 10, tongue_out: 10, tongue_rest: 10, neck: 10, nasal: 10 };
const ANGLE_LABELS: Record<ScanAngle, string> = { front: 'Face forward', left: 'Turn your head left', right: 'Turn your head right', mouth_open: 'Mouth Open (Ahhh)', tongue_out: 'Tongue Protrusion', tongue_rest: 'Tongue at Rest', neck: 'Neck Scan', nasal: 'Nasal Scan' };
const ANGLE_SUBS:   Record<ScanAngle, string> = { front: 'Look directly at the camera', left: 'Rotate ~90° to your left for a full profile', right: 'Rotate ~90° to your right for a full profile', mouth_open: 'Open your mouth as wide as possible and say “Ahhh” — this determines your Mallampati class', tongue_out: 'Stick your tongue out as far as comfortable', tongue_rest: 'Keep mouth open with tongue relaxed inside', neck: 'Keep shoulders visible and face forward', nasal: 'Tilt head slightly back to expose nostrils' };
const ANGLE_IDX:    Record<ScanAngle, number> = { front: 0, left: 1, right: 2, mouth_open: 3, tongue_out: 4, tongue_rest: 5, neck: 6, nasal: 7 };

export function ScanScreen({ angle, onCapture, onBack, capturedCount }: Props) {
  const [captureState, setCaptureState] = useState<CaptureState>('loading');
  const [stability, setStability] = useState(0);
  const [stableFrames, setStableFrames] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [liveLandmarks, setLiveLandmarks] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const livePoseLandmarksRef = useRef<Array<{ x: number; y: number; z: number; visibility?: number }> | null>(null);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const stateRef    = useRef<CaptureState>('loading');
  const stableRef   = useRef(0);
  const capturedRef = useRef(false);
  const countdownStartRef = useRef(0);
  const yawEMARef   = useRef(0);
  const angleIdx    = ANGLE_IDX[angle];

  const [estimatedYaw, setEstimatedYaw] = useState(0);

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

    let neckMeasurement = undefined;
    if (angle === 'neck') {
      const measurement = estimateNeckMeasurement(landmarks, livePoseLandmarksRef.current, canvas.width, canvas.height);
      if (measurement) {
        neckMeasurement = {
          widthMm: measurement.widthMm,
          circumferenceMm: measurement.circumferenceMm,
          scaleMmPerPixel: measurement.scaleMmPerPixel
        };
      }
    }

    return {
      angle,
      imageDataUrl,
      landmarks: keyLandmarks,
      yawAtCapture: estimateYaw(landmarks),
      capturedAt: new Date().toISOString(),
      neckMeasurement,
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
      let poseMesh: { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null = null;
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
          // EMA smoothing — reduces jitter without noticeable lag
          yawEMARef.current = yawEMARef.current * 0.6 + estimateYaw(pts) * 0.4;
          const yaw = yawEMARef.current;
          setEstimatedYaw(yaw);
          const inZone = isInTargetZone(yaw, angle);
          const required = STABLE_FRAMES_REQUIRED[angle];

          let mouthReady = true;
          if (angle === 'mouth_open' || angle === 'tongue_out' || angle === 'tongue_rest') {
            mouthReady = isMouthOpen(pts);
          }

          let neckReady = true;
          if (angle === 'neck') {
            const measurement = estimateNeckMeasurement(pts, livePoseLandmarksRef.current, videoRef.current?.videoWidth || 640, videoRef.current?.videoHeight || 480);
            if (!measurement || !measurement.shouldersVisible) {
              neckReady = false;
            }
          }

          let inCountdown = stateRef.current === 'countdown';

          if (!inZone || !mouthReady || !neckReady) {
            stableRef.current = 0;
            setStableFrames(0);
            setStability(Math.max(0, stableRef.current / required));
            if (inCountdown) {
              setCountdownValue(null);
            }
            setCaptureState(prev => (prev === 'stabilizing' || prev === 'countdown') ? 'detecting' : prev);
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

          if (sf >= required && stateRef.current !== 'countdown' && stateRef.current !== 'capturing' && !capturedRef.current) {
            setCaptureState('countdown');
            countdownStartRef.current = performance.now();
            inCountdown = true;
          }

          if (inCountdown) {
            const elapsed = performance.now() - countdownStartRef.current;
            const remaining = Math.ceil((3000 - elapsed) / 1000);
            if (remaining > 0) {
              setCountdownValue(remaining);
            } else if (!capturedRef.current) {
              capturedRef.current = true;
              setCountdownValue(null);
              setCaptureState('capturing');

              // Flash then capture
              setTimeout(() => {
                if (cancelled) return;
                const frame = captureFrame(pts);
                setCaptureState('done');
                setTimeout(() => { if (!cancelled) onCapture(frame); }, 600);
              }, 200);
            }
          }
        });

        if (angle === 'neck') {
          const p = await initPose((results: unknown) => {
            if (cancelled || stateRef.current === 'done') return;
            const r = results as { poseLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }> };
            if (r.poseLandmarks) {
              livePoseLandmarksRef.current = r.poseLandmarks;
            }
          });
          poseMesh = p as { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null;
        }
      } catch {
        if (cancelled) return;
        setErrorMsg('Failed to initialise detection models. Please refresh and try again.');
        setCaptureState('error');
        return;
      }

      faceMesh = mp as { send: (opts: { image: HTMLVideoElement }) => Promise<void> } | null;
      if (cancelled) return;
      setCaptureState('detecting');

      // 3. RAF send loop
      let sendingFace = false;
      let sendingPose = false;
      const loop = async () => {
        if (cancelled || stateRef.current === 'done') return;
        if (video.readyState >= 2) {
          if (!sendingFace) {
            sendingFace = true;
            faceMesh?.send({ image: video }).catch(() => {}).finally(() => { sendingFace = false; });
          }
          if (angle === 'neck' && !sendingPose && poseMesh) {
            sendingPose = true;
            poseMesh.send({ image: video }).catch(() => {}).finally(() => { sendingPose = false; });
          }
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
    : captureState === 'stabilizing' || captureState === 'countdown' ? 'var(--amber)'
    : captureState === 'error'       ? 'var(--terra)'
    : 'var(--ink-4)';

  const required = STABLE_FRAMES_REQUIRED[angle];
  const statusLabel =
    captureState === 'loading'     ? 'Starting camera…'
    : captureState === 'error'     ? errorMsg
    : captureState === 'done'      ? 'Captured ✓'
    : captureState === 'capturing' ? 'Capturing…'
    : captureState === 'countdown' ? `Hold still! Capturing in ${countdownValue}…`
    : captureState === 'stabilizing' ? `Hold still · ${stableFrames}/${required}`
    : 'Align your face in the frame';

  // Clamp camera feed to viewport width on small screens
  const feedW = typeof window !== 'undefined' ? Math.min(420, window.innerWidth - 32) : 420;
  const feedH = feedW * 1.2;

  // Map live landmarks to overlay positions for the 140-pt simulated mesh display
  const meshPoints = liveLandmarks.length > 0
    ? KEY_LANDMARK_INDICES.map(i => ({ x: liveLandmarks[i]?.x ?? 0.5, y: liveLandmarks[i]?.y ?? 0.5 }))
    : null;

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden', background: 'var(--petrol-ink)', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px) clamp(16px, 5vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <button onClick={() => { stopCamera(); onBack(); }} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <IconX size={16} /> Cancel
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{ height: 3, width: 24, borderRadius: 2, background: i < capturedCount ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', position: 'relative', overflow: 'hidden' }}>
              {i === angleIdx && captureState !== 'done' && (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${stability * 100}%`, background: 'white', transition: 'width 0.15s' }} />
              )}
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{angleIdx + 1} / 8</div>
      </div>

      {/* Instruction */}
      <div style={{ padding: '0 clamp(16px, 5vw, 40px)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>{angle.toUpperCase().replace('_', ' ')} · Angle {angleIdx + 1} of 8</div>
        <h2 className="serif" style={{ fontSize: 40, margin: '8px 0 6px', letterSpacing: '-0.01em' }}>{ANGLE_LABELS[angle]}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{ANGLE_SUBS[angle]}</p>
      </div>

      {/* Mallampati helper — only shown on mouth_open step */}
      {angle === 'mouth_open' && (
        <div style={{ padding: '0 40px', maxWidth: 540, margin: '12px auto 0', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,165,77,0.5)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Warning icon */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,165,77,0.2)', border: '1px solid rgba(255,165,77,0.6)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 15 }}>💡</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ffa94d', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Mallampati Classification — Step 4 of 7</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.7 }}>
                This step measures your <strong style={{ color: 'white' }}>airway openness</strong>. Open your mouth <em>as wide as possible</em> and tilt your head slightly back so your throat is visible.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 10 }}>
                {[
                  ['Class 1 · Low Risk', 'Uvula &amp; fauces fully visible'],
                  ['Class 2 · Moderate', 'Uvula partially visible'],
                  ['Class 3 · High Risk', 'Only soft palate visible'],
                  ['Class 4 · High Risk', 'Hard palate only'],
                ].map(([cls, desc]) => (
                  <div key={cls} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                    <span style={{ color: cls.includes('Low') ? '#00c9a7' : cls.includes('Moderate') ? '#ffa94d' : '#ff5c5c', fontWeight: 600 }}>{cls}</span>
                    <br /><span dangerouslySetInnerHTML={{ __html: desc }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nasal Assessment helper — only shown on nasal step */}
      {angle === 'nasal' && (
        <div style={{ padding: '0 40px', maxWidth: 540, margin: '12px auto 0', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,201,167,0.5)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,201,167,0.2)', border: '1px solid rgba(0,201,167,0.6)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 15 }}>👃</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00c9a7', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Nasal Assessment — Step 8 of 8</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.7 }}>
                We will measure your <strong style={{ color: 'white' }}>internal nasal valve angle, aperture width, and asymmetry</strong>. 
                Tilt your head slightly back so your nostrils are clearly visible to the camera.
              </p>
            </div>
          </div>
        </div>
      )}

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

          {/* Countdown Overlay */}
          {captureState === 'countdown' && countdownValue !== null && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 120, fontWeight: 700, color: 'white', textShadow: '0 4px 24px rgba(0,0,0,0.5)', animation: 'pulse 1s infinite ease-in-out', fontFamily: 'var(--font-sans)' }}>
                {countdownValue}
              </div>
            </div>
          )}

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

      {/* Yaw angle indicator */}
      {captureState !== 'loading' && captureState !== 'error' && captureState !== 'done' && captureState !== 'capturing' && captureState !== 'countdown' && (() => {
        const [zLo, zHi] = YAW_ZONES[angle];
        const toPercent = (v: number) => Math.round(((Math.max(-1, Math.min(1, v)) + 1) / 2) * 100);
        const markerPct  = toPercent(estimatedYaw);
        const zoneLoPct  = toPercent(zLo);
        const zoneHiPct  = toPercent(zHi);
        const inZone     = isInTargetZone(estimatedYaw, angle);
        return (
          <div style={{ padding: '0 40px 8px', maxWidth: feedW + 80, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Zone highlight */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${zoneLoPct}%`, width: `${zoneHiPct - zoneLoPct}%`,
                background: inZone ? 'var(--sage)' : 'var(--petrol)',
                opacity: 0.45, transition: 'background 0.2s',
              }} />
              {/* Labels */}
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>L</span>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>R</span>
              {/* Moving marker */}
              <div style={{
                position: 'absolute', top: '50%',
                left: `${markerPct}%`,
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                background: inZone ? 'var(--sage)' : 'white',
                boxShadow: '0 0 0 2px rgba(0,0,0,0.35)',
                transition: 'left 0.06s linear, background 0.2s',
                zIndex: 2,
              }} />
            </div>
          </div>
        );
      })()}

      {/* Status strip */}
      <div style={{ padding: '0 clamp(16px, 5vw, 40px) clamp(20px, 4vh, 32px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, maxWidth: 440, margin: '0 auto' }}>
          <span className="dot" style={{ background: statusColor, width: 8, height: 8, flexShrink: 0, animation: captureState !== 'done' && captureState !== 'error' ? 'softPulse 1.2s infinite' : 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{statusLabel}</span>
          {captureState === 'stabilizing' || captureState === 'detecting' || captureState === 'countdown' ? (
            <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              yaw {estimatedYaw.toFixed(2)}
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
