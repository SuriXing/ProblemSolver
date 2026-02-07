import { MentorProfile } from './mentorProfiles';

export interface MentorPromptInput {
  userProblem: string;
  language: 'zh-CN' | 'en';
  mentors: MentorProfile[];
}

export const MENTOR_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'string', enum: ['mentor_table.v1'] },
    language: { type: 'string', enum: ['en', 'zh-CN'] },
    safety: {
      type: 'object',
      additionalProperties: false,
      properties: {
        riskLevel: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        needsProfessionalHelp: { type: 'boolean' },
        emergencyMessage: { type: 'string' }
      },
      required: ['riskLevel', 'needsProfessionalHelp', 'emergencyMessage']
    },
    mentorReplies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          mentorId: { type: 'string' },
          mentorName: { type: 'string' },
          likelyResponse: { type: 'string' },
          whyThisFits: { type: 'string' },
          oneActionStep: { type: 'string' },
          confidenceNote: { type: 'string' }
        },
        required: [
          'mentorId',
          'mentorName',
          'likelyResponse',
          'whyThisFits',
          'oneActionStep',
          'confidenceNote'
        ]
      }
    },
    meta: {
      type: 'object',
      additionalProperties: false,
      properties: {
        disclaimer: { type: 'string' },
        generatedAt: { type: 'string' },
        provider: { type: 'string' },
        model: { type: 'string' }
      },
      required: ['disclaimer', 'generatedAt']
    }
  },
  required: ['schemaVersion', 'language', 'safety', 'mentorReplies', 'meta']
} as const;

export function buildMentorSystemPrompt(): string {
  return [
    'You are an AI feature called Mentor Table.',
    'Goal: provide inspirational, personality-based guidance in the style of selected public figures.',
    'Critical rules:',
    '1) Never claim to be the real person.',
    '2) Never fabricate direct quotes.',
    '3) Never invent private facts, private conversations, or exact historical details unless explicitly provided.',
    '4) Write likelyResponse in direct first-person style.',
    '5) Do not use wording such as "if I were", "as X", or "from X perspective".',
    '6) Keep practical and empathetic. Give exactly one concrete next action per mentor.',
    '7) If user content suggests self-harm, violence, abuse, or severe mental distress, set safety.riskLevel to high and include clear emergency guidance.',
    '8) This is not medical, legal, or financial professional advice.',
    '9) Output must strictly match the provided JSON schema.',
    '10) Always set schemaVersion = "mentor_table.v1".'
  ].join('\n');
}

export function buildMentorUserPrompt(input: MentorPromptInput): string {
  const mentorBlock = input.mentors
    .map((m) => {
      return [
        `MentorId: ${m.id}`,
        `MentorName: ${m.displayName}`,
        `SpeakingStyle: ${m.speakingStyle.join('; ')}`,
        `CoreValues: ${m.coreValues.join('; ')}`,
        `DecisionPatterns: ${m.decisionPatterns.join('; ')}`,
        `KnownExperienceThemes: ${m.knownExperienceThemes.join('; ')}`,
        `LikelyBlindSpots: ${m.likelyBlindSpots.join('; ')}`,
        `AvoidClaims: ${m.avoidClaims.join('; ')}`
      ].join('\n');
    })
    .join('\n\n');

  const responseLanguage = input.language === 'zh-CN' ? 'Chinese (Simplified)' : 'English';

  return [
    `User problem:\n${input.userProblem}`,
    '',
    `Response language: ${responseLanguage}`,
    '',
    'Selected mentor profiles:',
    mentorBlock,
    '',
    'Response format requirements:',
    '- For each mentor, return three user-facing sections:',
    '  1) likelyResponse',
    '  2) whyThisFits',
    '  3) oneActionStep',
    '- Keep each section concise and specific.',
    '- Include confidenceNote that reminds this is a simulation, not a real statement by the person.',
    '- Include a global disclaimer in meta.disclaimer.'
  ].join('\n');
}

export const MENTOR_TABLE_DISCLAIMER =
  'This is an AI-simulated perspective inspired by public information, not a real statement from the person.';
