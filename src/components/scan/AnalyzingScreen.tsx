'use client';

import { useState, useEffect } from 'react';
import { IconCheck } from '@/components/ui/Icons';

interface Props { onDone: () => void; }

const STEPS = [
  'Extracting 468-point landmarks…',
  'Normalising geometry across three angles…',
  'Combining with demographic features…',
  'Querying airway risk model…',
  'Generating report…',
];

export function AnalyzingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => {
        if (s >= STEPS.length - 1) {
          clearInterval(t);
          setTimeout(onDone, 800);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 64px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--line)" strokeWidth="1"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--petrol)" strokeWidth="2"
              strokeDasharray={`${(step + 1) * 67} 999`} strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
            <circle cx="60" cy="60" r="40" fill="none" stroke="var(--line)" strokeDasharray="2 4"/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--petrol-ink)' }}>
            {Math.round(((step + 1) / STEPS.length) * 100)}%
          </div>
        </div>

        <div className="eyebrow" style={{ color: 'var(--petrol)', textAlign: 'center' }}>Step 4 of 4 · Analysing</div>
        <h2 className="serif" style={{ fontSize: 36, textAlign: 'center', margin: '12px 0 32px', letterSpacing: '-0.01em' }}>
          Computing your risk profile…
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: i <= step ? 'var(--surface)' : 'transparent',
              border: '1px solid ' + (i <= step ? 'var(--line)' : 'transparent'),
              borderRadius: 'var(--r-sm)',
              opacity: i <= step ? 1 : 0.4,
              transition: 'all 0.3s',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: i < step ? 'var(--sage)' : i === step ? 'var(--petrol-ink)' : 'var(--line)', color: 'white' }}>
                {i < step
                  ? <IconCheck size={10} strokeWidth={3} />
                  : i === step
                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid white', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}/>
                    : null}
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
