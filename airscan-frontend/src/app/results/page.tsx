'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconCheck, IconDownload, IconDocument, IconHistory } from '@/components/ui/Icons';
import { ThreeDModel } from '@/components/ThreeDModel';
import { downloadPDF } from '@/lib/pdf';
import type { RiskLevel, CraniofacialMeasurement } from '@/lib/types';

const COLOR_MAP: Record<RiskLevel, { ring: string; bg: string; ink: string; label: string }> = {
  green:  { ring: 'var(--sage)',  bg: 'var(--sage-bg)',  ink: 'var(--sage-ink)',  label: 'Low risk' },
  yellow: { ring: 'var(--amber)', bg: 'var(--amber-bg)', ink: 'var(--amber-ink)', label: 'Elevated' },
  red:    { ring: 'var(--terra)', bg: 'var(--terra-bg)', ink: 'var(--terra-ink)', label: 'High concern' },
};
const FLAG_COLOR: Record<CraniofacialMeasurement['flag'], string> = {
  normal: 'var(--sage)', elevated: 'var(--amber)', high: 'var(--terra)',
};

type Tab = 'summary' | 'measurements' | '3d';

export default function ResultsPage() {
  const router = useRouter();
  const { result, demographics } = useScan();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [pdfLoading, setPdfLoading] = useState(false);

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
  const date = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF({
        scanId: result.scan_id,
        date,
        risk: result.risk,
        confidence: result.confidence,
        message: result.message,
        demographics: demo,
        measurements: result.measurements,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'measurements', label: `Measurements ${result.measurements ? `(${result.measurements.length})` : ''}` },
    { key: '3d', label: '3D Model' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: '32px 40px 60px', overflow: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>
              Report · {date}
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>ID {result.scan_id.slice(0, 8)}</span>
          </div>

          {/* Top strip: risk badge + action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 20 }}>
            <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: c.ring, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: 20, textTransform: 'capitalize' }}>{result.risk[0]}</span>
              </div>
              <div>
                <div className="eyebrow" style={{ color: c.ink }}>{c.label}</div>
                <div className="serif" style={{ fontSize: 26, lineHeight: 1.1 }}>{Math.round(result.confidence * 100)}% confidence</div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.5 }}>{result.message}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => router.push('/history')}>
                <IconCheck size={14} /> Save to history
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadPDF} disabled={pdfLoading}>
                <IconDownload size={14} /> {pdfLoading ? 'Generating…' : 'Download PDF'}
              </button>
              <button className="btn btn-secondary">
                <IconDocument size={14} /> Book consultation
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: '1px solid var(--line)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '10px 18px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                borderBottom: activeTab === t.key ? '2px solid var(--petrol-ink)' : '2px solid transparent',
                color: activeTab === t.key ? 'var(--ink)' : 'var(--ink-3)',
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Summary ── */}
          {activeTab === 'summary' && (
            <div style={{ paddingTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div className="label" style={{ marginBottom: 12 }}>Craniofacial features</div>
                  {[
                    ['Jaw-to-skull ratio', 0.62, 'normal'],
                    ['Mandibular plane angle', result.risk === 'red' ? 0.78 : result.risk === 'yellow' ? 0.65 : 0.44, result.risk === 'red' ? 'high' : result.risk === 'yellow' ? 'elevated' : 'normal'],
                    ['Oropharyngeal crowding', result.risk === 'green' ? 0.31 : result.risk === 'red' ? 0.82 : 0.58, result.risk === 'red' ? 'high' : result.risk === 'yellow' ? 'elevated' : 'normal'],
                    ['Facial width / height', 0.55, 'normal'],
                    ['Neck circumference est.', 0.48, 'normal'],
                  ].map(([name, val, flag]) => {
                    const fc = flag === 'high' ? 'var(--terra)' : flag === 'elevated' ? 'var(--amber)' : 'var(--sage)';
                    return (
                      <div key={String(name)} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--ink-2)' }}>{String(name)}</span>
                          <span className="mono" style={{ color: 'var(--ink-3)' }}>{Number(val).toFixed(2)}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: fc, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <div className="label" style={{ marginBottom: 12 }}>Demographic features</div>
                  {[
                    ['BMI', Math.min(1, bmi / 40)],
                    ['Age group', Math.min(1, demo.age / 80)],
                    ['Sex factor', 0.50],
                    ['Snoring indicator', demo.snoring === 'Every night' ? 0.95 : demo.snoring === 'Sometimes' ? 0.6 : demo.snoring === 'Rarely' ? 0.3 : 0.05],
                  ].map(([name, val]) => (
                    <div key={String(name)} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{String(name)}</span>
                        <span className="mono" style={{ color: 'var(--ink-3)' }}>{Number(val).toFixed(2)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: 'var(--petrol)', borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 'var(--r-sm)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                    Values normalised 0–1. Flags are model-internal and not standalone diagnostic criteria.
                  </div>
                </div>
              </div>

              {/* What this means */}
              <div className="card" style={{ padding: 20, marginTop: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Clinical interpretation</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                  {result.risk === 'green' && 'No significant craniofacial markers associated with airway obstruction were detected. Continue routine oral health monitoring and re-screen annually.'}
                  {result.risk === 'yellow' && 'Several moderate risk indicators were detected. A follow-up consultation with a physician or ENT specialist is recommended within 4 weeks.'}
                  {result.risk === 'red' && 'Multiple strong risk indicators were detected. You are advised to seek evaluation from a qualified medical practitioner promptly. Polysomnography (sleep study) is strongly recommended.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: Measurements ── */}
          {activeTab === 'measurements' && (
            <div style={{ paddingTop: 20 }}>
              {result.measurements && result.measurements.length > 0 ? (
                <>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '12px 20px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                      <div>Measurement</div><div>Value</div><div>Normal range</div><div>Flag</div>
                    </div>
                    {result.measurements.map((m, i) => (
                      <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '14px 20px', alignItems: 'center', borderBottom: i < result.measurements!.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{m.significance}</div>
                        </div>
                        <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: FLAG_COLOR[m.flag] }}>
                          {m.valueMm} mm
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.norm} mm</div>
                        <div>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: m.flag === 'high' ? 'var(--terra-bg)' : m.flag === 'elevated' ? 'var(--amber-bg)' : 'var(--sage-bg)', color: FLAG_COLOR[m.flag] }}>
                            {m.flag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: 16, marginTop: 12, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--ink-2)' }}>Clinical note:</strong> Bigonial/bizygomatic ratio &lt;0.68 and lower face ratio &gt;0.60 are established OSA structural predictors. Mandibular length is the strongest single anatomical predictor.
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
                  No measurement data available for this scan.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: 3D Model ── */}
          {activeTab === '3d' && (
            <div style={{ paddingTop: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <ThreeDModel />
              </div>
              <div className="card" style={{ padding: 16, marginTop: 12 }}>
                <div className="label" style={{ marginBottom: 10 }}>Landmark index</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {['Cranial', 'Airway', 'Jaw', 'Oral', 'Facial', 'Orbital'].map(group => {
                    const groupColors: Record<string, string> = { Cranial: '#00c9a7', Airway: '#ffa94d', Jaw: '#ff5c5c', Oral: '#60a5fa', Facial: '#c084fc', Orbital: '#60a5fa' };
                    return (
                      <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: groupColors[group], display: 'inline-block', flexShrink: 0 }} />
                        {group}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/history')}>
              <IconHistory size={14} /> View past scans
            </button>
            <span style={{ flex: 1 }} />
            <button className="btn btn-secondary" onClick={() => router.push('/scan')}>
              Start another scan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
