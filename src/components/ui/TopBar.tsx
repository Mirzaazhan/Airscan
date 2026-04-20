'use client';

import { useRouter, usePathname } from 'next/navigation';
import { AirscanMark } from './Icons';
import { useScan } from '@/contexts/ScanContext';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useScan();

  const navItems = [
    { id: '/dashboard', label: 'Dashboard' },
    { id: '/scan',      label: 'New Scan' },
    { id: '/history',   label: 'History' },
    { id: '/settings',  label: 'Settings' },
  ];

  const current = '/' + pathname.split('/')[1];

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
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--petrol-ink)',
          color: 'white', display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 600,
        }}>
          {(user?.displayName ?? 'AM').split(' ').map(s => s[0]).join('').slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
