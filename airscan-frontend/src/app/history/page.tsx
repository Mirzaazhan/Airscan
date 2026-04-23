'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconChevron, IconDownload, IconTrash, IconArrowLeft } from '@/components/ui/Icons';
import { CameraFeed } from '@/components/FaceMesh';
import type { ScanRecord, RiskLevel, ScanAngle } from '@/lib/types';

const RISK_COLORS: Record<RiskLevel, string> = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
const RISK_BG:     Record<RiskLevel, string> = { green: 'var(--sage-bg)', yellow: 'var(--amber-bg)', red: 'var(--terra-bg)' };

function HistoryRow({ scan, onClick }: { scan: ScanRecord; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 1fr 60px', alignItems: 'center', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span className="chip" style={{ background: RISK_BG[scan.risk], color: 'var(--ink)', justifySelf: 'start' }}>
        <span className="dot" style={{ background: RISK_COLORS[scan.risk] }}/> <span style={{ textTransform: 'capitalize' }}>{scan.risk}</span>
      </span>
      <span style={{ fontSize: 13 }}>{scan.date}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-2)' }} className="mono">{Math.round(scan.confidence * 100)}%</span>
      <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="mono">3 · 468pt</span>
      <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="mono">{scan.id.slice(0, 8)}</span>
      <IconChevron size={16} style={{ color: 'var(--ink-4)' }}/>
    </button>
  );
}

function HistoryDetail({ scan, onBack, onDelete }: { scan: ScanRecord; onBack: () => void; onDelete: (s: ScanRecord) => void }) {
  const c = RISK_COLORS[scan.risk];
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
          <button className="btn btn-secondary"><IconDownload size={14} /> PDF</button>
          <button className="btn btn-secondary" onClick={() => onDelete(scan)}><IconTrash size={14} /> Delete</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 12 }}>Captured angles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {(['front', 'left', 'right'] as ScanAngle[]).map(a => (
            <div key={a} style={{ position: 'relative', aspectRatio: '3 / 4', background: 'oklch(0.18 0.02 230)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
              <CameraFeed angle={a} size={220} stability={0.95} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{a}</div>
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
              <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>All scans</div>
              <h1 className="serif" style={{ fontSize: 44, margin: '8px 0 24px', letterSpacing: '-0.01em' }}>Scan history</h1>

              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { k: 'all', label: 'All' },
                  { k: 'green', label: 'Low risk', dot: 'var(--sage)' },
                  { k: 'yellow', label: 'Elevated', dot: 'var(--amber)' },
                  { k: 'red', label: 'High concern', dot: 'var(--terra)' },
                ].map(t => (
                  <button key={t.k} onClick={() => setFilter(t.k as typeof filter)}
                    style={{ padding: '7px 12px', fontSize: 13, fontWeight: 500, background: filter === t.k ? 'var(--ink)' : 'var(--surface)', color: filter === t.k ? 'white' : 'var(--ink-2)', border: '1px solid ' + (filter === t.k ? 'var(--ink)' : 'var(--line)'), borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {t.dot && <span className="dot" style={{ background: t.dot }}/>}
                    {t.label} <span style={{ opacity: 0.5, fontSize: 11 }}>({counts[t.k as keyof typeof counts]})</span>
                  </button>
                ))}
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 1fr 60px', padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontWeight: 500 }}>
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
