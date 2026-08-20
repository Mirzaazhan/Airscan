'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { SurveyIntroScreen } from '@/components/survey/SurveyIntroScreen';
import { SurveyFormScreen } from '@/components/survey/SurveyFormScreen';
import { SurveyResultScreen, type SurveyResultStatus } from '@/components/survey/SurveyResultScreen';
import { AIRSCAN_SURVEY_SCHEMA } from '@/lib/surveySchema';
import type { SurveyAnswers, SurveyAnswerValue } from '@/lib/surveySchema';
import { getMySurveyStatus, submitSurvey } from '@/lib/surveyApi';

type Step = 'loading' | 'intro' | 'form' | 'result';

export default function SurveyPage() {
  const router = useRouter();
  const { user, authLoaded } = useScan();

  const [step, setStep] = useState<Step>('loading');
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [result, setResult] = useState<{ status: SurveyResultStatus; pin?: string } | null>(null);

  useEffect(() => {
    if (authLoaded && !user) router.replace('/');
  }, [authLoaded, user, router]);

  useEffect(() => {
    if (!authLoaded || !user) return;
    let cancelled = false;
    getMySurveyStatus()
      .then(status => {
        if (cancelled) return;
        if (status.hasResponded) {
          setResult({ status: 'already_claimed', pin: status.pin });
          setStep('result');
        } else {
          setStep('intro');
        }
      })
      .catch(() => { if (!cancelled) setStep('intro'); });
    return () => { cancelled = true; };
  }, [authLoaded, user]);

  const onAnswerChange = useCallback((id: string, value: SurveyAnswerValue) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const onSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(undefined);
    try {
      const res = await submitSurvey(answers);
      setResult({ status: res.status, pin: res.pin });
      setStep('result');
    } catch {
      setErrorMsg('Something went wrong submitting the survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authLoaded || step === 'loading') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--paper)', color: 'var(--ink-3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!user) return null;

  if (step === 'intro') {
    return <SurveyIntroScreen schema={AIRSCAN_SURVEY_SCHEMA} onStart={() => setStep('form')} onBack={() => router.push('/dashboard')} />;
  }

  if (step === 'form') {
    return (
      <SurveyFormScreen
        schema={AIRSCAN_SURVEY_SCHEMA}
        answers={answers}
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
        onBack={() => setStep('intro')}
        submitting={submitting}
        errorMsg={errorMsg}
      />
    );
  }

  if (step === 'result' && result) {
    return <SurveyResultScreen status={result.status} pin={result.pin} />;
  }

  return null;
}
