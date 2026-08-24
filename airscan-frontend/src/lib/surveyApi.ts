import type { SurveyAnswers } from './surveySchema';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export interface SurveySubmitResult { status: 'claimed' | 'already_claimed' | 'sold_out'; pin?: string; }
export interface SurveyStatusResult { hasResponded: boolean; pin?: string; }
export interface AdminSurveyResponseRow { uid: string; email: string | null; displayName: string | null; submittedAt: number | null; pinIndex: number; answers: SurveyAnswers; }
export interface AdminSurveyData { pinsRemaining: number; pinsTotal: number; responses: AdminSurveyResponseRow[]; }

async function authHeaders(): Promise<HeadersInit> {
  const { auth } = await import('@/lib/firebase');
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function getMySurveyStatus(): Promise<SurveyStatusResult> {
  if (!FIREBASE_ENABLED) return { hasResponded: false };
  const res = await fetch('/api/survey/me', { headers: await authHeaders() });
  if (!res.ok) throw new Error('Failed to load survey status');
  return res.json();
}

export async function submitSurvey(answers: SurveyAnswers): Promise<SurveySubmitResult> {
  if (!FIREBASE_ENABLED) {
    // Mock mode — no real Firestore/Admin SDK locally; fabricate a result so the UI is testable.
    await new Promise(r => setTimeout(r, 500));
    return { status: 'claimed', pin: 'MOCK-' + Math.random().toString(36).slice(2, 8).toUpperCase() };
  }
  const res = await fetch('/api/survey/submit', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit survey');
  return res.json();
}

export async function getAdminSurveyData(): Promise<AdminSurveyData> {
  const res = await fetch('/api/admin/survey', { headers: await authHeaders() });
  if (!res.ok) throw new Error('Failed to load admin survey data');
  return res.json();
}
