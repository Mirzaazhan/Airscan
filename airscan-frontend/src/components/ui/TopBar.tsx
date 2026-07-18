'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AirscanMark } from './Icons';
import { useScan } from '@/contexts/ScanContext';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

function IconMenu() {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function IconScanSmall() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 9V5a2 2 0 012-2h4M15 3h4a2 2 0 012 2v4M21 15v4a2 2 0 01-2 2h-4M9 21H5a2 2 0 01-2-2v-4"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin } = useScan();
  const [dropOpen, setDropOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: '/dashboard', label: 'Dashboard' },
    { id: '/history',   label: 'History' },
    { id: '/settings',  label: 'Settings' },
    ...(isAdmin ? [{ id: '/admin', label: 'Admin' }] : []),
  ];

  const current = '/' + pathname.split('/')[1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleSignOut = async () => {
    setDropOpen(false);
    setDrawerOpen(false);
    if (FIREBASE_ENABLED) {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
    }
    router.push('/');
  };

  const initials = (user?.displayName ?? 'AM').split(' ').map(s => s[0]).join('').slice(0, 2);

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64,
        background: 'var(--surface)',
        boxShadow: '0 1px 0 var(--line)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <AirscanMark />

          {/* Desktop nav */}
          <nav className="topbar-nav-desktop" style={{ gap: 2 }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => router.push(n.id)} style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 500,
                background: 'transparent',
                color: current === n.id ? 'var(--ink)' : 'var(--ink-3)',
                border: 'none', borderRadius: 0, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                borderBottom: current === n.id ? '2px solid var(--petrol)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}>
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Clinic name — desktop only */}
          <span className="topbar-clinic" style={{ fontSize: 12, color: 'var(--ink-4)', marginRight: 4 }}>
            Klinik Kesihatan Bangsar
          </span>

          {/* New Scan CTA pill — desktop only */}
          <button
            className="topbar-clinic btn btn-primary"
            onClick={() => router.push('/scan')}
            style={{ fontSize: 13, padding: '8px 18px', gap: 6 }}>
            <IconScanSmall /> New Scan
          </button>

          {/* Avatar + dropdown — desktop only */}
          <div ref={dropRef} className="topbar-avatar" style={{ position: 'relative' }}>
            <div
              onClick={() => setDropOpen(o => !o)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--petrol)',
                color: 'white', display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', userSelect: 'none',
                border: '2px solid var(--paper-2)',
              }}>
              {initials}
            </div>
            {dropOpen && (
              <div style={{
                position: 'absolute', top: 42, right: 0, minWidth: 200,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 100, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{user?.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button
                  onClick={() => { setDropOpen(false); router.push('/settings'); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, color: 'var(--ink-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, color: 'var(--terra)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderTop: '1px solid var(--line-2)' }}>
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="topbar-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', padding: 4, alignItems: 'center' }}>
            <IconMenu />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          <div className="drawer-slide-in" style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
            background: 'var(--surface)',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 201,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderBottom: '1px solid var(--line)',
            }}>
              <AirscanMark />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <IconX />
              </button>
            </div>

            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...navItems, { id: '/scan', label: 'New Scan' }].map(n => (
                <button key={n.id} onClick={() => router.push(n.id)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '13px 16px',
                  fontSize: 15, fontWeight: current === n.id ? 600 : 400,
                  background: current === n.id ? 'var(--sage-bg)' : 'transparent',
                  color: current === n.id ? 'var(--petrol-ink)' : 'var(--ink-2)',
                  border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  borderLeft: `3px solid ${current === n.id ? 'var(--petrol)' : 'transparent'}`,
                }}>
                  {n.label}
                </button>
              ))}
            </nav>

            <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--petrol)',
                  color: 'white', display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 600, flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.displayName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%', padding: '11px 16px', fontSize: 14,
                  color: 'var(--terra)', background: 'var(--terra-bg)',
                  border: 'none', borderRadius: 'var(--r-full)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 500,
                }}>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
