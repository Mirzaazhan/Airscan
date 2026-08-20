export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyRequestUser } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const decoded = await verifyRequestUser(req);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await getAdminDb().collection('surveyResponses').doc(decoded.uid).get();
  if (!snap.exists) return NextResponse.json({ hasResponded: false });

  const data = snap.data()!;
  return NextResponse.json({ hasResponded: true, pin: data.pin as string });
}
