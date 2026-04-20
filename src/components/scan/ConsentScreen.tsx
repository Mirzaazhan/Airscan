'use client';

import { useState } from 'react';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconArrow, IconCheck } from '@/components/ui/Icons';

interface Props { onAgree: () => void; onBack: () => void; }

export function ConsentScreen({ onAgree, onBack }: Props) {
  const [checked, setChecked] = useState({ data: false, age: false, terms: false });
  const allChecked = checked.data && checked.age && checked.terms;

  const Row = ({ k, title, body }: { k: keyof typeof checked; title: string; body: string }) => (
    <label style={{
      display: 'flex', gap: 12, padding: '14px 16px',
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)', cursor: 'pointer', alignItems: 'flex-start',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, marginTop: 2, flexShrink: 0,
        border: '1.5px solid ' + (checked[k] ? 'var(--petrol-ink)' : 'var(--ink-4)'),
        background: checked[k] ? 'var(--petrol-ink)' : 'transparent',
        display: 'grid', placeItems: 'center', color: 'white',
      }}>
        {checked[k] && <IconCheck size={12} strokeWidth={3} />}
      </div>
      <input type="checkbox" checked={checked[k]}
        onChange={e => setChecked(c => ({ ...c, [k]: e.target.checked }))}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.5 }}>{body}</div>
      </div>
    </label>
  );

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: '40px 64px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20, paddingLeft: 0 }}>
          <IconArrowLeft size={16} /> Back
        </button>
        <div className="eyebrow" style={{ color: 'var(--petrol)' }}>Step 1 of 4 · Consent</div>
        <h2 className="serif" style={{ fontSize: 44, margin: '12px 0 8px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
          Before we start, your consent.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 28, maxWidth: 540 }}>
          Airscan collects facial geometry and demographic information for the sole
          purpose of airway risk screening. Data is processed under Malaysia&apos;s Personal
          Data Protection Act 2010.
        </p>

        <div style={{ padding: 18, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', marginBottom: 24 }}>
          <div className="label" style={{ marginBottom: 12 }}>What we collect</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            <li>468 facial landmark coordinates (not the raw image) from 3 angles</li>
            <li>Demographic data: age, sex, height, weight, ethnicity</li>
            <li>A single encrypted still per angle, retained for 90 days</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row k="data" title="I consent to the collection and processing of my data"
            body="My facial landmarks and demographic data will be used to generate a risk score. Data is encrypted and stored in Malaysia." />
          <Row k="age" title="I am 18 or older, or my guardian has consented on my behalf"
            body="Airscan is validated for ages 5–80. Users under 18 require guardian approval." />
          <Row k="terms" title="I understand this is not a medical diagnosis"
            body="Airscan is a pre-screening tool. Any elevated result should be confirmed by a qualified medical practitioner." />
        </div>

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Cancel</button>
          <button className="btn btn-primary btn-lg" disabled={!allChecked}
            style={{ flex: 1 }} onClick={() => allChecked && onAgree()}>
            Continue <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
