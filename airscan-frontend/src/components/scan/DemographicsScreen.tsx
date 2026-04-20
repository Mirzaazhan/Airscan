'use client';

import { useState } from 'react';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import type { Demographics } from '@/lib/types';

interface Props {
  onSubmit: (form: Demographics) => void;
  onBack: () => void;
  initial: Demographics | null;
}

export function DemographicsScreen({ onSubmit, onBack, initial }: Props) {
  const [form, setForm] = useState<Partial<Demographics>>(initial ?? { age: undefined, gender: '', weight: undefined, height: undefined, race: '' });
  const update = (k: keyof Demographics, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const age = Number(form.age), weight = Number(form.weight), height = Number(form.height);
  const valid = age >= 5 && age <= 80 && weight >= 10 && weight <= 200 && height >= 50 && height <= 250 && !!form.gender && !!form.race;
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

  const SelectPills = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          padding: '8px 14px', fontSize: 13,
          background: value === o ? 'var(--petrol-ink)' : 'var(--surface)',
          color: value === o ? 'white' : 'var(--ink)',
          border: '1px solid ' + (value === o ? 'var(--petrol-ink)' : 'var(--line)'),
          borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
        }}>{o}</button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: '40px 64px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20, paddingLeft: 0 }}>
          <IconArrowLeft size={16} /> Back
        </button>
        <div className="eyebrow" style={{ color: 'var(--petrol)' }}>Step 2 of 4 · Demographics</div>
        <h2 className="serif" style={{ fontSize: 44, margin: '12px 0 8px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
          Tell us about yourself.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 32, maxWidth: 520 }}>
          Demographic factors materially improve risk prediction. All fields are required.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>Age (years)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="number" className="input-field" value={form.age ?? ''}
                onChange={e => update('age', e.target.value ? +e.target.value : '')}
                placeholder="e.g. 42" min={5} max={80} style={{ width: 140 }} />
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Validated range 5–80</span>
            </div>
          </div>

          <div>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>Sex</label>
            <SelectPills value={form.gender ?? ''} onChange={v => update('gender', v)}
              options={['Male', 'Female', 'Prefer not to say']} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 8 }}>Weight (kg)</label>
              <input type="number" className="input-field" value={form.weight ?? ''}
                onChange={e => update('weight', e.target.value ? +e.target.value : '')}
                placeholder="e.g. 68" min={10} max={200} />
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 8 }}>Height (cm)</label>
              <input type="number" className="input-field" value={form.height ?? ''}
                onChange={e => update('height', e.target.value ? +e.target.value : '')}
                placeholder="e.g. 170" min={50} max={250} />
            </div>
          </div>

          {bmi && (
            <div style={{ padding: '10px 14px', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 12 }}>
              <span className="label">BMI</span>
              <span className="mono" style={{ color: 'var(--ink)' }}>{bmi}</span>
              <span style={{ color: 'var(--ink-3)' }}>
                {Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'}
              </span>
            </div>
          )}

          <div>
            <label className="label" style={{ display: 'block', marginBottom: 8 }}>Ethnicity</label>
            <SelectPills value={form.race ?? ''} onChange={v => update('race', v)}
              options={['Malay', 'Chinese', 'Indian', 'Other']} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-lg" disabled={!valid} style={{ flex: 1 }}
            onClick={() => valid && onSubmit(form as Demographics)}>
            Continue to scan <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
