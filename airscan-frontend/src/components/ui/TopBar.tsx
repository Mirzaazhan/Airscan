'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AirscanMark } from './Icons';
import { useScan } from '@/contexts/ScanContext';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useScan();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: '/dashboard', label: 'Dashboard' },
    { id: '/scan',      label: 'New Scan' },
    { id: '/history',   label: 'History' },
    { id: '/settings',  label: 'Settings' },
  ];

  const current = '/' + pathname.split('/')[1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    if (FIREBASE_ENABLED) {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
    }
    router.push('/');
  };

  const initials = (user?.displayName ?? 'AM').split(' ').map(s => s[0]).join('').slice(0, 2);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <AirscanMark />
        <nav style={{ display: 'flex', gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id}
              onClick={() => router.push(n.id)}
              style={{
                padding: '7px 12px', fontSize: 13, fontWeight: 500,
                background: current === n.id ? 'var(--paper-2)' : 'transparent',
                color: current === n.id ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}>
              {n.label}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Klinik Kesihatan Bangsar</span>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setOpen(o => !o)}
            style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--petrol-ink)',
              color: 'white', display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', userSelect: 'none',
            }}>
            {initials}
          </div>
          {open && (
            <div style={{
              position: 'absolute', top: 38, right: 0, minWidth: 180,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{user?.displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { setOpen(false); router.push('/settings'); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: 'var(--ink-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Settings
              </button>
              <button
                onClick={handleSignOut}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: 'var(--terra)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderTop: '1px solid var(--line-2)' }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
