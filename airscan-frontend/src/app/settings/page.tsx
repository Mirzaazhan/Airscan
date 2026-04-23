'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { IconChevron } from '@/components/ui/Icons';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export default function SettingsPage() {
  const router = useRouter();
  const { user, authLoaded } = useScan();
  const initials = (user?.displayName ?? 'AM').split(' ').map(s => s[0]).join('').slice(0, 2);

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  if (!authLoaded) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>;

  const handleSignOut = async () => {
    if (FIREBASE_ENABLED) {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
    }
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: '32px 40px 60px', overflow: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Account</div>
          <h1 className="serif" style={{ fontSize: 44, margin: '8px 0 24px', letterSpacing: '-0.01em' }}>Settings</h1>

          {/* Profile */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--petrol-ink)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-serif)' }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.displayName}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{user?.email}</div>
              </div>
              <span className="chip" style={{ background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}>
                <span className="dot" style={{ background: 'var(--sage)' }}/> Verified
              </span>
            </div>
          </div>

          {[
            { title: 'Data & privacy', rows: [['Retention period', '90 days'], ['Region', 'Malaysia (MY-01)'], ['Data export', 'Request copy'], ['Delete all scan data', 'Danger']] },
            { title: 'Preferences', rows: [['Language', 'English · Bahasa Melayu'], ['Units', 'Metric (kg, cm)'], ['Notifications', 'On']] },
          ].map((section, si) => (
            <div key={si} style={{ marginBottom: 16 }}>
              <div className="label" style={{ margin: '0 0 8px 4px' }}>{section.title}</div>
              <div className="card">
                {section.rows.map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < section.rows.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--ink)' }}>{k}</span>
                    <span style={{ fontSize: 13, color: v === 'Danger' ? 'var(--terra)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {v} <IconChevron size={14} style={{ color: 'var(--ink-4)' }}/>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={handleSignOut}>
            Sign out
          </button>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--ink-3)' }} className="mono">
            AIRSCAN v1.0.0 · airway-model v1.0 · Build 2026-04-19
          </div>
        </div>
      </div>
    </div>
  );
}
