'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconChevron, IconDownload, IconTrash, IconArrowLeft } from '@/components/ui/Icons';
import { downloadPDF } from '@/lib/pdf';
import type { ScanRecord, RiskLevel, ScanAngle, CraniofacialMeasurement } from '@/lib/types';

const RISK_COLORS: Record<RiskLevel, string> = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
const RISK_BG:     Record<RiskLevel, string> = { green: 'var(--sage-bg)', yellow: 'var(--amber-bg)', red: 'var(--terra-bg)' };

const FLAG_COLOR: Record<CraniofacialMeasurement['flag'], string> = {
  normal: 'var(--sage)', elevated: 'var(--amber)', high: 'var(--terra)',
};

function HistoryRow({ scan, onClick }: { scan: ScanRecord; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'block', padding: 0, background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {/* Desktop layout */}
      <div className="history-row-desktop" style={{ alignItems: 'center', padding: '14px 16px' }}>
        <span className="chip" style={{ background: RISK_BG[scan.risk], color: 'var(--ink)', justifySelf: 'start' }}>
          <span className="dot" style={{ background: RISK_COLORS[scan.risk] }}/> <span style={{ textTransform: 'capitalize' }}>{scan.risk}</span>
        </span>
        <span style={{ fontSize: 13 }}>{scan.date}</span>
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }} className="mono">{Math.round(scan.confidence * 100)}%</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="mono">3 · 468pt</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="mono">{scan.id.slice(0, 8)}</span>
        <IconChevron size={16} style={{ color: 'var(--ink-4)' }}/>
      </div>
      {/* Mobile layout */}
      <div className="history-row-mobile" style={{ alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <span className="chip" style={{ background: RISK_BG[scan.risk], color: 'var(--ink)', flexShrink: 0 }}>
          <span className="dot" style={{ background: RISK_COLORS[scan.risk] }}/> <span style={{ textTransform: 'capitalize' }}>{scan.risk}</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{scan.date}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }} className="mono">{Math.round(scan.confidence * 100)}% · {scan.id.slice(0, 8)}</div>
        </div>
        <IconChevron size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }}/>
      </div>
    </button>
  );
}

function HistoryDetail({ scan, onBack, onDelete }: { scan: ScanRecord; onBack: () => void; onDelete: (s: ScanRecord) => void }) {
  const c = RISK_COLORS[scan.risk];
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF({
        scanId: scan.id,
        date: scan.date,
        risk: scan.risk,
        confidence: scan.confidence,
        message: scan.message,
        demographics: scan.demographics,
        stopBang: scan.stopBang,
        measurements: scan.measurements,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 16, paddingLeft: 0 }}>
        <IconArrowLeft size={16} /> Back to history
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Scan report</div>
          <h1 className="serif" style={{ fontSize: 36, margin: '6px 0 4px', letterSpacing: '-0.01em' }}>{scan.date}</h1>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>ID {scan.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} disabled={pdfLoading}>
            <IconDownload size={14} /> {pdfLoading ? 'Generating…' : 'PDF'}
          </button>
          <button className="btn btn-secondary" onClick={() => onDelete(scan)}><IconTrash size={14} /> Delete</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 12 }}>Captured angles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {(['front', 'left', 'right', 'mouth_open', 'tongue_out', 'tongue_rest', 'neck', 'nasal'] as ScanAngle[]).map(a => (
            <div key={a} style={{ position: 'relative', aspectRatio: '3 / 4', background: 'oklch(0.18 0.02 230)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
              {scan.imageRefs?.[a] ? (
                <img src={scan.imageRefs[a]} alt={`${a} angle`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'oklch(0.5 0.02 230)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', padding: 8 }}>No image</div>
              )}
              <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{a.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Result</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: c, display: 'grid', placeItems: 'center', color: 'white', fontFamily: 'var(--font-serif)', fontSize: 22, textTransform: 'capitalize' }}>{scan.risk}</div>
            <div>
              <div className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>{Math.round(scan.confidence * 100)}%</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>confidence</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 16 }}>{scan.message}</p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Demographics at scan</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            {[
              ['Age', scan.demographics.age + ' yr'],
              ['Sex', scan.demographics.gender],
              ['Weight', scan.demographics.weight + ' kg'],
              ['Height', scan.demographics.height + ' cm'],
              ['Ethnicity', scan.demographics.race],
              ['BMI', (scan.demographics.weight / Math.pow(scan.demographics.height / 100, 2)).toFixed(1)],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {scan.nasalAssessment && (
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 12 }}>Nasal assessment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              ['Aperture Width', `${scan.nasalAssessment.apertureWidthMm.toFixed(1)} mm`, scan.nasalAssessment.flags.aperture],
              ['Valve Angle (L)', `${scan.nasalAssessment.valveAngleLeft.toFixed(1)}°`, scan.nasalAssessment.valveAngleLeft < 10 ? 'high' : 'normal'],
              ['Valve Angle (R)', `${scan.nasalAssessment.valveAngleRight.toFixed(1)}°`, scan.nasalAssessment.valveAngleRight < 10 ? 'high' : 'normal'],
              ['Nostril Asymmetry', scan.nasalAssessment.asymmetryRatio.toFixed(2), scan.nasalAssessment.flags.asymmetry],
            ].map(([name, val, flag]) => {
              const fc = flag === 'high' ? 'var(--terra)' : flag === 'elevated' ? 'var(--amber)' : 'var(--sage)';
              return (
                <div key={String(name)} style={{ padding: 12, background: 'var(--paper-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 4 }}>{String(name)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{String(val)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: `${fc}-bg`, color: fc }}>{String(flag)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scan.measurements && scan.measurements.length > 0 && (
        <div className="card results-measure-wrap" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div className="results-measure-min">
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '12px 20px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
              <div>Measurement</div><div>Value</div><div>Normal range</div><div>Flag</div>
            </div>
            {scan.measurements.map((m, i) => (
              <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '14px 20px', alignItems: 'center', borderBottom: i < scan.measurements!.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
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
        </div>
      )}

      <div style={{ marginTop: 16 }}><Disclaimer /></div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, authLoaded, scans, deleteScan } = useScan();
  const [filter, setFilter] = useState<'all' | RiskLevel>('all');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  if (!authLoaded) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>;

  const filtered = filter === 'all' ? scans : scans.filter(s => s.risk === filter);
  const counts = { all: scans.length, green: scans.filter(s => s.risk === 'green').length, yellow: scans.filter(s => s.risk === 'yellow').length, red: scans.filter(s => s.risk === 'red').length };

  const handleDelete = (scan: ScanRecord) => {
    deleteScan(scan.id);
    setSelectedScan(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: '32px 40px 60px', overflow: 'auto' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {selectedScan ? (
            <HistoryDetail scan={selectedScan} onBack={() => setSelectedScan(null)} onDelete={handleDelete} />
          ) : (
            <>
              <div className="eyebrow" style={{ marginBottom: 8 }}>All scans</div>
              <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 44px)', margin: '0 0 24px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>Scan history</h1>

              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { k: 'all', label: 'All' },
                  { k: 'green', label: 'Low risk', dot: 'var(--sage)' },
                  { k: 'yellow', label: 'Elevated', dot: 'var(--amber)' },
                  { k: 'red', label: 'High concern', dot: 'var(--terra)' },
                ].map(t => (
                  <button key={t.k} onClick={() => setFilter(t.k as typeof filter)}
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, background: filter === t.k ? 'var(--petrol)' : 'var(--surface)', color: filter === t.k ? 'white' : 'var(--ink-2)', border: '1px solid ' + (filter === t.k ? 'var(--petrol)' : 'var(--line)'), borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                    {t.dot && <span className="dot" style={{ background: t.dot }}/>}
                    {t.label} <span style={{ opacity: 0.6, fontSize: 11 }}>({counts[t.k as keyof typeof counts]})</span>
                  </button>
                ))}
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="history-head-desktop" style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontWeight: 500 }}>
                  <div>Risk</div><div>Date</div><div>Confidence</div><div>Angles</div><div>Scan ID</div><div/>
                </div>
                {filtered.map(s => <HistoryRow key={s.id} scan={s} onClick={() => setSelectedScan(s)} />)}
                {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>No scans match this filter.</div>}
              </div>

              <div style={{ marginTop: 20 }}><Disclaimer /></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
