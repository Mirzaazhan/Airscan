'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { predict } from '@/lib/api';
import type { CapturedFrame, Demographics, ScanAngle, ScanRecord } from '@/lib/types';

import { ConsentScreen }       from '@/components/scan/ConsentScreen';
import { DemographicsScreen }  from '@/components/scan/DemographicsScreen';
import { ScanInstructionsScreen } from '@/components/scan/ScanInstructionsScreen';
import { ScanScreen }          from '@/components/scan/ScanScreen';
import { AngleSuccessScreen }  from '@/components/scan/AngleSuccessScreen';
import { AnalyzingScreen }     from '@/components/scan/AnalyzingScreen';

type ScanStep = 'consent' | 'demographics' | 'scan-instructions' | 'scan' | 'angle-success' | 'analyzing';

export default function ScanPage() {
  const router = useRouter();
  const { user, authLoaded, demographics, setDemographics, captures, addCapture, resetCaptures, setResult, addScan } = useScan();

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  if (!authLoaded) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>;

  const [step, setStep] = useState<ScanStep>('consent');
  const [activeAngle, setActiveAngle] = useState<ScanAngle>('front');
  const [capturedAngles, setCapturedAngles] = useState<ScanAngle[]>([]);

  const onConsentAgree = useCallback(() => setStep('demographics'), []);
  const onDemographicsSubmit = useCallback((form: Demographics) => {
    setDemographics(form);
    setStep('scan-instructions');
  }, [setDemographics]);
  const onScanStart = useCallback(() => setStep('scan'), []);

  const onAngleCapture = useCallback((frame: CapturedFrame) => {
    addCapture(frame);
    const newCaptured = [...capturedAngles, frame.angle];
    setCapturedAngles(newCaptured);
    if (newCaptured.length < 3) {
      setStep('angle-success');
    } else {
      setStep('analyzing');
    }
  }, [capturedAngles, addCapture]);

  const onNextAngle = useCallback(() => {
    const order: ScanAngle[] = ['front', 'left', 'right'];
    const next = order[capturedAngles.length];
    setActiveAngle(next);
    setStep('scan');
  }, [capturedAngles]);

  const onAnalyzeDone = useCallback(async () => {
    const demo = demographics ?? { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay' };
    try {
      const allCaptures = captures.length >= 3 ? captures : [
        { angle: 'front' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
        { angle: 'left'  as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
        { angle: 'right' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      ];
      const res = await predict({
        demographics: demo,
        landmarks: {
          front: allCaptures.find(f => f.angle === 'front')?.landmarks ?? [],
          left:  allCaptures.find(f => f.angle === 'left')?.landmarks ?? [],
          right: allCaptures.find(f => f.angle === 'right')?.landmarks ?? [],
        },
      });
      setResult(res);

      const scan: ScanRecord = {
        id: res.scan_id,
        date: new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }),
        risk: res.risk,
        confidence: res.confidence,
        message: res.message,
        demographics: demo,
        measurements: res.measurements,
      };
      addScan(scan);
      resetCaptures();
      router.push('/results');
    } catch {
      router.push('/results');
    }
  }, [demographics, captures, setResult, addScan, resetCaptures, router]);

  switch (step) {
    case 'consent':
      return <ConsentScreen onAgree={onConsentAgree} onBack={() => router.push('/dashboard')} />;
    case 'demographics':
      return <DemographicsScreen onSubmit={onDemographicsSubmit} onBack={() => setStep('consent')} initial={demographics} />;
    case 'scan-instructions':
      return <ScanInstructionsScreen onStart={onScanStart} onBack={() => setStep('demographics')} />;
    case 'scan':
      return <ScanScreen angle={activeAngle} onCapture={onAngleCapture} onBack={() => setStep('scan-instructions')} capturedCount={capturedAngles.length} key={activeAngle} />;
    case 'angle-success': {
      const order: ScanAngle[] = ['front', 'left', 'right'];
      const nextAngle = order[capturedAngles.length];
      return <AngleSuccessScreen capturedAngles={capturedAngles} nextAngle={nextAngle} onNext={onNextAngle} />;
    }
    case 'analyzing':
      return <AnalyzingScreen onDone={onAnalyzeDone} />;
    default:
      return null;
  }
}
