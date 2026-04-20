'use client';

import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconCheck, IconDownload, IconDocument, IconHistory } from '@/components/ui/Icons';
import type { RiskLevel } from '@/lib/types';

function FeatureBar({ name, value, flag }: { name: string; value: number; flag: 'normal' | 'mod' | 'high' }) {
  const flagColor = flag === 'high' ? 'var(--terra)' : flag === 'mod' ? 'var(--amber)' : 'var(--sage)';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--ink-2)' }}>{name}</span>
        <span className="mono" style={{ color: 'var(--ink-3)' }}>{value.toFixed(2)}</span>
      </div>
      <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${value * 100}%`, background: flagColor, borderRadius: 3 }}/>
      </div>
    </div>
  );
}

const COLOR_MAP: Record<RiskLevel, { ring: string; bg: string; ink: string; label: string }> = {
  green:  { ring: 'var(--sage)',  bg: 'var(--sage-bg)',  ink: 'var(--sage-ink)',  label: 'Low risk' },
  yellow: { ring: 'var(--amber)', bg: 'var(--amber-bg)', ink: 'var(--amber-ink)', label: 'Elevated' },
  red:    { ring: 'var(--terra)', bg: 'var(--terra-bg)', ink: 'var(--terra-ink)', label: 'High concern' },
};

export default function ResultsPage() {
  const router = useRouter();
  const { result, demographics } = useScan();

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <TopBar />
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
          No result available. <button className="btn btn-ghost" onClick={() => router.push('/scan')}>Start a scan</button>
        </div>
      </div>
    );
  }

  const c = COLOR_MAP[result.risk];
  const demo = demographics ?? { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay' };
  const bmi = demo.weight / Math.pow(demo.height / 100, 2);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: '32px 40px 60px', overflow: 'auto' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>
              Report · {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>ID {result.scan_id.slice(0, 8)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
            {/* Big result card */}
            <div className="card" style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div className="eyebrow" style={{ color: c.ink }}>{c.label}</div>
              <div style={{ position: 'relative', width: 200, height: 200, margin: '24px 0 20px' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill={c.bg}/>
                  <circle cx="100" cy="100" r="90" fill="none" stroke={c.ring} strokeWidth="2" strokeDasharray="2 6"/>
                  <circle cx="100" cy="100" r="70" fill={c.ring}/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'white', fontFamily: 'var(--font-serif)', fontSize: 52, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                  {result.risk}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
                <div>
                  <div className="label">Confidence</div>
                  <div className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>{Math.round(result.confidence * 100)}%</div>
                </div>
                <div style={{ width: 1, background: 'var(--line)' }}/>
                <div>
                  <div className="label">Model</div>
                  <div className="mono" style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>airway-v1.0</div>
                </div>
              </div>
              <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 420 }}>
                {result.message}
              </p>
            </div>

            {/* Side panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>What this means</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '10px 0 0' }}>
                  {result.risk === 'green' && 'No significant craniofacial markers associated with airway obstruction were detected. Continue routine oral health monitoring.'}
                  {result.risk === 'yellow' && 'Several moderate risk indicators were detected. A follow-up consultation with a physician or ENT specialist is recommended within 4 weeks.'}
                  {result.risk === 'red' && 'Multiple strong risk indicators were detected. You are advised to seek evaluation from a qualified medical practitioner promptly.'}
                </p>
                <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }}>
                  <IconDocument size={14} /> Book a consultation
                </button>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Export & save</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => router.push('/history')}>
                    <IconCheck size={14} /> Save to history
                  </button>
                  <button className="btn btn-secondary">
                    <IconDownload size={14} /> Download PDF report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="card" style={{ padding: 28, marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Detailed breakdown</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 20px' }}>Individual feature contributions to the final score.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div className="label" style={{ marginBottom: 12 }}>Craniofacial features</div>
                {[
                  ['Jaw-to-skull ratio', 0.62, 'normal'],
                  ['Mandibular plane angle', 0.71, result.risk === 'red' ? 'high' : result.risk === 'yellow' ? 'mod' : 'normal'],
                  ['Neck circumference est.', 0.48, 'normal'],
                  ['Oropharyngeal crowding est.', result.risk === 'green' ? 0.31 : 0.68, result.risk === 'red' ? 'high' : 'mod'],
                  ['Facial width / height', 0.55, 'normal'],
                ].map(([name, val, flag]) => <FeatureBar key={String(name)} name={String(name)} value={Number(val)} flag={flag as 'normal' | 'mod' | 'high'} />)}
              </div>
              <div>
                <div className="label" style={{ marginBottom: 12 }}>Demographic features</div>
                {[
                  ['BMI', Math.min(1, bmi / 40), 'normal'],
                  ['Age group', Math.min(1, demo.age / 80), 'normal'],
                  ['Sex factor', 0.50, 'normal'],
                  ['Ethnicity factor', 0.42, 'normal'],
                ].map(([name, val, flag]) => <FeatureBar key={String(name)} name={String(name)} value={Number(val)} flag={flag as 'normal' | 'mod' | 'high'} />)}
                <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 'var(--r-sm)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  Feature values shown are normalised 0–1. Flags are model-internal and do not constitute standalone diagnostic criteria.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}><Disclaimer /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/history')}>
              <IconHistory size={14} /> View past scans
            </button>
            <span style={{ flex: 1 }}/>
            <button className="btn btn-secondary" onClick={() => router.push('/scan')}>
              Start another scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
