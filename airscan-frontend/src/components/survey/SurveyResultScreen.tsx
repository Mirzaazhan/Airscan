'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from '@/components/ui/Icons';

export type SurveyResultStatus = 'claimed' | 'already_claimed' | 'sold_out';

interface Props { status: SurveyResultStatus; pin?: string; }

export function SurveyResultScreen({ status, pin }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!pin) return;
    await navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.02 155 / 0.35) 100%)' }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        {status === 'sold_out' ? (
          <>
            <div className="eyebrow" style={{ color: 'var(--ink-3)', marginBottom: 14 }}>Thank you</div>
            <h2 className="serif" style={{ fontSize: 'clamp(26px, 5vw, 36px)', margin: '0 0 12px' }}>All rewards have been claimed</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Thanks so much for taking the time to complete this survey — your feedback still helps us a lot, even though all reward PINs have already been given out.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sage)', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <IconCheck size={26} />
            </div>
            <div className="eyebrow" style={{ color: 'var(--sage-ink)', marginBottom: 14 }}>
              {status === 'already_claimed' ? 'Already completed' : 'Thank you!'}
            </div>
            <h2 className="serif" style={{ fontSize: 'clamp(26px, 5vw, 36px)', margin: '0 0 12px' }}>Your Touch &apos;n Go reload PIN</h2>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, letterSpacing: '0.06em',
              padding: '18px 24px', background: 'var(--surface)', border: '1.5px solid var(--sage)', borderRadius: 'var(--r-lg)',
              margin: '20px 0', color: 'var(--ink)', wordBreak: 'break-all',
            }}>
              {pin}
            </div>
            <button className="btn btn-secondary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy PIN'}</button>
          </>
        )}
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
