// One-time import of Touch 'n Go reload PINs into Firestore.
//
// Usage:
//   FIREBASE_SERVICE_ACCOUNT_KEY='<service-account-json>' node scripts/seed-tng-pins.mjs ./scripts/tng-pins.txt
//
// Input file: plain text, one PIN per line. Refuses to re-seed an existing pool
// (would silently reset claimedCount and orphan already-claimed PINs) or a PIN
// count that isn't exactly 150, unless --force is passed.

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EXPECTED_COUNT = 150;

const args = process.argv.slice(2);
const force = args.includes('--force');
const filePath = args.find(a => !a.startsWith('--'));

if (!filePath) {
  console.error('Usage: node scripts/seed-tng-pins.mjs <path-to-pin-list.txt> [--force]');
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
  process.exit(1);
}

const app = initializeApp({ credential: cert(JSON.parse(raw)) });
const db = getFirestore(app);

const pins = readFileSync(filePath, 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean);

if (pins.length !== EXPECTED_COUNT && !force) {
  console.error(`Expected ${EXPECTED_COUNT} PINs, found ${pins.length}. Pass --force to seed anyway.`);
  process.exit(1);
}

const poolRef = db.collection('meta').doc('tngPinPool');
const poolSnap = await poolRef.get();
if (poolSnap.exists && !force) {
  console.error('meta/tngPinPool already exists — refusing to re-seed (would reset claimedCount and orphan already-claimed PINs). Pass --force to overwrite.');
  process.exit(1);
}

const batch = db.batch();
pins.forEach((pin, i) => {
  const ref = db.collection('tngPins').doc(`pin_${String(i).padStart(3, '0')}`);
  batch.set(ref, { index: i, pin, claimed: false });
});
batch.set(poolRef, { claimedCount: 0, totalCount: pins.length });

await batch.commit();
console.log(`Seeded ${pins.length} PINs into tngPins/ and reset meta/tngPinPool.`);
