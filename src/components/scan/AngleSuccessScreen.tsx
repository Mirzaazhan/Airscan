'use client';

import { IconCheck, IconArrow } from '@/components/ui/Icons';
import { FaceSilhouette } from '@/components/FaceMesh';
import type { ScanAngle } from '@/lib/types';

interface Props {
  capturedAngles: ScanAngle[];
  nextAngle: ScanAngle;
  onNext: () => void;
}

const ANGLE_LABELS: Record<ScanAngle, string> = { front: 'Face forward', left: 'Left profile', right: 'Right profile' };

export function AngleSuccessScreen({ capturedAngles, nextAngle, onNext }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 64px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--sage-bg)', border: '2px solid var(--sage)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--sage-ink)' }}>
          <IconCheck size={36} strokeWidth={2.5} />
        </div>
        <div className="eyebrow" style={{ color: 'var(--sage-ink)' }}>Angle captured</div>
        <h2 className="serif" style={{ fontSize: 38, margin: '10px 0 8px', letterSpacing: '-0.01em' }}>
          {capturedAngles.length} of 3 angles complete.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 28px' }}>
          Next: <strong style={{ color: 'var(--ink)' }}>{ANGLE_LABELS[nextAngle]}</strong>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          {(['front', 'left', 'right'] as ScanAngle[]).map(a => {
            const done = capturedAngles.includes(a);
            const next = a === nextAngle;
            return (
              <div key={a} style={{
                width: 96, padding: 14,
                background: done ? 'var(--sage-bg)' : 'var(--paper-2)',
                border: '1px solid ' + (done ? 'var(--sage)' : next ? 'var(--petrol-ink)' : 'var(--line)'),
                borderRadius: 10, position: 'relative',
              }}>
                <div style={{ position: 'relative', height: 60 }}>
                  <FaceSilhouette angle={a} size={60} />
                </div>
                <div style={{ fontSize: 11, marginTop: 6, fontWeight: 500, textTransform: 'capitalize', color: done ? 'var(--sage-ink)' : next ? 'var(--petrol-ink)' : 'var(--ink-3)' }}>
                  {done ? '✓ ' : next ? '→ ' : ''}{a}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Continue to {ANGLE_LABELS[nextAngle]} <IconArrow size={16} />
        </button>
      </div>
    </div>
  );
}
