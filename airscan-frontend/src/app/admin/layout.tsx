'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, authLoaded, isAdmin } = useScan();

  useEffect(() => {
    if (!authLoaded) return;
    if (!user) { router.replace('/'); return; }
    if (!isAdmin) router.replace('/dashboard');
  }, [authLoaded, user, isAdmin, router]);

  if (!authLoaded) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return <>{children}</>;
}
