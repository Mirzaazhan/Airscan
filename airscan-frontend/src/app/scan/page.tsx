'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { predict, predictFallback } from '@/lib/api';
import type { PredictResponse } from '@/lib/types';
import type { CapturedFrame, Demographics, ScanAngle, ScanRecord, StopBang } from '@/lib/types';

import { ConsentScreen }       from '@/components/scan/ConsentScreen';
import { DemographicsScreen }  from '@/components/scan/DemographicsScreen';
import { QuestionnaireScreen } from '@/components/scan/QuestionnaireScreen';
import { ScanInstructionsScreen } from '@/components/scan/ScanInstructionsScreen';
import { ScanScreen }          from '@/components/scan/ScanScreen';
import { AngleSuccessScreen }  from '@/components/scan/AngleSuccessScreen';
import { AnalyzingScreen }     from '@/components/scan/AnalyzingScreen';

type ScanStep = 'consent' | 'demographics' | 'questionnaire' | 'scan-instructions' | 'scan' | 'angle-success' | 'analyzing';

export default function ScanPage() {
  const router = useRouter();
  const { user, authLoaded, demographics, setDemographics, stopBang, setStopBang, captures, addCapture, resetCaptures, setResult, addScan } = useScan();

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
    setStep('questionnaire');
  }, [setDemographics]);
  const onQuestionnaireSubmit = useCallback((data: StopBang) => {
    setStopBang(data);
    setStep('scan-instructions');
  }, [setStopBang]);
  const onScanStart = useCallback(() => setStep('scan'), []);

  const onAngleCapture = useCallback((frame: CapturedFrame) => {
    addCapture(frame);
    
    if (frame.angle === 'neck' && frame.neckMeasurement) {
      const isNeckLarge = frame.neckMeasurement.circumferenceMm > 400; // > 40cm
      if (stopBang) {
        const newScore = stopBang.score + (isNeckLarge && !stopBang.neck ? 1 : 0) - (!isNeckLarge && stopBang.neck ? 1 : 0);
        setStopBang({ ...stopBang, neck: isNeckLarge, score: newScore });
      }
    }

    const newCaptured = [...capturedAngles, frame.angle];
    setCapturedAngles(newCaptured);
    if (newCaptured.length < 8) {
      setStep('angle-success');
    } else {
      setStep('analyzing');
    }
  }, [capturedAngles, addCapture, setStopBang]);

  const onNextAngle = useCallback(() => {
    const order: ScanAngle[] = ['front', 'left', 'right', 'mouth_open', 'tongue_out', 'tongue_rest', 'neck', 'nasal'];
    const next = order[capturedAngles.length];
    setActiveAngle(next);
    setStep('scan');
  }, [capturedAngles]);

  const onAnalyzeDone = useCallback(async () => {
    const demo = demographics ?? { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay' };
    const sb = stopBang ?? { snoring: false, tired: false, observed: false, pressure: false, bmi: false, age: false, neck: false, gender: true, score: 0 };
    const allCaptures = captures.length >= 7 ? captures : [
      { angle: 'front' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'left'  as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'right' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'mouth_open' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'tongue_out' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'tongue_rest' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'neck' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
      { angle: 'nasal' as ScanAngle, imageDataUrl: '', landmarks: [], yawAtCapture: 0, capturedAt: new Date().toISOString() },
    ];

    // Always produce a result — fall back to client-side mock if API is unreachable
    let res: PredictResponse;
    try {
      res = await predict({
        demographics: demo,
        stopBang: sb,
        landmarks: {
          front: allCaptures.find(f => f.angle === 'front')?.landmarks ?? [],
          left:  allCaptures.find(f => f.angle === 'left')?.landmarks ?? [],
          right: allCaptures.find(f => f.angle === 'right')?.landmarks ?? [],
          mouth_open: allCaptures.find(f => f.angle === 'mouth_open')?.landmarks ?? [],
          tongue_out: allCaptures.find(f => f.angle === 'tongue_out')?.landmarks ?? [],
          tongue_rest: allCaptures.find(f => f.angle === 'tongue_rest')?.landmarks ?? [],
          neck: allCaptures.find(f => f.angle === 'neck')?.landmarks ?? [],
          nasal: allCaptures.find(f => f.angle === 'nasal')?.landmarks ?? [],
        },
      });
    } catch {
      res = predictFallback(demo, sb, allCaptures.find(f => f.angle === 'front')?.landmarks ?? []);
    }

    const neckMeasurement = captures.find(c => c.angle === 'neck')?.neckMeasurement;
    res.neckMeasurement = neckMeasurement;
    if (neckMeasurement) {
      const isHigh = neckMeasurement.circumferenceMm > 400; // >40cm
      const neckCranio = {
        name: 'Neck Circumference (Est.)',
        valueMm: Math.round(neckMeasurement.circumferenceMm),
        refMm: 400,
        norm: '< 400',
        significance: 'Neck circumference >40cm is a major STOP-BANG risk factor for OSA',
        flag: isHigh ? 'high' : 'normal'
      } as const;
      res.measurements = [...(res.measurements || []), neckCranio];
    }
    setResult(res);

    // Save to history — fire and forget, never block showing results
    const scan: ScanRecord = {
      id: res.scan_id,
      date: new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }),
      risk: res.risk,
      confidence: res.confidence,
      message: res.message,
      demographics: demo,
      stopBang: sb,
      measurements: res.measurements,
      neckMeasurement,
      nasalAssessment: res.nasalAssessment,
    };
    console.log('[Airscan] calling addScan, captures.length:', captures.length);
    addScan(scan, captures).catch((err: unknown) => {
      const e = err as { code?: string; message?: string };
      console.error('[Airscan] addScan failed:', e.code, e.message);
    });
    resetCaptures();
    router.push('/results');
  }, [demographics, stopBang, captures, setResult, addScan, resetCaptures, router]);

  switch (step) {
    case 'consent':
      return <ConsentScreen onAgree={onConsentAgree} onBack={() => router.push('/dashboard')} />;
    case 'demographics':
      return <DemographicsScreen onSubmit={onDemographicsSubmit} onBack={() => setStep('consent')} initial={demographics} />;
    case 'questionnaire':
      return <QuestionnaireScreen demographics={demographics} onSubmit={onQuestionnaireSubmit} onBack={() => setStep('demographics')} initial={stopBang} />;
    case 'scan-instructions':
      return <ScanInstructionsScreen onStart={onScanStart} onBack={() => setStep('questionnaire')} />;
    case 'scan':
      return <ScanScreen angle={activeAngle} onCapture={onAngleCapture} onBack={() => setStep('scan-instructions')} capturedCount={capturedAngles.length} key={activeAngle} />;
    case 'angle-success': {
      const order: ScanAngle[] = ['front', 'left', 'right', 'mouth_open', 'tongue_out', 'tongue_rest', 'neck', 'nasal'];
      const nextAngle = order[capturedAngles.length];
      return <AngleSuccessScreen capturedAngles={capturedAngles} nextAngle={nextAngle} onNext={onNextAngle} />;
    }
    case 'analyzing':
      return <AnalyzingScreen onDone={onAnalyzeDone} />;
    default:
      return null;
  }
}
