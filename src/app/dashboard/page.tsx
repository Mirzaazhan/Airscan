'use client';

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
      padding: '12px 8px', background: 'transparent', border: 'none',
      borderBottom: '1px solid var(--line-2)', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left', width: '100%',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: bgs[scan.risk], display: 'grid', placeItems: 'center' }}>
        <span className="dot" style={{ width: 10, height: 10, background: colors[scan.risk] }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
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
  const { user, scans } = useScan();
  const last = scans[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ overflow: 'auto', padding: '32px 40px 60px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>
            {new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="serif" style={{ fontSize: 48, margin: '8px 0 4px', letterSpacing: '-0.01em' }}>
            Good morning, {user?.displayName.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 4px' }}>
            {scans.length} scan{scans.length !== 1 ? 's' : ''} on file · last on {last ? last.date : '—'}
          </p>

          {/* Hero CTA */}
          <div style={{
            marginTop: 28, padding: 32,
            background: 'var(--petrol-ink)', color: 'white',
            borderRadius: 'var(--r-lg)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}/>
            <div style={{ position: 'absolute', right: 10, top: 10, width: 140, height: 140, border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%' }}/>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Start a new session</div>
            <h2 className="serif" style={{ fontSize: 36, margin: '10px 0', letterSpacing: '-0.01em', maxWidth: 480 }}>
              Begin a three-angle airway scan
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px', maxWidth: 440 }}>
              Takes approximately 60 seconds. Hold your device at eye level in a well-lit room.
            </p>
            <button className="btn btn-lg" onClick={() => router.push('/scan')}
              style={{ background: 'white', color: 'var(--petrol-ink)' }}>
              <IconScan size={18} /> Start new scan
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Last result', value: last?.risk || '—', chip: last?.risk as string | undefined },
              { label: 'Confidence', value: last ? Math.round(last.confidence * 100) + '%' : '—' },
              { label: 'Total scans', value: String(scans.length) },
              { label: 'Avg. interval', value: '42d' },
            ].map((s, i) => {
              const riskColors: Record<string, string> = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
              return (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="label">{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500, marginTop: 6, color: 'var(--ink)', textTransform: s.chip ? 'capitalize' : 'none', fontFamily: s.chip ? 'var(--font-sans)' : 'var(--font-serif)' }}>
                    {s.chip && <span className="dot" style={{ marginRight: 8, width: 10, height: 10, background: riskColors[s.chip] ?? 'var(--ink-4)' }}/>}
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent scans + tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Recent scans</h3>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => router.push('/history')}>
                  View all <IconChevron size={14}/>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {scans.slice(0, 4).map((s, i) => (
                  <ScanRow key={i} scan={s} onClick={() => router.push('/history')} />
                ))}
                {scans.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    No scans yet. Start your first one above.
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Before you scan</h3>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Well-lit room', 'Avoid direct backlight from windows.'],
                  ['Remove glasses', 'And any face coverings or heavy makeup.'],
                  ['Eye level', "Hold your phone at eye level, arm's length away."],
                  ['Be still', 'The scan auto-captures once your face is stable.'],
                ].map(([t, b], i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--paper-2)', border: '1px solid var(--line)',
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)',
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
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
