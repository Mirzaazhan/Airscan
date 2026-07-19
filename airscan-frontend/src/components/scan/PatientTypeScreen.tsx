'use client';

import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import type { PatientType } from '@/lib/types';

interface Props {
  onSelect: (type: PatientType) => void;
  onBack: () => void;
}

export function PatientTypeScreen({ onSelect, onBack }: Props) {
  return (
    <div style={{
      minHeight: '100vh', overflow: 'auto',
      padding: 'clamp(32px, 6vh, 56px) clamp(16px, 6vw, 64px)',
      background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.015 220 / 0.3) 100%)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>

        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 14 }}>Step 0 of 4 · Patient Type</div>
        <h2 className="serif" style={{ fontSize: 'clamp(28px, 5vw, 44px)', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          Who is this scan for?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 36, maxWidth: 520 }}>
          Airscan uses different questionnaires and risk models depending on the patient&apos;s age group. Please select the correct type to ensure accurate results.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Adult card */}
          <button
            type="button"
            onClick={() => onSelect('adult')}
            style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '24px 28px', textAlign: 'left', cursor: 'pointer',
              background: 'var(--surface)', border: '1.5px solid var(--line)',
              borderRadius: 'var(--r-xl)', fontFamily: 'inherit',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--petrol)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'var(--petrol)', display: 'grid', placeItems: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Adult</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                18 years and above · Uses the STOP-BANG questionnaire for OSA risk screening
              </div>
            </div>
            <IconArrow size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          </button>

          {/* Paeds card */}
          <button
            type="button"
            onClick={() => onSelect('paeds')}
            style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '24px 28px', textAlign: 'left', cursor: 'pointer',
              background: 'var(--surface)', border: '1.5px solid var(--line)',
              borderRadius: 'var(--r-xl)', fontFamily: 'inherit',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sage)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'var(--sage)', display: 'grid', placeItems: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5"/><path d="M6 21a6 6 0 0 1 12 0"/>
                <path d="M3 13c1-1 2-1.5 3-1"/><path d="M21 13c-1-1-2-1.5-3-1"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Paediatric</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                Under 18 years · Uses the Pediatric Sleep Questionnaire (PSQ) · To be completed by a parent or legal guardian
              </div>
            </div>
            <IconArrow size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          </button>
        </div>

        <div style={{ marginTop: 28, padding: '12px 16px', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          Selecting the correct patient type ensures the right clinical questionnaire and age-appropriate risk thresholds are applied.
        </div>
      </div>
    </div>
  );
}
