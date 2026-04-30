'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { CapturedFrame, Demographics, PredictResponse, ScanRecord } from '@/lib/types';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

interface UserShape { displayName: string; email: string; uid: string }

interface ScanContextValue {
  user: UserShape | null;
  authLoaded: boolean;
  setUser: (u: UserShape | null) => void;

  demographics: Demographics | null;
  setDemographics: (d: Demographics) => void;
  captures: CapturedFrame[];
  addCapture: (f: CapturedFrame) => void;
  resetCaptures: () => void;
  result: PredictResponse | null;
  setResult: (r: PredictResponse) => void;

  scans: ScanRecord[];
  addScan: (s: ScanRecord, captures: CapturedFrame[]) => Promise<void>;
  deleteScan: (id: string) => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

function makeMockScans(): ScanRecord[] {
  const messages = {
    green:  'Your airway structure appears normal.',
    yellow: 'A potential concern has been detected. Please consult a doctor.',
    red:    'A significant concern was detected. Please seek medical advice promptly.',
  };
  const mkId = () => Math.random().toString(36).slice(2, 10);
  const dates = ['14 Apr 2026', '02 Mar 2026', '18 Jan 2026', '05 Dec 2025', '22 Oct 2025'];
  const risks = ['yellow', 'green', 'green', 'yellow', 'red'] as const;
  const confs = [0.81, 0.92, 0.88, 0.73, 0.79];
  return dates.map((d, i) => ({
    id: mkId(),
    date: d,
    risk: risks[i],
    confidence: confs[i],
    message: messages[risks[i]],
    demographics: { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay', snoring: 'Sometimes', oxygenCondition: 'Normal', medicalHistory: 'None' },
  }));
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserShape | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [captures, setCaptures] = useState<CapturedFrame[]>([]);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);

  // Auth + scan history — Firebase or mock
  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      setUser({ displayName: 'Amira Mansor', email: 'amira.mansor@um.edu.my', uid: 'mock-uid-001' });
      setScans(makeMockScans());
      setAuthLoaded(true);
      return;
    }

    // Lazy-load Firebase to avoid import errors when credentials are absent
    let unsubAuth: (() => void) | undefined;
    let unsubScans: (() => void) | undefined;

    import('firebase/auth').then(({ onAuthStateChanged }) => {
      import('@/lib/firebase').then(({ auth, db }) => {
        unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const u: UserShape = {
              displayName: fbUser.displayName ?? fbUser.email ?? 'User',
              email: fbUser.email ?? '',
              uid: fbUser.uid,
            };
            setUser(u);

            // Subscribe to Firestore scan history
            import('firebase/firestore').then(({ collection, query, orderBy, onSnapshot }) => {
              unsubScans?.();
              const q = query(collection(db, 'users', fbUser.uid, 'scans'), orderBy('createdAt', 'desc'));
              unsubScans = onSnapshot(q, snapshot => {
                const docs = snapshot.docs.map(d => d.data() as ScanRecord);
                setScans(docs);
              });
            });
          } else {
            setUser(null);
            unsubScans?.();
            setScans([]);
          }
          setAuthLoaded(true);
        });
      });
    });

    return () => {
      unsubAuth?.();
      unsubScans?.();
    };
  }, []);

  const addCapture = useCallback((f: CapturedFrame) => setCaptures(c => [...c, f]), []);
  const resetCaptures = useCallback(() => setCaptures([]), []);

  const addScan = useCallback(async (s: ScanRecord, caps: CapturedFrame[]) => {
    if (!FIREBASE_ENABLED || !user || user.uid === 'mock-uid-001') {
      setScans(prev => [s, ...prev]);
      return;
    }

    // Upload captured images to Storage, collect download URLs
    const imageRefs: Partial<Record<'front' | 'left' | 'right', string>> = {};
    try {
      const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      await Promise.all(
        caps
          .filter(c => c.imageDataUrl)
          .map(async c => {
            const storageRef = ref(storage, `users/${user.uid}/scans/${s.id}/${c.angle}.jpg`);
            await uploadString(storageRef, c.imageDataUrl, 'data_url');
            imageRefs[c.angle] = await getDownloadURL(storageRef);
          })
      );
    } catch {
      // Storage upload failure should not block the Firestore write
    }

    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    await setDoc(doc(db, 'users', user.uid, 'scans', s.id), {
      ...s,
      ...(Object.keys(imageRefs).length ? { imageRefs } : {}),
      createdAt: serverTimestamp(),
    });
    // onSnapshot will update scans state automatically
  }, [user]);

  const deleteScan = useCallback(async (id: string) => {
    if (!FIREBASE_ENABLED || !user || user.uid === 'mock-uid-001') {
      setScans(prev => prev.filter(s => s.id !== id));
      return;
    }
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    await deleteDoc(doc(db, 'users', user.uid, 'scans', id));
    // onSnapshot will update scans state automatically
  }, [user]);

  return (
    <ScanContext.Provider value={{
      user, authLoaded, setUser,
      demographics, setDemographics,
      captures, addCapture, resetCaptures,
      result, setResult,
      scans, addScan, deleteScan,
    }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside ScanProvider');
  return ctx;
}
