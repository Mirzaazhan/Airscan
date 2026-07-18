'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft } from '@/components/ui/Icons';
import { ImageViewerModal } from '@/components/admin/ImageViewerModal';
import { getUserProfile, listScansForUser } from '@/lib/admin';
import type { AdminUserRow } from '@/lib/admin';
import type { ScanRecord, RiskLevel } from '@/lib/types';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const RISK_COLORS: Record<RiskLevel, string> = { green: 'var(--sage)', yellow: 'var(--amber)', red: 'var(--terra)' };
const RISK_BG: Record<RiskLevel, string>     = { green: 'var(--sage-bg)', yellow: 'var(--amber-bg)', red: 'var(--terra-bg)' };
const RISK_LABEL: Record<RiskLevel, string>  = { green: 'Low risk', yellow: 'Elevated', red: 'High concern' };

function formatDateTime(ms?: number | string) {
  if (!ms) return '—';
  const ts = typeof ms === 'string' ? Date.parse(ms) : ms;
  return new Date(ts).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<AdminUserRow | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(FIREBASE_ENABLED);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [viewScan, setViewScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (!FIREBASE_ENABLED || !uid) return;
    async function load() {
      try {
        const [p, s] = await Promise.all([getUserProfile(uid), listScansForUser(uid)]);
        setProfile(p);
        setScans(s);
      } catch {
        setError('Failed to load scan data. Ensure Firestore rules are deployed.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid]);

  const filtered = scans.filter(s => {
    if (riskFilter !== 'all' && s.risk !== riskFilter) return false;
    if (dateFilter) {
      const scanDate = s.date ?? '';
      if (!scanDate.toLowerCase().includes(dateFilter.toLowerCase())) return false;
    }
    return true;
  });

  const riskCounts = {
    all: scans.length,
    green: scans.filter(s => s.risk === 'green').length,
    yellow: scans.filter(s => s.risk === 'yellow').length,
    red: scans.filter(s => s.risk === 'red').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <button className="btn btn-ghost" onClick={() => router.push('/admin/users')} style={{ marginBottom: 16, paddingLeft: 0 }}>
            <IconArrowLeft size={16} /> All users
          </button>

          {/* User header */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--petrol)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0, fontFamily: 'var(--font-sans)' }}>
              {(profile?.displayName ?? '?').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{loading ? '…' : (profile?.displayName ?? '—')}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{loading ? '' : (profile?.email ?? '—')}</div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Total scans</div>
                <div className="serif" style={{ fontSize: 24, color: 'var(--ink)' }}>{scans.length}</div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Role</div>
                <div>
                  {profile?.role === 'admin'
                    ? <span className="chip" style={{ background: 'var(--petrol)', color: 'white', fontSize: 11 }}>admin</span>
                    : <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>user</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="card" style={{ padding: 20, marginBottom: 16, background: 'var(--terra-bg)', border: '1px solid var(--terra)', color: 'var(--terra-ink)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { k: 'all', label: 'All' },
                { k: 'green', label: 'Low risk', dot: 'var(--sage)' },
                { k: 'yellow', label: 'Elevated', dot: 'var(--amber)' },
                { k: 'red', label: 'High concern', dot: 'var(--terra)' },
              ] as const).map(t => (
                <button
                  key={t.k}
                  onClick={() => setRiskFilter(t.k)}
                  style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, background: riskFilter === t.k ? 'var(--petrol)' : 'var(--surface)', color: riskFilter === t.k ? 'white' : 'var(--ink-2)', border: '1px solid ' + (riskFilter === t.k ? 'var(--petrol)' : 'var(--line)'), borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                  {'dot' in t && <span className="dot" style={{ background: t.dot }}/>}
                  {t.label} <span style={{ opacity: 0.6, fontSize: 10 }}>({riskCounts[t.k]})</span>
                </button>
              ))}
            </div>
            <input
              className="input-field"
              placeholder="Filter by date…"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ width: 180, marginLeft: 'auto' }}
            />
          </div>

          {/* Scan history table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 2fr 0.9fr 0.9fr 80px', padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontWeight: 500 }}>
              <div>Risk</div><div>Date / ID</div><div>Confidence</div><div>Image</div><div>Actions</div>
            </div>

            {loading && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No scans match this filter.
              </div>
            )}

            {filtered.map((scan, i) => (
              <div
                key={scan.id}
                style={{ display: 'grid', gridTemplateColumns: '90px 2fr 0.9fr 0.9fr 80px', alignItems: 'center', padding: '13px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line-2)' : 'none' }}>

                <span className="chip" style={{ background: RISK_BG[scan.risk], color: 'var(--ink)', width: 'fit-content' }}>
                  <span className="dot" style={{ background: RISK_COLORS[scan.risk] }}/>
                  <span style={{ textTransform: 'capitalize', fontSize: 11 }}>{RISK_LABEL[scan.risk]}</span>
                </span>

                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{formatDateTime(scan.date)}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{scan.id}</div>
                </div>

                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
                  {Math.round(scan.confidence * 100)}%
                </div>

                <div>
                  {scan.imageRefs?.front ? (
                    <img
                      src={scan.imageRefs.front}
                      alt="front"
                      style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--line)', cursor: 'pointer' }}
                      onClick={() => setViewScan(scan)}
                    />
                  ) : (
                    <div style={{ width: 40, height: 52, background: 'var(--paper-2)', borderRadius: 4, border: '1px solid var(--line)', display: 'grid', placeItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>—</span>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-ghost"
                  onClick={() => setViewScan(scan)}
                  style={{ fontSize: 11, padding: '6px 10px' }}>
                  View
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
        </div>
      </div>

      {viewScan && (
        <ImageViewerModal scan={viewScan} onClose={() => setViewScan(null)} />
      )}
    </div>
  );
}
