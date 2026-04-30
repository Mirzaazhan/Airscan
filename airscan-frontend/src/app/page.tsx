'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AirscanMark, IconGoogle, IconShield, IconCheck } from '@/components/ui/Icons';
import { CameraFeed } from '@/components/FaceMesh';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export default function LandingPage() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // Auto-redirect if already signed in; also handle returning redirect sign-in
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) { router.replace('/dashboard'); return; }
      } catch { /* redirect failed — let user try again */ }
      unsub = onAuthStateChanged(auth, u => { if (u) router.replace('/dashboard'); });
    })();
    return () => unsub?.();
  }, [router]);

  const handleSignIn = async () => {
    if (!FIREBASE_ENABLED) { router.push('/dashboard'); return; }
    setSigningIn(true);
    try {
      const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');
      try {
        await signInWithPopup(auth, googleProvider);
        router.push('/dashboard');
      } catch (err: unknown) {
        // Popup blocked on mobile — fall back to redirect
        if ((err as { code?: string }).code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
          // page navigates away — no further action needed
        }
        // auth/popup-closed-by-user → user dismissed, do nothing
      }
    } catch { /* ignore */ } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', overflow: 'auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px' }}>
        <AirscanMark size={18} />
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--ink-3)' }}>
          <span style={{ cursor: 'pointer' }}>Research</span>
          <span style={{ cursor: 'pointer' }}>Clinicians</span>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'row',
        padding: '48px 64px 64px', gap: 64, alignItems: 'stretch',
        flexWrap: 'wrap',
      }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560 }}>
          <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 20 }}>
            Airway Pre-screening · v1.0
          </div>
          <h1 className="serif" style={{ fontSize: 'clamp(40px, 5vw, 68px)', margin: 0, lineHeight: 1.02, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            A three-angle scan<br/>
            of airway risk,<br/>
            <em style={{ color: 'var(--petrol)', fontStyle: 'italic' }}>in under a minute.</em>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 24, maxWidth: 440 }}>
            Airscan uses 468-point facial landmark detection combined with demographic
            data to flag potential obstructive sleep apnoea risk. Designed for use in
            Malaysian primary-care clinics.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSignIn} disabled={signingIn}>
              <IconGoogle /> {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </button>
            <button className="btn btn-secondary btn-lg">Request clinician access</button>
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconShield size={14} /> PDPA compliant
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={14} /> End-to-end encrypted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot" style={{ background: 'var(--sage)' }} /> MOH submission pending
            </span>
          </div>
        </div>

        {/* Right: specimen card */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            position: 'relative', width: 380, height: 460,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="label">Specimen · Angle 1 / 3</span>
              <span className="chip" style={{ background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}>
                <span className="dot" style={{ background: 'var(--sage)' }} /> Detected
              </span>
            </div>
            <div style={{ position: 'relative', height: 340, overflow: 'hidden', borderRadius: 8 }}>
              <CameraFeed angle="front" size={280} stability={0.9} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--ink-3)' }} className="mono">
              <span>468 landmarks</span>
              <span>conf. 0.94</span>
              <span>jitter ±0.8px</span>
            </div>
          </div>
          <svg width="520" height="520" viewBox="0 0 520 520" style={{ position: 'absolute', zIndex: -1, opacity: 0.4, pointerEvents: 'none' }}>
            <circle cx="260" cy="260" r="259" fill="none" stroke="var(--line)" strokeDasharray="2 6"/>
            <circle cx="260" cy="260" r="200" fill="none" stroke="var(--line)"/>
          </svg>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--line)', padding: '16px 40px',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--ink-3)',
      }}>
        <span>© 2026 Airscan Research · Universiti Malaya</span>
        <span className="mono">Build 1.0.0 · Region: MY</span>
      </footer>
    </div>
  );
}
