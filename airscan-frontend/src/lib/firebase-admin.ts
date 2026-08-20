import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

// Lazy — evaluated on first use inside a route handler, not at module import time.
// Route modules get imported during `next build`'s page-data collection, which would
// otherwise throw before the app ever runs if the service account key isn't set yet.
let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}
