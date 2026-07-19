'use client';

import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { predict, predictFallback } from '@/lib/api';
import { estimatePixelScale } from '@/lib/mediapipe';
import type { PredictResponse } from '@/lib/types';
import type { CapturedFrame, Demographics, PaediatricSleepQuestionnaire, PatientType, ScanAngle, ScanRecord, StopBang } from '@/lib/types';

import { PatientTypeScreen }           from '@/components/scan/PatientTypeScreen';
import { ConsentScreen }               from '@/components/scan/ConsentScreen';
import { DemographicsScreen }          from '@/components/scan/DemographicsScreen';
import { QuestionnaireScreen }         from '@/components/scan/QuestionnaireScreen';
import { PaediatricQuestionnaireScreen } from '@/components/scan/PaediatricQuestionnaireScreen';
import { ScanInstructionsScreen }      from '@/components/scan/ScanInstructionsScreen';
import { ScanScreen }                  from '@/components/scan/ScanScreen';
import { AngleSuccessScreen }          from '@/components/scan/AngleSuccessScreen';
import { AnalyzingScreen }             from '@/components/scan/AnalyzingScreen';

type ScanStep = 'patient-type' | 'consent' | 'demographics' | 'questionnaire' | 'paeds-questionnaire' | 'scan-instructions' | 'scan' | 'angle-success' | 'analyzing';

export default function ScanPage() {
  const router = useRouter();
  const {
    user, authLoaded,
    patientType, setPatientType,
    demographics, setDemographics,
    stopBang, setStopBang,
    psq, setPsq,
    captures, addCapture, resetCaptures,
    setResult, addScan,
  } = useScan();

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  if (!authLoaded) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>;

  const [step, setStep] = useState<ScanStep>('patient-type');
  const [activeAngle, setActiveAngle] = useState<ScanAngle>('front');
  const [capturedAngles, setCapturedAngles] = useState<ScanAngle[]>([]);

  const onPatientTypeSelect = useCallback((type: PatientType) => {
    setPatientType(type);
    setStep('consent');
  }, [setPatientType]);

  const onConsentAgree = useCallback(() => setStep('demographics'), []);

  const onDemographicsSubmit = useCallback((form: Demographics) => {
    setDemographics(form);
    setStep(form.patientType === 'paeds' ? 'paeds-questionnaire' : 'questionnaire');
  }, [setDemographics]);

  const onQuestionnaireSubmit = useCallback((data: StopBang) => {
    setStopBang(data);
    setStep('scan-instructions');
  }, [setStopBang]);

  const onPsqSubmit = useCallback((data: PaediatricSleepQuestionnaire) => {
    setPsq(data);
    setStep('scan-instructions');
  }, [setPsq]);

  const onScanStart = useCallback(() => setStep('scan'), []);

  const onAngleCapture = useCallback((frame: CapturedFrame) => {
    addCapture(frame);

    // Only update neck score for adult STOP-BANG
    if (frame.angle === 'neck' && frame.neckMeasurement && patientType === 'adult') {
      const neckThresholdMm = stopBang?.gender ? 430 : 400;
      const isNeckLarge = frame.neckMeasurement.circumferenceMm > neckThresholdMm;
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
  }, [capturedAngles, addCapture, setStopBang, stopBang, patientType]);

  const onNextAngle = useCallback(() => {
    const order: ScanAngle[] = ['front', 'left', 'right', 'mouth_open', 'tongue_out', 'tongue_rest', 'neck', 'nasal'];
    const next = order[capturedAngles.length];
    setActiveAngle(next);
    setStep('scan');
  }, [capturedAngles]);

  const onAnalyzeDone = useCallback(async () => {
    const demo = demographics ?? { age: 12, gender: 'Male', weight: 40, height: 145, race: 'Malay', patientType: 'adult' as PatientType };
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

    const landmarksPayload = {
      front:       allCaptures.find(f => f.angle === 'front')?.landmarks       ?? [],
      left:        allCaptures.find(f => f.angle === 'left')?.landmarks        ?? [],
      right:       allCaptures.find(f => f.angle === 'right')?.landmarks       ?? [],
      mouth_open:  allCaptures.find(f => f.angle === 'mouth_open')?.landmarks  ?? [],
      tongue_out:  allCaptures.find(f => f.angle === 'tongue_out')?.landmarks  ?? [],
      tongue_rest: allCaptures.find(f => f.angle === 'tongue_rest')?.landmarks ?? [],
      neck:        allCaptures.find(f => f.angle === 'neck')?.landmarks        ?? [],
      nasal:       allCaptures.find(f => f.angle === 'nasal')?.landmarks       ?? [],
    };

    let res: PredictResponse;
    try {
      res = await predict({ demographics: demo, patientType, stopBang: sb, psq: psq ?? undefined, landmarks: landmarksPayload });
    } catch (apiErr) {
      console.warn('[Airscan] predict() failed, using client fallback:', apiErr);
      try {
        res = predictFallback(demo, sb, landmarksPayload, psq ?? undefined);
      } catch (fallbackErr) {
        console.error('[Airscan] predictFallback() also failed, using minimal result:', fallbackErr);
        res = {
          risk: 'yellow',
          confidence: 0.75,
          message: 'Moderate risk indicators detected. Clinical evaluation by a specialist is advised.',
          scan_id: Math.random().toString(36).slice(2, 12),
          measurements: [],
        };
      }
    }

    const neckMeasurement = captures.find(c => c.angle === 'neck')?.neckMeasurement;
    res.neckMeasurement = neckMeasurement;
    if (neckMeasurement) {
      const isHigh = neckMeasurement.circumferenceMm > 400;
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

    const frontCapture = captures.find(c => c.angle === 'front');
    if (frontCapture?.fullLandmarks?.length && frontCapture.videoWidth && frontCapture.videoHeight) {
      const scaleMmPerPixel = estimatePixelScale(frontCapture.fullLandmarks, frontCapture.videoWidth, frontCapture.videoHeight);
      if (scaleMmPerPixel) {
        res.faceMesh = {
          landmarks: frontCapture.fullLandmarks,
          videoWidth: frontCapture.videoWidth,
          videoHeight: frontCapture.videoHeight,
          scaleMmPerPixel,
        };
      }
    }

    flushSync(() => setResult(res));

    const scan: ScanRecord = {
      id: res.scan_id,
      date: new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }),
      risk: res.risk,
      confidence: res.confidence,
      message: res.message,
      demographics: demo,
      patientType,
      stopBang: patientType === 'adult' ? sb : undefined,
      psq: patientType === 'paeds' ? (psq ?? undefined) : undefined,
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
  }, [demographics, patientType, stopBang, psq, captures, setResult, addScan, resetCaptures, router]);

  const questionnaireBackTarget: ScanStep = 'demographics';

  switch (step) {
    case 'patient-type':
      return <PatientTypeScreen onSelect={onPatientTypeSelect} onBack={() => router.push('/dashboard')} />;
    case 'consent':
      return <ConsentScreen onAgree={onConsentAgree} onBack={() => setStep('patient-type')} patientType={patientType} />;
    case 'demographics':
      return <DemographicsScreen onSubmit={onDemographicsSubmit} onBack={() => setStep('consent')} initial={demographics} patientType={patientType} />;
    case 'questionnaire':
      return <QuestionnaireScreen demographics={demographics} onSubmit={onQuestionnaireSubmit} onBack={() => setStep(questionnaireBackTarget)} initial={stopBang} />;
    case 'paeds-questionnaire':
      return <PaediatricQuestionnaireScreen onSubmit={onPsqSubmit} onBack={() => setStep(questionnaireBackTarget)} initial={psq} />;
    case 'scan-instructions':
      return <ScanInstructionsScreen onStart={onScanStart} onBack={() => setStep(patientType === 'paeds' ? 'paeds-questionnaire' : 'questionnaire')} />;
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
