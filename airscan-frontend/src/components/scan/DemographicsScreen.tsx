'use client';

import { useState } from 'react';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import { useScan } from '@/contexts/ScanContext';
import type { Demographics } from '@/lib/types';

interface Props {
  onSubmit: (form: Demographics) => void;
  onBack: () => void;
  initial: Demographics | null;
}

export function DemographicsScreen({ onSubmit, onBack, initial }: Props) {
  const { user } = useScan();
  const [form, setForm] = useState<Partial<Demographics>>(initial ?? {
    age: undefined, gender: '', weight: undefined, height: undefined, race: '',
  });
  const update = (k: keyof Demographics, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const age = Number(form.age), weight = Number(form.weight), height = Number(form.height);
  const valid = age >= 5 && age <= 80 && weight >= 10 && weight <= 200 && height >= 50 && height <= 250
    && !!form.gender && !!form.race;
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

  const SelectPills = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 500,
          background: value === o ? 'var(--petrol)' : 'var(--surface)',
          color: value === o ? 'white' : 'var(--ink)',
          border: '1.5px solid ' + (value === o ? 'var(--petrol)' : 'var(--line)'),
          borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}>{o}</button>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', overflow: 'auto',
      padding: 'clamp(32px, 6vh, 56px) clamp(16px, 6vw, 64px)',
      background: 'linear-gradient(160deg, oklch(0.97 0.02 85) 0%, oklch(0.975 0.015 130 / 0.5) 100%)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{
              height: 4, flex: 1, borderRadius: 2,
              background: n <= 2 ? 'var(--petrol)' : 'var(--line)',
              transition: 'background 0.3s',
            }}/>
          ))}
        </div>

        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 14 }}>Step 2 of 4 · Demographics</div>
        <h2 className="serif" style={{ fontSize: 'clamp(28px, 5vw, 44px)', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          Let&apos;s get to know you better.
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 32, maxWidth: 520 }}>
          Your information helps us personalise your sleep wellness journey and improves risk prediction accuracy.
        </p>

        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r-xl)',
          padding: 'clamp(20px, 4vw, 36px)', boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {/* Full Name placeholder row */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Full Name</label>
              <input type="text" className="input-field" placeholder="e.g. Jane Doe" disabled value={user?.displayName ?? ''} style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            {/* Age */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Date of Birth (Age)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="number" className="input-field" value={form.age ?? ''}
                  onChange={e => update('age', e.target.value ? +e.target.value : '')}
                  placeholder="e.g. 42" min={5} max={80} style={{ width: 140 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Validated range 5–80</span>
              </div>
            </div>

            {/* Sex */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Gender</label>
              <SelectPills value={form.gender ?? ''} onChange={v => update('gender', v)}
                options={['Male', 'Female', 'Non-binary', 'Prefer not to say']} />
            </div>

            {/* Weight / Height */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Weight (kg)</label>
                <input type="number" className="input-field" value={form.weight ?? ''}
                  onChange={e => update('weight', e.target.value ? +e.target.value : '')}
                  placeholder="e.g. 68" min={10} max={200} />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Height (cm)</label>
                <input type="number" className="input-field" value={form.height ?? ''}
                  onChange={e => update('height', e.target.value ? +e.target.value : '')}
                  placeholder="e.g. 170" min={50} max={250} />
              </div>
            </div>

            {/* BMI display */}
            {bmi && (
              <div style={{ padding: '12px 16px', background: 'var(--sage-bg)', border: '1px solid var(--sage)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--sage-ink)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span className="label" style={{ color: 'var(--sage-ink)' }}>BMI</span>
                <span style={{ fontWeight: 600 }}>{bmi}</span>
                <span style={{ color: 'var(--sage-ink)', opacity: 0.8 }}>
                  {Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'}
                </span>
              </div>
            )}

            {/* Zip Code / Country row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8, color: 'var(--ink-2)' }}>Ethnicity</label>
                <SelectPills value={form.race ?? ''} onChange={v => update('race', v)}
                  options={['Malay', 'Chinese', 'Indian', 'Other']} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-lg" disabled={!valid} style={{ flex: 1 }}
            onClick={() => valid && onSubmit(form as Demographics)}>
            Continue <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
