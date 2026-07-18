import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  getCountFromServer,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RiskLevel, ScanRecord } from '@/lib/types';

export interface AdminUserRow {
  uid: string;
  displayName: string;
  email: string;
  role?: 'admin' | 'user';
  createdAt?: number;
  lastLoginAt?: number;
  scanCount?: number;
}

export interface SummaryStats {
  totalUsers: number;
  totalSignedIn: number;
  totalScans: number;
  lowRiskScans: number;
  highRiskScans: number;
}

function toMillis(ts: unknown): number | undefined {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const usersCol = collection(db, 'users');
  const scansGroup = collectionGroup(db, 'scans');

  const [usersSnap, scansSnap, lowSnap, highSnap] = await Promise.all([
    getCountFromServer(usersCol),
    getCountFromServer(scansGroup),
    getCountFromServer(query(scansGroup, where('risk', '==', 'green'))),
    getCountFromServer(query(scansGroup, where('risk', '==', 'red'))),
  ]);

  const totalUsers = usersSnap.data().count;
  return {
    totalUsers,
    totalSignedIn: totalUsers,
    totalScans: scansSnap.data().count,
    lowRiskScans: lowSnap.data().count,
    highRiskScans: highSnap.data().count,
  };
}

const PAGE_SIZE = 25;

export async function listUsers(cursor?: QueryDocumentSnapshot): Promise<{
  rows: AdminUserRow[];
  nextCursor?: QueryDocumentSnapshot;
  hasMore: boolean;
}> {
  const constraints = [
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(PAGE_SIZE),
  ] as const;

  const snap = await getDocs(query(collection(db, 'users'), ...constraints));

  const rows = await Promise.all(
    snap.docs.map(async d => {
      const data = d.data();
      let scanCount = 0;
      try {
        const countSnap = await getCountFromServer(collection(db, 'users', d.id, 'scans'));
        scanCount = countSnap.data().count;
      } catch {
        // getCountFromServer not blocking — fall back to 0
      }
      return {
        uid: d.id,
        displayName: data.displayName ?? '—',
        email: data.email ?? '—',
        role: data.role as AdminUserRow['role'],
        createdAt: toMillis(data.createdAt),
        lastLoginAt: toMillis(data.lastLoginAt),
        scanCount,
      };
    })
  );

  return {
    rows,
    nextCursor: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export async function getUserProfile(uid: string): Promise<AdminUserRow | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    displayName: data.displayName ?? '—',
    email: data.email ?? '—',
    role: data.role as AdminUserRow['role'],
    createdAt: toMillis(data.createdAt),
    lastLoginAt: toMillis(data.lastLoginAt),
  };
}

export async function listScansForUser(uid: string): Promise<ScanRecord[]> {
  const q = query(
    collection(db, 'users', uid, 'scans'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...(d.data() as ScanRecord), id: d.id }));
}

// Used for the activity chart on the dashboard — fetches recent scan timestamps + risk
export async function listRecentScans(maxCount = 200): Promise<{ createdAt?: number; risk: RiskLevel }[]> {
  const q = query(
    collectionGroup(db, 'scans'),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { createdAt: toMillis(data.createdAt), risk: data.risk as RiskLevel };
  });
}
