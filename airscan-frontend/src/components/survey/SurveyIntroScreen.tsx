'use client';

import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrow, IconArrowLeft } from '@/components/ui/Icons';
import type { SurveySchema } from '@/lib/surveySchema';

interface Props { schema: SurveySchema; onStart: () => void; onBack: () => void; }

export function SurveyIntroScreen({ schema, onStart, onBack }: Props) {
  return (
    <div style={{
      minHeight: '100vh', overflow: 'auto',
      padding: 'clamp(32px, 6vh, 56px) clamp(16px, 6vw, 64px)',
      background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.015 130 / 0.4) 100%)',
      display: 'grid', alignContent: 'center',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>

        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 14 }}>Survey</div>
        <h2 className="serif" style={{ fontSize: 'clamp(28px, 5vw, 44px)', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          {schema.title}
        </h2>
        {schema.intro && (
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 32, maxWidth: 520 }}>{schema.intro}</p>
        )}

        <button className="btn btn-primary btn-lg" onClick={onStart}>
          Start Survey <IconArrow size={16} />
        </button>
        <div style={{ marginTop: 24 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
