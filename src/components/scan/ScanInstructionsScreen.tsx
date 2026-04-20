'use client';

import { IconArrowLeft, IconCamera, IconInfo } from '@/components/ui/Icons';
import { FaceSilhouette, FaceMeshOverlay } from '@/components/FaceMesh';
import type { ScanAngle } from '@/lib/types';

interface Props { onStart: () => void; onBack: () => void; }

export function ScanInstructionsScreen({ onStart, onBack }: Props) {
  const angles: { angle: ScanAngle; title: string; desc: string }[] = [
    { angle: 'front', title: 'Face forward',  desc: 'Look directly at the camera with a neutral expression.' },
    { angle: 'left',  title: 'Turn left',     desc: 'Slowly rotate your head 90° to your left.' },
    { angle: 'right', title: 'Turn right',    desc: 'Return to center, then rotate 90° to your right.' },
  ];

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: '40px 64px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20, paddingLeft: 0 }}>
          <IconArrowLeft size={16} /> Back
        </button>
        <div className="eyebrow" style={{ color: 'var(--petrol)' }}>Step 3 of 4 · Scan preparation</div>
        <h2 className="serif" style={{ fontSize: 44, margin: '12px 0 8px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
          Three angles, about 60 seconds.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 28, maxWidth: 540 }}>
          Hold still for each angle — the scan captures automatically once your face is stable
          for ten consecutive frames.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {angles.map((a, i) => (
            <div key={a.angle} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="label">Angle {i + 1}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>≈ 15s</span>
              </div>
              <div style={{ position: 'relative', aspectRatio: '3 / 4', background: 'var(--paper-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden', marginBottom: 12 }}>
                <FaceSilhouette angle={a.angle} size={200} />
                <FaceMeshOverlay angle={a.angle} size={200} stability={0.8} active={false} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{a.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, background: 'var(--amber-bg)', border: '1px solid oklch(0.85 0.06 85)', borderRadius: 'var(--r-md)', display: 'flex', gap: 12, marginBottom: 20 }}>
          <IconInfo size={18} style={{ color: 'var(--amber-ink)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--amber-ink)', lineHeight: 1.55 }}>
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
