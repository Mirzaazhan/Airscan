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

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useScan();
  const [dropOpen, setDropOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
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
        padding: '14px 32px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo + desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <AirscanMark />
          <nav className="topbar-nav-desktop" style={{ gap: 4 }}>
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

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Clinic name — desktop only */}
          <span className="topbar-clinic" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Klinik Kesihatan Bangsar
          </span>

          {/* Avatar + dropdown — desktop only */}
          <div ref={dropRef} className="topbar-avatar" style={{ position: 'relative' }}>
            <div
              onClick={() => setDropOpen(o => !o)}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: 'var(--petrol-ink)',
                color: 'white', display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', userSelect: 'none',
              }}>
              {initials}
            </div>
            {dropOpen && (
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
                  onClick={() => { setDropOpen(false); router.push('/settings'); }}
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
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
              zIndex: 200,
            }}
          />

          {/* Drawer panel */}
          <div className="drawer-slide-in" style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
            background: 'var(--surface)',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 201,
          }}>
            {/* Drawer header */}
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

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map(n => (
                <button key={n.id}
                  onClick={() => router.push(n.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '13px 16px',
                    fontSize: 15, fontWeight: current === n.id ? 600 : 400,
                    background: current === n.id ? 'var(--paper-2)' : 'transparent',
                    color: current === n.id ? 'var(--ink)' : 'var(--ink-2)',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    borderLeft: `3px solid ${current === n.id ? 'var(--petrol)' : 'transparent'}`,
                  }}>
                  {n.label}
                </button>
              ))}
            </nav>

            {/* User info + sign out */}
            <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--petrol-ink)',
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
                  border: 'none', borderRadius: 8, cursor: 'pointer',
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
