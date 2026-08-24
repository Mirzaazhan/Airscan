import { getVisibleSections } from './surveySchema';
import type { SurveyQuestion, SurveySchema, SurveyAnswers, SurveyAnswerValue } from './surveySchema';

export function isQuestionAnswered(question: SurveyQuestion, value: SurveyAnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  switch (question.type) {
    case 'single_choice':
    case 'yes_no':
      return typeof value === 'string' && value.length > 0;
    case 'multi_choice':
      return Array.isArray(value) && value.length > 0;
    case 'scale':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'short_text':
    case 'long_text':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return false;
  }
}

function isWithinSelectionCap(question: SurveyQuestion, value: SurveyAnswerValue | undefined): boolean {
  if (question.type !== 'multi_choice' || question.maxSelections === undefined) return true;
  return !Array.isArray(value) || value.length <= question.maxSelections;
}

// Re-checked here (not just enforced in the UI) since this gates a real PIN claim —
// a client that bypasses the UI shouldn't be able to submit an over-cap answer.
export function validateSurveyAnswers(schema: SurveySchema, answers: SurveyAnswers): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const section of getVisibleSections(schema, answers)) {
    for (const q of section.questions) {
      const value = answers[q.id];
      if (q.required && !isQuestionAnswered(q, value)) { missing.push(q.id); continue; }
      if (!isWithinSelectionCap(q, value)) missing.push(q.id);
    }
  }
  return { valid: missing.length === 0, missing };
}
