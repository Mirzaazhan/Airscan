'use client';

import type { SurveyQuestion, SurveyAnswerValue } from '@/lib/surveySchema';
import { SingleChoicePills } from './inputs/SingleChoicePills';
import { MultiChoiceChecklist } from './inputs/MultiChoiceChecklist';
import { YesNoToggle } from './inputs/YesNoToggle';
import { ScaleSelector } from './inputs/ScaleSelector';
import { TextField } from './inputs/TextField';

interface Props {
  question: SurveyQuestion;
  index: number;
  value: SurveyAnswerValue | undefined;
  onChange: (id: string, value: SurveyAnswerValue) => void;
}

export function QuestionField({ question, index, value, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.5 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', marginRight: 6 }}>{index}.</span>
        {question.label}
        {question.required && <span style={{ color: 'var(--terra)' }}> *</span>}
      </p>
      {question.helpText && (
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px', lineHeight: 1.5 }}>{question.helpText}</p>
      )}

      {question.type === 'single_choice' && (
        <SingleChoicePills value={(value as string) ?? ''} onChange={v => onChange(question.id, v)} options={question.options ?? []} />
      )}
      {question.type === 'multi_choice' && (
        <MultiChoiceChecklist value={(value as string[]) ?? []} onChange={v => onChange(question.id, v)} options={question.options ?? []} maxSelections={question.maxSelections} />
      )}
      {question.type === 'yes_no' && (
        <YesNoToggle value={(value as string) ?? ''} onChange={v => onChange(question.id, v)} />
      )}
      {question.type === 'scale' && (
        <ScaleSelector
          value={value as number | undefined}
          onChange={v => onChange(question.id, v)}
          min={question.scaleMin ?? 1}
          max={question.scaleMax ?? 5}
          minLabel={question.scaleMinLabel}
          maxLabel={question.scaleMaxLabel}
        />
      )}
      {question.type === 'short_text' && (
        <TextField value={(value as string) ?? ''} onChange={v => onChange(question.id, v)} placeholder={question.placeholder} />
      )}
      {question.type === 'long_text' && (
        <TextField value={(value as string) ?? ''} onChange={v => onChange(question.id, v)} placeholder={question.placeholder} multiline />
      )}
    </div>
  );
}
