'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { useScan } from '@/contexts/ScanContext';
import { IconScan, IconChevron } from '@/components/ui/Icons';
import type { ScanRecord } from '@/lib/types';

function ScanRow({ scan, onClick }: { scan: ScanRecord; onClick: () => void }) {
  const colors = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
  const bgs    = { green: 'var(--sage-bg)', yellow: 'var(--amber-bg)', red: 'var(--terra-bg)' };
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', background: 'transparent', border: 'none',
      borderBottom: '1px solid var(--line-2)', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left', width: '100%',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', flexShrink: 0, background: bgs[scan.risk], display: 'grid', placeItems: 'center' }}>
        <span className="dot" style={{ width: 10, height: 10, background: colors[scan.risk] }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize', color: 'var(--ink)' }}>
          {scan.risk} — {scan.message.slice(0, 40)}{scan.message.length > 40 ? '…' : ''}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
          {scan.date} · conf {Math.round(scan.confidence * 100)}% · ID {scan.id.slice(0, 8)}
        </div>
      </div>
      <IconChevron size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }}/>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, authLoaded, scans } = useScan();
  const last = scans[0];

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  if (!authLoaded) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ overflow: 'auto', padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 6px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              Good morning, {user?.displayName?.split(' ')[0]}.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
              {scans.length} scan{scans.length !== 1 ? 's' : ''} on file{last ? ` · last on ${last.date}` : ''}
            </p>
          </div>

          {/* Hero CTA — sage green */}
          <div style={{
            padding: '36px 40px', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, var(--petrol) 0%, oklch(0.52 0.07 152) 100%)',
            color: 'white', position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%' }}/>
            <div style={{ position: 'absolute', right: 20, top: 20, width: 160, height: 160, border: '1px solid rgba(255,255,255,0.18)', borderRadius: '50%' }}/>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>Start a new session</div>
            <h2 className="serif" style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: '0 0 12px', maxWidth: 480 }}>
              Begin a three-angle airway scan
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', maxWidth: 440 }}>
              Takes approximately 60 seconds. Hold your device at eye level in a well-lit room.
            </p>
            <button className="btn btn-lg" onClick={() => router.push('/scan')}
              style={{ background: 'white', color: 'var(--petrol-ink)', borderRadius: 'var(--r-full)', fontWeight: 600 }}>
              <IconScan size={17} /> Start new scan
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid-4" style={{ marginTop: 20 }}>
            {[
              { label: 'Last result', value: last?.risk || '—', chip: last?.risk as string | undefined },
              { label: 'Confidence', value: last ? Math.round(last.confidence * 100) + '%' : '—' },
              { label: 'Total scans', value: String(scans.length) },
              { label: 'Avg. interval', value: '42d' },
            ].map((s, i) => {
              const riskColors: Record<string, string> = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
              return (
                <div key={i} className="card" style={{ padding: '18px 20px' }}>
                  <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', textTransform: s.chip ? 'capitalize' : 'none', fontFamily: s.chip ? 'var(--font-sans)' : 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.chip && <span className="dot" style={{ width: 10, height: 10, background: riskColors[s.chip] ?? 'var(--ink-4)', flexShrink: 0 }}/>}
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent scans + tips */}
          <div className="dashboard-cols" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
            {/* Recent scans */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid var(--line-2)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Recent scans</h3>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--r-full)' }} onClick={() => router.push('/history')}>
                  View all <IconChevron size={13}/>
                </button>
              </div>
              <div>
                {scans.slice(0, 4).map((s, i) => (
                  <ScanRow key={i} scan={s} onClick={() => router.push('/history')} />
                ))}
                {scans.length === 0 && (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    No scans yet. Start your first one above.
                  </div>
                )}
              </div>
            </div>

            {/* Before you scan tips */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: 'var(--ink)' }}>Before you scan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Well-lit room', 'Avoid direct backlight from windows.'],
                  ['Remove glasses', 'And any face coverings or heavy makeup.'],
                  ['Eye level', "Hold your phone at eye level, arm's length away."],
                  ['Be still', 'The scan auto-captures once your face is stable.'],
                ].map(([t, b], i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--sage-bg)', border: '1px solid var(--sage)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--sage-ink)',
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{t}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
        </div>
      </div>
    </div>
  );
}
