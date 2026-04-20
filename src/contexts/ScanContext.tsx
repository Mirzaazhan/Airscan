'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CapturedFrame, Demographics, PredictResponse, ScanRecord } from '@/lib/types';

interface ScanContextValue {
  // Auth (simplified — real Firebase auth wired in later)
  user: { displayName: string; email: string; uid: string } | null;
  setUser: (u: ScanContextValue['user']) => void;

  // Scan flow state
  demographics: Demographics | null;
  setDemographics: (d: Demographics) => void;
  captures: CapturedFrame[];
  addCapture: (f: CapturedFrame) => void;
  resetCaptures: () => void;
  result: PredictResponse | null;
  setResult: (r: PredictResponse) => void;

  // History (local mock — replaced by Firestore in prod)
  scans: ScanRecord[];
  addScan: (s: ScanRecord) => void;
  deleteScan: (id: string) => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

function makeMockScans(): ScanRecord[] {
  const messages = {
    green: 'Your airway structure appears normal.',
    yellow: 'A potential concern has been detected. Please consult a doctor.',
    red: 'A significant concern was detected. Please seek medical advice promptly.',
  };
  const mkId = () => Math.random().toString(36).slice(2, 10);
  const dates  = ['14 Apr 2026', '02 Mar 2026', '18 Jan 2026', '05 Dec 2025', '22 Oct 2025'];
  const risks  = ['yellow', 'green', 'green', 'yellow', 'red'] as const;
  const confs  = [0.81, 0.92, 0.88, 0.73, 0.79];
  return dates.map((d, i) => ({
    id: mkId(),
    date: d,
    risk: risks[i],
    confidence: confs[i],
    message: messages[risks[i]],
    demographics: { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay' },
  }));
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ScanContextValue['user']>({
    displayName: 'Amira Mansor',
    email: 'amira.mansor@um.edu.my',
    uid: 'mock-uid-001',
  });
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [captures, setCaptures] = useState<CapturedFrame[]>([]);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>(makeMockScans);

  const addCapture = useCallback((f: CapturedFrame) => setCaptures(c => [...c, f]), []);
  const resetCaptures = useCallback(() => setCaptures([]), []);

  const addScan = useCallback((s: ScanRecord) => setScans(prev => [s, ...prev]), []);
  const deleteScan = useCallback((id: string) => setScans(prev => prev.filter(s => s.id !== id)), []);

  return (
    <ScanContext.Provider value={{
      user, setUser,
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
