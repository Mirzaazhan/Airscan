export type QuestionType = 'single_choice' | 'multi_choice' | 'yes_no' | 'scale' | 'short_text' | 'long_text';

export type SurveyAnswerValue = string | string[] | number;
export type SurveyAnswers = Record<string, SurveyAnswerValue>;

// Conditional visibility — e.g. only show a section/question based on an earlier answer.
export type ShowIf = (answers: SurveyAnswers) => boolean;

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
  showIf?: ShowIf;
}

export interface SurveySection {
  id: string;
  heading: string;
  description?: string;
  questions: SurveyQuestion[];
  showIf?: ShowIf;
}

export interface SurveySchema {
  id: string;
  title: string;
  intro?: string;
  sections: SurveySection[];
}

// Sections/questions filtered down to what should actually be shown/validated for a given
// set of in-progress answers — both the renderer and the validator (client + server) must
// use this instead of `schema.sections` directly, so a skipped branch is never required.
export function getVisibleSections(schema: SurveySchema, answers: SurveyAnswers): SurveySection[] {
  return schema.sections
    .filter(s => !s.showIf || s.showIf(answers))
    .map(s => ({ ...s, questions: s.questions.filter(q => !q.showIf || q.showIf(answers)) }));
}

// Sought professional help already? Drives the Q9-16 / Q17-25 branch below.
const soughtHelp = (v: 'Yes' | 'No') => (answers: SurveyAnswers) => answers['q8_sought_help'] === v;
const interestedInInterview = (answers: SurveyAnswers) =>
  answers['q42_interview_interest'] === 'Yes' || answers['q42_interview_interest'] === 'Maybe';

export const AIRSCAN_SURVEY_SCHEMA: SurveySchema = {
  id: 'osa-journey-v1',
  title: 'Understanding the Journey of Snoring, Sleep and Breathing Problems',
  intro: 'UM Deep Tech project led by Dr Norli Anida Abdullah; studies snoring, sleep, and breathing journeys. This is for research purposes only and is not for diagnosis.',
  sections: [
    {
      id: 'symptoms',
      heading: 'Your Symptoms',
      questions: [
        { id: 'q1_symptoms', type: 'multi_choice', required: true, label: 'Which symptoms have you experienced?', helpText: 'Select all that apply.', options: ['Snoring', 'Loud snoring', 'Breathing pauses', 'Gasping or choking', 'Breathing difficulty', 'Nasal difficulty', 'Frequent waking', 'Dry mouth', 'Morning headache', 'Tired after sleep', 'Day sleepiness', 'Poor concentration', 'Poor sleep', 'Other'] },
        { id: 'q2_duration', type: 'single_choice', required: true, label: 'How long have you been experiencing these symptoms?', options: ['<6 months', '6-12 months', '1-3 years', '>3 years', 'Unsure'] },
        { id: 'q3_first_aware', type: 'single_choice', required: true, label: 'Who was the first person to make you aware of these symptoms?', options: ['Self', 'Partner', 'Family member', 'Friend', 'Doctor', 'Wearable device or app', 'Online or social media', 'Other'] },
        { id: 'q4_what_made_you_check', type: 'long_text', label: 'What first made you think it should be checked?' },
        { id: 'q5_thought_medical_issue', type: 'single_choice', required: true, label: 'Did you initially think these symptoms were a medical issue?', options: ['Yes', 'No', 'Unsure', 'Thought it was normal'] },
        { id: 'q6_concern_level', type: 'single_choice', required: true, label: 'How concerned are you about your symptoms?', options: ['None', 'Slight', 'Moderate', 'Very', 'Extreme'] },
        { id: 'q7_heard_of_osa', type: 'single_choice', required: true, label: 'Before this survey, had you heard of Obstructive Sleep Apnea (OSA)?', options: ['Yes, I am familiar with it', 'I have heard a little about it', 'I have never heard of it'] },
        { id: 'q8_sought_help', type: 'single_choice', required: true, label: 'Have you ever sought professional help or screening for these symptoms?', options: ['No', 'Yes'] },
      ],
    },
    {
      id: 'managed_symptoms',
      heading: 'How You Have Managed Your Symptoms',
      showIf: soughtHelp('No'),
      questions: [
        { id: 'q9_first_action', type: 'single_choice', required: true, label: 'What was the FIRST thing you did after noticing the problem?', options: ['Nothing', 'Waited', 'Searched Google', 'Social media', 'AI tools', 'Asked family or friends', 'Used an app', 'Used a wearable device', 'Home remedy', 'Pharmacy visit', 'Other'] },
        { id: 'q10_where_looked_info', type: 'multi_choice', required: true, label: 'Where have you looked for information about your symptoms?', helpText: 'Tick all that apply.', options: ['Google', 'Social media', 'AI tools', 'Family or friends', 'Apps', 'Wearable devices', 'Pharmacy', 'Never searched', 'Other'] },
        { id: 'q11_clarity_after_search', type: 'single_choice', required: true, label: 'After searching for information, how clear were you about what you should do next?', options: ['Very clear', 'Somewhat clear', 'Unsure', 'Confused', 'More confused', "Didn't search"] },
        { id: 'q12_wished_info', type: 'multi_choice', required: true, label: 'What information did you wish you had when you first noticed the problem?', helpText: 'Tick all that apply.', options: ['Are these symptoms normal?', 'Is this a health problem?', 'My risk of OSA', 'Seriousness of symptoms', 'Do I need a doctor?', 'Which doctor to see?', 'Where to get screened?', 'How screening works?', 'Cost', 'Home risk check', 'What to do while waiting?', 'Other'] },
        { id: 'q13_considered_screening', type: 'single_choice', required: true, label: 'Have you ever considered getting your symptoms professionally checked or screened?', options: ['Yes', 'No', 'Unsure'] },
        { id: 'q14_barriers', type: 'multi_choice', required: true, label: 'What has stopped or delayed you from getting your symptoms checked?', helpText: 'Tick all that apply.', options: ['Not serious enough', 'Unsure if abnormal', "Don't know OSA risk", 'Thought snoring was normal', "Don't know where to start", 'Which doctor to see', 'Where to get screened', 'What is involved in the process', 'Cost', 'Time', 'Inconvenient', 'Waiting times', 'Uncomfortable tests', 'Avoided overnight study', 'Self-managed', 'Fear of diagnosis', 'Other'] },
        // Source PDF repeats Q14's exact title here, but these options ("Doctor recommendation", "Family
        // encouragement"...) are clearly about what would HELP, not what stopped them — retitled to match
        // the actual options; flag to the client if this guess is wrong.
        { id: 'q15_what_would_help', type: 'multi_choice', required: true, label: 'What kind of support would have helped you get checked sooner?', helpText: 'Tick all that apply.', options: ['Knowing my risk level', 'Home screening option', 'Clear doctor guidance', 'Knowing which doctor to see', 'Knowing where to get screened', 'Knowing the cost', 'Doctor recommendation', 'Family encouragement', 'Easy booking process', 'Other'] },
        { id: 'q16_biggest_reason_not_sought', type: 'long_text', label: 'What is the biggest reason you have not sought help or screening?' },
      ],
    },
    {
      id: 'screening_experience',
      heading: 'Your Screening and Healthcare Experience',
      showIf: soughtHelp('Yes'),
      questions: [
        { id: 'q17_time_to_seek_help', type: 'single_choice', required: true, label: 'Approximately how long was it between first noticing your symptoms and seeking professional help?', options: ['Days', '<1 month', '1-6 months', '6-12 months', '1-3 years', '>3 years', "Can't remember"] },
        { id: 'q18_first_sought_where', type: 'single_choice', required: true, label: 'Where did you FIRST seek professional help?', options: ['Private GP clinic', 'Government clinic', 'Hospital', 'ENT specialist', 'Sleep specialist', 'Dentist', 'Other'] },
        { id: 'q19_after_first_consult', type: 'multi_choice', required: true, label: 'What happened after your first consultation?', helpText: 'Tick all that apply.', options: ['Advice', 'Treatment', 'Referral to a general doctor', 'Referral to a specialist', 'Further tests', 'Home sleep test', 'Overnight study', 'OSA diagnosis', 'Other diagnosis', 'Other'] },
        { id: 'q20_current_situation', type: 'single_choice', required: true, label: 'Which of the following best describes your current situation?', options: ['OSA diagnosed', 'Other diagnosis', 'Screened - no OSA', 'Still assessing', 'Unsure', 'Other'] },
        { id: 'q21_num_providers_seen', type: 'single_choice', required: true, label: 'How many different healthcare providers did you see before receiving a clear answer or diagnosis?', options: ['1', '2', '3', '4+', "Can't remember"] },
        { id: 'q22_ease_of_screening', type: 'single_choice', required: true, label: 'Overall, how easy or difficult was it to get screened?', options: ['Very easy', 'Easy', 'Neutral', 'Difficult', 'Very difficult'] },
        { id: 'q23_difficult_parts', type: 'multi_choice', required: true, label: 'Which parts of the screening or diagnosis journey were difficult?', helpText: 'Tick all that apply.', options: ['Starting the process', 'Finding the right doctor', 'Getting a referral', 'Booking an appointment', 'Waiting times', 'Cost', 'Travel', 'Work leave', 'The overall process', 'Sleep study', 'Overnight stay', 'Receiving results', 'Understanding next steps', 'Treatment', 'Monitoring', 'None', 'Other'] },
        { id: 'q24_most_frustrating_part', type: 'long_text', label: 'What was the most frustrating or difficult part of your screening or diagnosis journey?' },
        { id: 'q25_what_could_help_earlier', type: 'long_text', label: 'Looking back, what could have helped you get the right assessment or diagnosis earlier?' },
      ],
    },
    {
      id: 'challenges_support',
      heading: 'Challenges and Support You Needed',
      questions: [
        { id: 'q26_biggest_problem', type: 'single_choice', required: true, label: 'Thinking about your experience so far, which ONE best describes the biggest problem?', options: ["Didn't realise it was a health issue", 'Unknown seriousness', 'Unknown OSA risk', "Didn't know where to start", 'Which professional to see', 'Screening was inconvenient', 'Expensive', 'Process was too slow', 'Uncomfortable tests', "Didn't understand results", "Didn't know next step", 'Hard to monitor symptoms', 'No major problem', 'Other'] },
        { id: 'q27_one_thing_to_change', type: 'long_text', label: 'If you could change ONE thing about your journey from first noticing symptoms to getting appropriate help, what would you change?' },
        { id: 'q28_complete_sentence', type: 'long_text', label: 'Complete this sentence: "When I first noticed my snoring, sleep or breathing problem, I wish I had ______."' },
      ],
    },
    {
      id: 'airscan_solution',
      heading: 'Exploring AirScan as a Possible Solution',
      description: 'Imagine a digital platform called AirScan that allows you to perform an initial risk screening for Obstructive Sleep Apnea (OSA) from home using a facial scan together with a short health and sleep questionnaire.\n\nIt could provide an easy-to-understand risk result, explain possible risk factors, help monitor symptoms and guide you on whether you should seek further assessment from a healthcare professional.\n\nAirScan is intended for early screening and awareness and would not replace medical diagnosis or a sleep study.',
      questions: [
        { id: 'q29_usefulness_at_start', type: 'single_choice', required: true, label: 'How useful would this type of platform have been at the beginning of your journey?', options: ['None', 'Slight', 'Moderate', 'Very', 'Extreme'] },
        { id: 'q30_most_useful_point', type: 'single_choice', required: true, label: 'At which point in your journey would this platform be MOST useful?', options: ['First symptoms', 'When told I snore', 'When I became worried', 'Before seeing a doctor', 'Before sleep study', 'During waiting periods', 'After screening', 'After diagnosis', 'Ongoing monitoring', 'Not useful', 'Other'] },
        { id: 'q31_most_useful_features', type: 'multi_choice', required: true, label: 'Which features would be most useful to you?', helpText: 'Choose up to 5.', options: ['Quick screening', 'Facial scan', 'Questionnaire', 'Clear risk score', 'Risk explanation', 'Symptom tracking', 'Snoring and sleep monitoring', 'Repeat screening', 'Next-step guidance', 'When to see a doctor', 'Which specialist to see', 'Nearby centres', 'Cost estimate', 'Booking tools', 'Download report', 'Share report', 'Other'] },
        { id: 'q32_trust_factors', type: 'multi_choice', required: true, label: 'What would be your biggest concern about using such a platform?', helpText: 'Tick all that apply.', options: ['Scientific validation', 'Medical specialists involvement', 'University backing', 'Real patient data', 'Health-authority recognition', 'Clear method explanation', 'Doctor recommendation', 'Strong privacy policy', 'Other'] },
        { id: 'q33_service_concerns', type: 'multi_choice', required: true, label: 'What are your concerns regarding such a service?', helpText: 'Select all that apply.', options: ['Accuracy', 'Face privacy', 'Health data privacy', 'Getting a wrong result', 'Unnecessary worry', 'Not understanding the result', 'Cost', 'Difficulty of use', 'I prefer seeing a doctor in person', 'None', 'Other'] },
        { id: 'q34_likelihood_seek_assessment', type: 'single_choice', required: true, label: 'If you screened as high risk, how likely are you to seek a medical assessment?', options: ['Very unlikely', 'Unlikely', 'Unsure', 'Likely', 'Very likely'] },
        { id: 'q35_high_risk_support', type: 'multi_choice', required: true, label: 'After receiving a high-risk result, what support would you want?', helpText: 'Select up to 3.', options: ['Explanation of the result', 'Do I need a doctor?', 'Recommendation of a professional', 'Finding a clinic', 'Cost information', 'Booking assistance', 'Doctor report provided', 'Monitor while waiting', 'Reminders', 'Other'] },
        { id: 'q36_willing_to_pay', type: 'single_choice', required: true, label: 'Would you be willing to pay for this screening?', options: ['Yes', 'Maybe', 'No'] },
        { id: 'q37_reasonable_price_single', type: 'single_choice', required: true, label: 'What would be a reasonable price for a single screening?', options: ['Free', '<RM5', 'RM5-9', 'RM10-19', 'RM20-29', 'RM30-49', 'RM50-99', 'RM100+'] },
        { id: 'q38_reasonable_price_monthly', type: 'single_choice', required: true, label: 'What would be a reasonable price for a monthly package?', options: ['Free', '<RM5', 'RM5-9', 'RM10-19', 'RM20-29', 'RM30-49', 'RM50+', 'No subscription'] },
        { id: 'q39_payment_model', type: 'single_choice', required: true, label: 'What payment model would you prefer?', options: ['Free basic features, pay for advanced', 'Per screening', 'Monthly subscription', 'Annual subscription', 'Covered by clinic or hospital', 'Covered by employer', 'Covered by insurance', 'Other'] },
        { id: 'q40_most_valuable_feature', type: 'long_text', label: 'What is the ONE most valuable feature you would want?' },
        { id: 'q41_biggest_blocker', type: 'long_text', label: 'What is the ONE thing that would stop you from using this service?' },
        { id: 'q42_interview_interest', type: 'single_choice', required: true, label: 'Would you be interested in a future interview or user testing?', options: ['Yes', 'Maybe', 'No'] },
        { id: 'q43_contact_info', type: 'short_text', label: 'If yes, please provide your contact information.', showIf: interestedInInterview },
      ],
    },
  ],
};
