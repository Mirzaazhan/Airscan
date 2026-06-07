'use client';

import { IconArrowLeft, IconCamera, IconInfo } from '@/components/ui/Icons';
import { FaceSilhouette, FaceMeshOverlay } from '@/components/FaceMesh';
import type { ScanAngle } from '@/lib/types';

interface Props { onStart: () => void; onBack: () => void; }

export function ScanInstructionsScreen({ onStart, onBack }: Props) {
  const angles: { angle: ScanAngle; title: string; desc: string; time: string }[] = [
    { angle: 'front',       title: 'Face forward',     desc: 'Look directly at the camera with a neutral expression.',         time: '≈ 15s' },
    { angle: 'left',        title: 'Turn left',         desc: 'Slowly rotate your head 90° to your left.',                     time: '≈ 15s' },
    { angle: 'right',       title: 'Turn right',        desc: 'Return to center, then rotate 90° to your right.',              time: '≈ 15s' },
    { angle: 'mouth_open',  title: 'Mouth open',        desc: 'Open as wide as possible and say "Ahhh".',                      time: '≈ 15s' },
    { angle: 'tongue_out',  title: 'Tongue out',        desc: 'Stick your tongue out as far as comfortable.',                  time: '≈ 15s' },
    { angle: 'tongue_rest', title: 'Tongue at rest',    desc: 'Keep mouth open with tongue relaxed inside.',                   time: '≈ 15s' },
    { angle: 'neck',        title: 'Neck scan',         desc: 'Face forward with shoulders visible in frame.',                 time: '≈ 20s' },
    { angle: 'nasal',       title: 'Nasal scan',        desc: 'Tilt your head slightly back to expose your nostrils.',         time: '≈ 15s' },
  ];

  return (
    <div style={{
      minHeight: '100vh', overflow: 'auto',
      padding: 'clamp(24px, 5vw, 48px) clamp(16px, 5vw, 64px)',
      background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.015 130 / 0.35) 100%)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{
              height: 4, flex: 1, borderRadius: 2,
              background: n <= 4 ? 'var(--petrol)' : 'var(--line)',
            }}/>
          ))}
        </div>

        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 14 }}>Step 4 of 4 · Scan preparation</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px, 5vw, 42px)', margin: '0 0 10px', lineHeight: 1.08, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          Eight angles, about 2 minutes.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 32, maxWidth: 560 }}>
          Hold still for each angle — the scan captures automatically once your face is stable
          for ten consecutive frames.
        </p>

        <div className="grid-scan-angles" style={{ marginBottom: 28 }}>
          {angles.map((a, i) => (
            <div key={a.angle} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--petrol)', background: 'var(--sage-bg)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                  {i + 1}
                </span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{a.time}</span>
              </div>
              <div style={{ position: 'relative', aspectRatio: '3 / 4', background: 'var(--paper-2)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 10 }}>
                <FaceSilhouette angle={a.angle} size={200} />
                <FaceMeshOverlay angle={a.angle} size={200} stability={0.8} active={false} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>

        {/* Camera notice */}
        <div style={{
          padding: '16px 20px',
          background: 'oklch(0.97 0.04 85 / 0.6)',
          border: '1px solid oklch(0.85 0.06 85)',
          borderRadius: 'var(--r-lg)',
          display: 'flex', gap: 14, marginBottom: 24, alignItems: 'flex-start',
        }}>
          <IconInfo size={18} style={{ color: 'var(--amber-ink)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--amber-ink)', lineHeight: 1.6 }}>
            <strong>Camera access required.</strong> Airscan processes frames on-device.
            Only the final landmark coordinates and one still per angle leave your browser.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-lg" onClick={onStart} style={{ flex: 1 }}>
            <IconCamera size={16} /> Allow camera & begin
          </button>
        </div>
      </div>
    </div>
  );
}
