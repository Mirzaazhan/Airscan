export type QuestionType = 'single_choice' | 'multi_choice' | 'yes_no' | 'scale' | 'short_text' | 'long_text';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  helpText?: string;
  required?: boolean;
  options?: string[];          // single_choice / multi_choice
  scaleMin?: number;           // scale
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  placeholder?: string;        // short_text / long_text
}

export interface SurveySection {
  id: string;
  heading: string;
  description?: string;
  questions: SurveyQuestion[];
}

export interface SurveySchema {
  id: string;
  title: string;
  intro?: string;
  sections: SurveySection[];
}

export type SurveyAnswerValue = string | string[] | number;
export type SurveyAnswers = Record<string, SurveyAnswerValue>;

// Placeholder — replace with the real exported questionnaire. Bumping `id` invalidates
// any in-flight `schemaVersion` comparisons once real questions are wired in.
export const AIRSCAN_SURVEY_SCHEMA: SurveySchema = {
  id: 'placeholder-v0',
  title: 'AIRSCAN Feedback Survey',
  intro: 'Thanks for helping us improve AIRSCAN. This should take a few minutes — you\'ll get a Touch \'n Go eWallet reload PIN when you\'re done.',
  sections: [
    {
      id: 'experience',
      heading: 'Your Experience',
      description: 'Tell us about using AIRSCAN.',
      questions: [
        { id: 'overall_satisfaction', type: 'scale', label: 'How satisfied were you with the scanning process?', required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Not satisfied', scaleMaxLabel: 'Very satisfied' },
        { id: 'ease_of_use', type: 'single_choice', label: 'How easy was it to complete the scan?', required: true, options: ['Very easy', 'Somewhat easy', 'Neutral', 'Somewhat difficult', 'Very difficult'] },
        { id: 'issues_encountered', type: 'multi_choice', label: 'Did you run into any of these issues?', options: ['Camera would not detect face', 'Instructions unclear', 'App was slow', 'None'] },
      ],
    },
    {
      id: 'feedback',
      heading: 'Additional Feedback',
      questions: [
        { id: 'would_recommend', type: 'yes_no', label: 'Would you recommend AIRSCAN to others?', required: true },
        { id: 'comments', type: 'long_text', label: 'Any other comments or suggestions?', placeholder: 'Optional', required: false },
      ],
    },
  ],
};
