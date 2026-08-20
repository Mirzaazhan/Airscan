export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyRequestUser } from '@/lib/apiAuth';
import { AIRSCAN_SURVEY_SCHEMA } from '@/lib/surveySchema';
import { validateSurveyAnswers } from '@/lib/surveyValidation';
import type { SurveyAnswers } from '@/lib/surveySchema';

export async function POST(req: NextRequest) {
  const decoded = await verifyRequestUser(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { answers?: SurveyAnswers } | null;
  const answers = body?.answers;
  if (!answers) return NextResponse.json({ error: 'Missing answers' }, { status: 400 });

  const { valid } = validateSurveyAnswers(AIRSCAN_SURVEY_SCHEMA, answers);
  if (!valid) return NextResponse.json({ error: 'Missing required answers' }, { status: 400 });

  const db = getAdminDb();
  const uid = decoded.uid;
  const responseRef = db.collection('surveyResponses').doc(uid);
  const poolRef = db.collection('meta').doc('tngPinPool');

  try {
    const result = await db.runTransaction(async tx => {
      // All reads must happen before any writes in a Firestore transaction.
      const responseSnap = await tx.get(responseRef);
      if (responseSnap.exists) {
        const data = responseSnap.data()!;
        return { status: 'already_claimed' as const, pin: data.pin as string };
      }

      const poolSnap = await tx.get(poolRef);
      if (!poolSnap.exists) throw new Error('PIN pool not seeded — run scripts/seed-tng-pins.mjs first');
      const pool = poolSnap.data()!;
      if (pool.claimedCount >= pool.totalCount) {
        return { status: 'sold_out' as const };
      }

      const pinRef = db.collection('tngPins').doc(`pin_${String(pool.claimedCount).padStart(3, '0')}`);
      const pinSnap = await tx.get(pinRef);
      if (!pinSnap.exists) throw new Error(`Expected PIN doc ${pinRef.id} is missing`);
      const pin = pinSnap.data()!.pin as string;

      tx.update(pinRef, {
        claimed: true,
        claimedByUid: uid,
        claimedByEmail: decoded.email ?? null,
        claimedAt: FieldValue.serverTimestamp(),
      });
      tx.update(poolRef, { claimedCount: FieldValue.increment(1) });
      tx.create(responseRef, {
        uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        answers,
        schemaVersion: AIRSCAN_SURVEY_SCHEMA.id,
        pinIndex: pool.claimedCount,
        pin,
        submittedAt: FieldValue.serverTimestamp(),
      });

      return { status: 'claimed' as const, pin };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('[api/survey/submit]', e);
    return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
  }
}
