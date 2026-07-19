'use client';

import { useState } from 'react';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import type { PaediatricSleepQuestionnaire } from '@/lib/types';

interface Props {
  onSubmit: (data: PaediatricSleepQuestionnaire) => void;
  onBack: () => void;
  initial: PaediatricSleepQuestionnaire | null;
}

type Answer = 'yes' | 'no' | 'dont_know';

const PSQ_SECTIONS: Array<{ heading: string; questions: string[] }> = [
  {
    heading: 'While sleeping, does your child…',
    questions: [
      'Snore more than half the time?',
      'Always snore?',
      'Snore loudly?',
      'Have \'heavy\' or loud breathing?',
      'Have trouble breathing, or struggle to breathe?',
    ],
  },
  {
    heading: 'Have you ever…',
    questions: [
      'Seen your child stop breathing during the night?',
    ],
  },
  {
    heading: 'Does your child…',
    questions: [
      'Tend to breathe through the mouth during the day?',
      'Have a dry mouth on waking in the morning?',
      'Occasionally wet the bed?',
      'Wake up feeling unrefreshed in the morning?',
      'Have a problem with sleepiness during the day?',
      'Have a teacher or other supervisor comment that your child appears sleepy during the day?',
    ],
  },
  {
    heading: 'Other:',
    questions: [
      'Is it hard to wake up your child in the morning?',
      'Does your child wake up with headaches in the morning?',
      'Did your child stop growing at a normal rate at any time since birth?',
      'Is your child overweight?',
    ],
  },
  {
    heading: 'This child often…',
    questions: [
      'Does not seem to listen when spoken to directly.',
      'Has difficulty organizing tasks and activities.',
      'Is easily distracted by extraneous stimuli.',
      'Fidgets with hands or feet or squirms in seat.',
      'Is \'on the go\' or often acts as if \'driven by a motor\'.',
      'Interrupts or intrudes on others (e.g., interrupts conversations or games).',
    ],
  },
];

const TOTAL_QUESTIONS = PSQ_SECTIONS.reduce((n, s) => n + s.questions.length, 0); // 22

export function PaediatricQuestionnaireScreen({ onSubmit, onBack, initial }: Props) {
  const [answers, setAnswers] = useState<Answer[]>(
    initial?.answers as Answer[] ?? Array(TOTAL_QUESTIONS).fill(undefined)
  );

  const setAnswer = (idx: number, v: Answer) =>
    setAnswers(prev => { const next = [...prev]; next[idx] = v; return next; });

  const numAnswered = answers.filter(a => a === 'yes' || a === 'no').length;
  const numYes      = answers.filter(a => a === 'yes').length;
  const score       = numAnswered > 0 ? numYes / numAnswered : 0;
  const allAnswered = answers.every(a => a !== undefined);
  const positiveScreen = score >= 0.33;

  const handleSubmit = () => {
    if (!allAnswered) return;
    onSubmit({ answers, numYes, numAnswered, score, positiveScreen });
  };

  const answeredCount = answers.filter(a => a !== undefined).length;

  let qIdx = 0;

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: 'clamp(24px, 5vh, 40px) clamp(16px, 5vw, 64px)', background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.02 155 / 0.35) 100%)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }}>
          <IconArrowLeft size={16} /> Back
        </button>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ height: 4, flex: 1, borderRadius: 2, background: n <= 3 ? 'var(--sage)' : 'var(--line)' }} />
          ))}
        </div>

        <div className="eyebrow" style={{ color: 'var(--sage-ink)', marginBottom: 14 }}>Step 3 of 4 · Paediatric Sleep Questionnaire (PSQ)</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px, 5vw, 40px)', margin: '0 0 8px', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
          Sleep Questionnaire
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 8, maxWidth: 560 }}>
          To be completed by a parent or legal guardian. For each question, select the answer that best describes your child&apos;s usual behaviour.
        </p>

        {/* Progress pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--sage-bg)', border: '1px solid var(--sage)', borderRadius: 'var(--r-full)', fontSize: 12, color: 'var(--sage-ink)', marginBottom: 28 }}>
          <span>{answeredCount} / {TOTAL_QUESTIONS} answered</span>
          {answeredCount === TOTAL_QUESTIONS && <span style={{ fontWeight: 600 }}>· Done</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {PSQ_SECTIONS.map((section) => {
            const sectionStart = qIdx;
            qIdx += section.questions.length;
            return (
              <div key={section.heading} style={{ background: 'var(--surface)', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 16, fontStyle: 'italic' }}>
                  {section.heading}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {section.questions.map((q, i) => {
                    const idx = sectionStart + i;
                    const val = answers[idx];
                    return (
                      <div key={idx}>
                        <p style={{ fontSize: 13, color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.5 }}>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginRight: 6 }}>{idx + 1}.</span>
                          {q}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(['yes', 'no', 'dont_know'] as Answer[]).map(opt => {
                            const label = opt === 'dont_know' ? "Don't know" : opt === 'yes' ? 'Yes' : 'No';
                            const isSelected = val === opt;
                            const bg = isSelected
                              ? opt === 'yes'       ? 'var(--terra)'
                              : opt === 'no'        ? 'var(--petrol-ink)'
                              : 'var(--ink-3)'
                              : 'var(--surface)';
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswer(idx, opt)}
                                style={{
                                  padding: '7px 14px', fontSize: 12, fontWeight: 500,
                                  flex: opt === 'dont_know' ? 1.4 : 1,
                                  background: bg,
                                  color: isSelected ? 'white' : 'var(--ink)',
                                  border: '1px solid ' + (isSelected ? bg : 'var(--line)'),
                                  borderRadius: 'var(--r-sm)', cursor: 'pointer',
                                  fontFamily: 'inherit', transition: 'all 0.12s',
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live score preview */}
        {answeredCount > 0 && (
          <div style={{ marginTop: 20, padding: '14px 18px', background: positiveScreen ? 'var(--amber-bg)' : 'var(--sage-bg)', border: '1px solid ' + (positiveScreen ? 'var(--amber)' : 'var(--sage)'), borderRadius: 'var(--r-md)', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <div className="label" style={{ color: positiveScreen ? 'var(--amber-ink)' : 'var(--sage-ink)', marginBottom: 3 }}>Running PSQ Score</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{score.toFixed(2)}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {numYes} Yes out of {numAnswered} answered ({TOTAL_QUESTIONS - answeredCount} remaining)<br />
              <span style={{ fontWeight: 600 }}>A score ≥ 0.33 is a positive screen for sleep-disordered breathing.</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack}>Back</button>
          <button
            className="btn btn-primary btn-lg"
            disabled={!allAnswered}
            style={{ flex: 1, background: 'var(--sage)', borderColor: 'var(--sage)' }}
            onClick={handleSubmit}
          >
            Continue to scan <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
