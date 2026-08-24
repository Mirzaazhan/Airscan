export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyRequestUser } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestUser(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminDb();
  const userSnap = await db.collection('users').doc(decoded.uid).get();
  if (userSnap.data()?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [poolSnap, responsesSnap] = await Promise.all([
    db.collection('meta').doc('tngPinPool').get(),
    db.collection('surveyResponses').orderBy('submittedAt', 'desc').get(),
  ]);

  const pool = poolSnap.data();
  const responses = responsesSnap.docs.map(d => {
    const r = d.data();
    return {
      uid: r.uid as string,
      email: (r.email as string | null) ?? null,
      displayName: (r.displayName as string | null) ?? null,
      submittedAt: r.submittedAt?.toMillis?.() ?? null,
      pinIndex: r.pinIndex as number,
      answers: r.answers ?? {},
    };
  });

  return NextResponse.json({
    pinsRemaining: pool ? pool.totalCount - pool.claimedCount : 0,
    pinsTotal: pool?.totalCount ?? 0,
    responses,
  });
}
