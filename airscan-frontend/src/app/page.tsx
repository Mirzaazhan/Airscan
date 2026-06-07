'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AirscanMark, IconGoogle, IconShield, IconCheck } from '@/components/ui/Icons';
import { CameraFeed } from '@/components/FaceMesh';

const FIREBASE_ENABLED = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      padding: '28px 24px', boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--line)', flex: 1, minWidth: 200,
    }}>
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!FIREBASE_ENABLED) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) { router.replace('/dashboard'); return; }
      } catch { /* redirect failed */ }
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
        if ((err as { code?: string }).code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
        }
      }
    } catch { /* ignore */ } finally {
      setSigningIn(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--paper)', overflow: 'auto' }}>

      {/* ── Navigation ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 48px)', height: 64,
        background: 'var(--surface)',
        boxShadow: '0 1px 0 var(--line)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <AirscanMark size={18} />
        <nav className="landing-nav" style={{ gap: 28, fontSize: 14, color: 'var(--ink-3)', fontWeight: 450 }}>
          {['How It Works', 'Technology', 'About Us', 'Contact'].map(label => (
            <span key={label} style={{ cursor: 'pointer', transition: 'color .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-3)')}>
              {label}
            </span>
          ))}
        </nav>
        <button className="btn btn-primary" onClick={handleSignIn} disabled={signingIn} style={{ fontSize: 13, padding: '9px 20px', whiteSpace: 'nowrap' }}>
          {signingIn ? 'Signing in…' : 'Get Pre-Screened'}
        </button>
      </header>

      {/* ── Hero ── */}
      <section style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        padding: 'clamp(48px, 8vh, 96px) clamp(24px, 6vw, 80px)',
        gap: 64, flexWrap: 'wrap',
        background: 'linear-gradient(135deg, var(--paper) 0%, oklch(0.97 0.015 130 / 0.3) 100%)',
      }}>
        {/* Left content */}
        <div style={{ flex: '1 1 380px', maxWidth: 560 }}>
          <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 20 }}>
            Sleep Apnea Pre-screening
          </div>
          <h1 className="serif" style={{
            fontSize: 'clamp(38px, 5vw, 62px)',
            margin: 0, lineHeight: 1.05,
            color: 'var(--ink)', letterSpacing: '-0.02em',
          }}>
            Sleep Better,<br/>
            Breathe Easier<br/>
            <em style={{ color: 'var(--petrol)', fontStyle: 'italic' }}>with Airscan.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.65, marginTop: 24, maxWidth: 460 }}>
            Advanced 468-point facial landmark detection for comfortable, non-intimidating
            sleep apnoea pre-screening — designed for Malaysian primary-care clinics.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSignIn} disabled={signingIn}>
              <IconGoogle /> {signingIn ? 'Signing in…' : 'Start Your Free Assessment'}
            </button>
            <button className="btn btn-secondary btn-lg">Watch the Demo</button>
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

        {/* Right: live demo card */}
        <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 380, background: 'var(--surface)',
            borderRadius: 'var(--r-xl)', padding: 24,
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="label">Facial Scan · Angle 1 / 3</span>
              <span className="chip" style={{ background: 'var(--sage-bg)', color: 'var(--sage-ink)' }}>
                <span className="dot" style={{ background: 'var(--sage)' }} /> Detected
              </span>
            </div>
            <div style={{ position: 'relative', height: 320, overflow: 'hidden', borderRadius: 'var(--r-md)' }}>
              <CameraFeed angle="front" size={280} stability={0.9} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 11, color: 'var(--ink-3)' }} className="mono">
              <span>468 landmarks</span>
              <span>conf. 0.94</span>
              <span>jitter ±0.8px</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{ padding: 'clamp(48px, 6vh, 72px) clamp(24px, 6vw, 80px)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 12 }}>Human-Centric Biotech</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: 0, color: 'var(--ink)' }}>
              Precision care, without the intimidation.
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <FeatureCard
              icon="🤍"
              title="Comfort First"
              body="Non-invasive and easy to use. No uncomfortable hardware — just your phone camera and two minutes of your time."
            />
            <FeatureCard
              icon="🔬"
              title="Precision Technology"
              body="Clinical-grade accuracy powered by 468-point facial landmark detection, validated on diverse Malaysian populations."
            />
            <FeatureCard
              icon="🛡️"
              title="Peace of Mind"
              body="Private, secure, and PDPA-compliant. All data is processed on-device and encrypted. You stay in control."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: 'clamp(48px, 6vh, 72px) clamp(24px, 6vw, 80px)', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 12 }}>Our Human-Centric Process</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: 0, color: 'var(--ink)' }}>
              How Airscan works, simply and effectively.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '1', title: 'Simple Setup', body: 'Sign in with your Google account. No hardware or app download required — works entirely in your browser.' },
              { n: '2', title: 'Intelligent Scan', body: 'Our 468-point facial landmark detection analyses your facial structure and breathing patterns across eight angles.' },
              { n: '3', title: 'Analysis & Insights', body: 'Clinical-grade algorithms process your data to provide a detailed, easy-to-understand sleep risk report.' },
              { n: '4', title: 'Your Path Forward', body: 'Receive personalised recommendations and connect with sleep specialists if further evaluation is recommended.' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 28, padding: '28px 0',
                borderBottom: i < 3 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--petrol)', color: 'white',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-serif)', fontSize: 18,
                }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.65 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSignIn} disabled={signingIn}>
              <IconGoogle /> {signingIn ? 'Signing in…' : 'Start Your Free Assessment'}
            </button>
            <button className="btn btn-secondary btn-lg">Watch the Demo</button>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section style={{ padding: 'clamp(40px, 5vh, 64px) clamp(24px, 6vw, 80px)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, color: 'var(--petrol)', marginBottom: 16, fontFamily: 'var(--font-serif)' }}>"</div>
          <p style={{ fontSize: 'clamp(17px, 2.5vw, 22px)', fontFamily: 'var(--font-serif)', color: 'var(--ink)', lineHeight: 1.5, margin: '0 0 24px' }}>
            Airscan helped me understand my sleep patterns in a way no doctor had explained before. Highly recommended.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--sage-bg)', border: '2px solid var(--sage)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--sage-ink)',
            }}>S</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Sarah K.</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Kuala Lumpur</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--line)', padding: '20px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, color: 'var(--ink-3)', flexWrap: 'wrap', gap: 12,
        background: 'var(--paper)',
      }}>
        <span>© 2026 Airscan · Universiti Malaya</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }}>Support</span>
          <span style={{ cursor: 'pointer' }}>FAQs</span>
        </div>
      </footer>
    </div>
  );
}
