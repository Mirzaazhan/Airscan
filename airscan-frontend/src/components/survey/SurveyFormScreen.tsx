'use client';

import { IconArrowLeft, IconArrow } from '@/components/ui/Icons';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { getVisibleSections } from '@/lib/surveySchema';
import type { SurveySchema, SurveyAnswers, SurveyAnswerValue } from '@/lib/surveySchema';
import { validateSurveyAnswers } from '@/lib/surveyValidation';
import { QuestionField } from './QuestionField';

interface Props {
  schema: SurveySchema;
  answers: SurveyAnswers;
  onAnswerChange: (id: string, value: SurveyAnswerValue) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  errorMsg?: string;
}

export function SurveyFormScreen({ schema, answers, onAnswerChange, onSubmit, onBack, submitting, errorMsg }: Props) {
  const { valid } = validateSurveyAnswers(schema, answers);
  // Re-evaluated on every answer change so a branch (e.g. Q8) reveals/hides its
  // section immediately, and question numbering stays contiguous for what's shown.
  const visibleSections = getVisibleSections(schema, answers);
  // Precomputed (not mutated during render) starting question index for each section.
  const sectionStarts = visibleSections.reduce<number[]>((offsets, _s, i) => {
    offsets.push(i === 0 ? 0 : offsets[i - 1] + visibleSections[i - 1].questions.length);
    return offsets;
  }, []);

  return (
    <div style={{ minHeight: '100vh', overflow: 'auto', padding: 'clamp(24px, 5vh, 40px) clamp(16px, 5vw, 64px)', background: 'linear-gradient(160deg, var(--paper) 0%, oklch(0.97 0.02 155 / 0.35) 100%)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, paddingLeft: 0, gap: 6 }} disabled={submitting}>
          <IconArrowLeft size={16} /> Back
        </button>

        <div className="eyebrow" style={{ color: 'var(--petrol)', marginBottom: 8 }}>{schema.title}</div>
        <h2 className="serif" style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
          A few questions for you
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {visibleSections.map((section, sIdx) => {
            const sectionStart = sectionStarts[sIdx];
            return (
              <div key={section.id} style={{ background: 'var(--surface)', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>{section.heading}</h3>
                {section.description && (
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 16px', whiteSpace: 'pre-line' }}>{section.description}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: section.description ? 0 : 16 }}>
                  {section.questions.map((q, i) => (
                    <QuestionField key={q.id} question={q} index={sectionStart + i + 1} value={answers[q.id]} onChange={onAnswerChange} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--terra-bg)', border: '1px solid var(--terra)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--terra-ink)' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="btn btn-secondary btn-lg" onClick={onBack} disabled={submitting}>Back</button>
          <button className="btn btn-primary btn-lg" disabled={!valid || submitting} style={{ flex: 1 }} onClick={onSubmit}>
            {submitting ? 'Submitting…' : 'Submit'} <IconArrow size={16} />
          </button>
        </div>
        <div style={{ marginTop: 20 }}><Disclaimer /></div>
      </div>
    </div>
  );
}
