'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { StatCard } from '@/components/admin/StatCard';
import { RiskDistributionChart } from '@/components/admin/RiskDistributionChart';
import { ActivityChart } from '@/components/admin/ActivityChart';
import { getSummaryStats, listRecentScans } from '@/lib/admin';
import type { SummaryStats } from '@/lib/admin';
import type { RiskLevel } from '@/lib/types';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [recentScans, setRecentScans] = useState<{ createdAt?: number; risk: RiskLevel }[]>([]);
  const [loading, setLoading] = useState(FIREBASE_ENABLED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FIREBASE_ENABLED) return;

    async function load() {
      try {
        const [s, r] = await Promise.all([getSummaryStats(), listRecentScans(200)]);
        setStats(s);
        setRecentScans(r);
      } catch (e: unknown) {
        const err = e as { message?: string; code?: string };
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          setError('One or more Firestore indexes are missing. Open the browser console, click the auto-generated link to create the required index, then reload this page.');
        } else {
          setError('Failed to load admin data. Check that Firestore security rules are deployed and you have admin access.');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const elevated = stats ? stats.totalScans - stats.lowRiskScans - stats.highRiskScans : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Admin</div>
            <h1 className="serif" style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 6px', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
              Overview of all users and scans across the platform.
            </p>
          </div>

          {!FIREBASE_ENABLED && (
            <div className="card" style={{ padding: 24, color: 'var(--amber-ink)', background: 'var(--amber-bg)', border: '1px solid var(--amber)', marginBottom: 24 }}>
              Firebase is not configured — admin data is unavailable in mock mode.
            </div>
          )}

          {error && (
            <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--terra-bg)', border: '1px solid var(--terra)', color: 'var(--terra-ink)', fontSize: 13, lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <StatCard label="Registered Users" value={loading ? '…' : (stats?.totalUsers ?? 0)} />
            <StatCard label="Signed-In Users" value={loading ? '…' : (stats?.totalSignedIn ?? 0)} />
            <StatCard label="Total Scans" value={loading ? '…' : (stats?.totalScans ?? 0)} />
            <StatCard label="Low Risk Scans" value={loading ? '…' : (stats?.lowRiskScans ?? 0)} accent="var(--sage-ink)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            <StatCard label="High Concern Scans" value={loading ? '…' : (stats?.highRiskScans ?? 0)} accent="var(--terra)" />
            <StatCard label="Elevated Scans" value={loading ? '…' : elevated} accent="var(--amber-ink)" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ padding: '20px 16px' }}>
              <div className="label" style={{ marginBottom: 14, paddingLeft: 4 }}>Risk distribution</div>
              {loading
                ? <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
                : <RiskDistributionChart low={stats?.lowRiskScans ?? 0} elevated={elevated} high={stats?.highRiskScans ?? 0} />
              }
            </div>

            <div className="card" style={{ padding: '20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingLeft: 4 }}>
                <div className="label">Scans — last 30 days</div>
              </div>
              {loading
                ? <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
                : <ActivityChart scans={recentScans} days={30} />
              }
            </div>
          </div>

          {/* Quick nav */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>View all users</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Browse registered users and inspect their scan history.</div>
            </div>
            <button className="btn btn-secondary" onClick={() => router.push('/admin/users')} style={{ flexShrink: 0 }}>
              All users →
            </button>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Survey responses</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>See remaining reward PINs and who has completed the survey.</div>
            </div>
            <button className="btn btn-secondary" onClick={() => router.push('/admin/survey')} style={{ flexShrink: 0 }}>
              Survey →
            </button>
          </div>

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
        </div>
      </div>
    </div>
  );
}
