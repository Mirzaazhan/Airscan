'use client';

import { useState } from 'react';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import type { Demographics, StopBang } from '@/lib/types';

interface Props {
  demographics: Demographics | null;
  onSubmit: (data: StopBang) => void;
  onBack: () => void;
  initial: StopBang | null;
}

export function QuestionnaireScreen({ demographics, onSubmit, onBack, initial }: Props) {
  // Derived values from Demographics
  const bmiValue = demographics?.weight && demographics?.height 
    ? (demographics.weight / Math.pow(demographics.height / 100, 2)) 
    : 0;
  
  const derivedBmi = bmiValue > 35;
  const derivedAge = (demographics?.age ?? 0) > 50;
  const derivedGender = demographics?.gender === 'Male';

  const [form, setForm] = useState<{
    snoring?: boolean;
    tired?: boolean;
    observed?: boolean;
    pressure?: boolean;
  }>(initial ?? {
    snoring: undefined,
    tired: undefined,
    observed: undefined,
    pressure: undefined,
  });

  const update = (k: keyof typeof form, v: boolean) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.snoring !== undefined && 
                form.tired !== undefined && 
                form.observed !== undefined && 
                form.pressure !== undefined;

  const handleSubmit = () => {
    if (!valid) return;
    
    // Calculate total STOP-BANG score
    let score = 0;
    if (form.snoring) score++;
    if (form.tired) score++;
    if (form.observed) score++;
    if (form.pressure) score++;
    if (derivedBmi) score++;
    if (derivedAge) score++;
    // neck is calculated later
    if (derivedGender) score++;

    onSubmit({
      snoring: form.snoring as boolean,
      tired: form.tired as boolean,
      observed: form.observed as boolean,
      pressure: form.pressure as boolean,
      bmi: derivedBmi,
      age: derivedAge,
      neck: false, // will be evaluated during the scan
      gender: derivedGender,
      score
    });
  };

  const YesNoToggle = ({ value, onChange }: { value?: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={() => onChange(true)} style={{
        padding: '8px 20px', fontSize: 13, flex: 1,
        background: value === true ? 'var(--terra)' : 'var(--surface)',
        color: value === true ? 'white' : 'var(--ink)',
        border: '1px solid ' + (value === true ? 'var(--terra)' : 'var(--line)'),
        borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      }}>Yes</button>
      <button type="button" onClick={() => onChange(false)} style={{
        padding: '8px 20px', fontSize: 13, flex: 1,
        background: value === false ? 'var(--petrol-ink)' : 'var(--surface)',
        color: value === false ? 'white' : 'var(--ink)',
        border: '1px solid ' + (value === false ? 'var(--petrol-ink)' : 'var(--line)'),
        borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      }}>No</button>
    </div>
  );

  const DerivedToggle = ({ value, label }: { value: boolean; label: string }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" disabled style={{
        padding: '8px 20px', fontSize: 13, flex: 1,
        background: value === true ? 'var(--paper-2)' : 'var(--surface)',
        color: value === true ? 'var(--ink)' : 'var(--ink-4)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontWeight: 500, opacity: value ? 1 : 0.4
      }}>Yes</button>
      <button type="button" disabled style={{
        padding: '8px 20px', fontSize: 13, flex: 1,
        background: value === false ? 'var(--paper-2)' : 'var(--surface)',
        color: value === false ? 'var(--ink)' : 'var(--ink-4)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontWeight: 500, opacity: !value ? 1 : 0.4
      }}>No</button>
      <span style={{ fontSize: 12, color: 'var(--ink-3)', alignSelf: 'center', marginLeft: 8, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: 'clamp(24px, 5vh, 40px) clamp(16px, 5vw, 64px)', background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.015 130 / 0.35) 100%)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ height: 4, flex: 1, borderRadius: 2, background: n <= 3 ? 'var(--petrol)' : 'var(--line)' }}/>
          ))}
        </div>
        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 14 }}>Step 3 of 4 · STOP-BANG Questionnaire</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px, 5vw, 44px)', margin: '0 0 12px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
          Additional Risk Factors
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 32, maxWidth: 520 }}>
          The STOP-BANG questionnaire is a clinical tool used to screen for Obstructive Sleep Apnea.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>STOP</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>S - Snoring</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Do you snore loudly (louder than talking or loud enough to be heard through closed doors)?</p>
                <YesNoToggle value={form.snoring} onChange={v => update('snoring', v)} />
              </div>
              
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>T - Tired</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Do you often feel tired, fatigued, or sleepy during the daytime?</p>
                <YesNoToggle value={form.tired} onChange={v => update('tired', v)} />
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>O - Observed</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Has anyone observed you stop breathing during your sleep?</p>
                <YesNoToggle value={form.observed} onChange={v => update('observed', v)} />
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>P - Pressure</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Do you have (or are you being treated for) high blood pressure?</p>
                <YesNoToggle value={form.pressure} onChange={v => update('pressure', v)} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>BANG</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>B - BMI</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Is your body mass index (BMI) greater than 35 kg/m²?</p>
                <DerivedToggle value={derivedBmi} label="Derived from Demographics" />
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>A - Age</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Are you older than 50 years?</p>
                <DerivedToggle value={derivedAge} label="Derived from Demographics" />
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>N - Neck Circumference</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Is your neck circumference greater than 40 cm (16 inches)?</p>
                <div style={{ padding: '8px 20px', fontSize: 13, background: 'var(--surface)', color: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', textAlign: 'center', fontWeight: 500 }}>
                  Will be automatically measured during facial scan
                </div>
              </div>

              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>G - Gender</label>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 12px' }}>Are you male?</p>
                <DerivedToggle value={derivedGender} label="Derived from Demographics" />
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-lg" disabled={!valid} style={{ flex: 1 }}
            onClick={handleSubmit}>
            Continue to scan <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
