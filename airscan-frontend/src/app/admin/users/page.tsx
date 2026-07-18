'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconChevron } from '@/components/ui/Icons';
import { listUsers } from '@/lib/admin';
import type { AdminUserRow } from '@/lib/admin';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

function formatDateTime(ms?: number) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await listUsers();
        if (!cancelled) { setRows(result.rows); setCursor(result.nextCursor); setHasMore(result.hasMore); }
      } catch {
        if (!cancelled) setError('Failed to load users. Ensure Firestore rules are deployed and indexes exist.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await listUsers(cursor);
      setRows(prev => [...prev, ...result.rows]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      setError('Failed to load users. Ensure Firestore rules are deployed and indexes exist.');
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = search.trim()
    ? rows.filter(r =>
        r.displayName.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <button className="btn btn-ghost" onClick={() => router.push('/admin')} style={{ marginBottom: 16, paddingLeft: 0 }}>
            <IconArrowLeft size={16} /> Admin
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Admin</div>
              <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', margin: 0, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                All users
              </h1>
            </div>

            <input
              className="input-field"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 280 }}
            />
          </div>

          {!FIREBASE_ENABLED && (
            <div className="card" style={{ padding: 24, color: 'var(--amber-ink)', background: 'var(--amber-bg)', border: '1px solid var(--amber)' }}>
              Firebase is not configured — user list unavailable in mock mode.
            </div>
          )}

          {error && (
            <div className="card" style={{ padding: 20, marginBottom: 16, background: 'var(--terra-bg)', border: '1px solid var(--terra)', color: 'var(--terra-ink)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {FIREBASE_ENABLED && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 1fr 1.4fr 0.6fr 40px', padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontWeight: 500 }}>
                <div>Name</div><div>Email</div><div>Scans</div><div>Last login</div><div>Role</div><div/>
              </div>

              {loading && (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
              )}

              {!loading && filtered.length === 0 && (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  {search ? 'No users match your search.' : 'No users found.'}
                </div>
              )}

              {filtered.map(u => (
                <button
                  key={u.uid}
                  onClick={() => router.push(`/admin/users/${u.uid}`)}
                  style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 1fr 1.4fr 0.6fr 40px', alignItems: 'center', padding: '13px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line-2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{u.displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {u.uid.slice(0, 12)}…
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {u.email}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
                    {u.scanCount ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {formatDateTime(u.lastLoginAt)}
                  </div>
                  <div>
                    {u.role === 'admin' ? (
                      <span className="chip" style={{ background: 'var(--petrol)', color: 'white', fontSize: 10 }}>admin</span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>user</span>
                    )}
                  </div>
                  <IconChevron size={14} style={{ color: 'var(--ink-4)' }} />
                </button>
              ))}

              {hasMore && !search && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line-2)', textAlign: 'center' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{ fontSize: 13 }}>
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-3)' }}>
            Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </div>

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
        </div>
      </div>
    </div>
  );
}
