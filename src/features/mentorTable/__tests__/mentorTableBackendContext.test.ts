import { createCustomMentorProfile } from '../mentorProfiles';

async function loadMentorTableTestHelpers() {
  // @ts-expect-error test-only import of CommonJS backend module without TS declarations
  const mod = await import('../../../../api/mentor-table.js');
  const handler = (mod.default || mod) as {
    __test__?: {
      normalizeConversationHistory: (history: unknown[]) => Array<{ role: string; speaker: string; text: string }>;
      buildConversationRounds: (entries: Array<{ role: string; speaker: string; text: string }>) => Array<
        Array<{ role: string; speaker: string; text: string }>
      >;
      compactConversationHistoryDeterministic: (
        entries: Array<{ role: string; speaker: string; text: string }>,
        maxItems?: number,
        maxChars?: number
      ) => {
        entries: Array<{ role: string; speaker: string; text: string }>;
        summary: string;
        omittedCount: number;
      };
      compactConversationHistory: (
        history: unknown[],
        options?: Record<string, unknown>
      ) => Promise<{
        entries: Array<{ role: string; speaker: string; text: string }>;
        summary: string;
        omittedCount: number;
        usedLlmCompression: boolean;
      }>;
      formatConversationHistoryForPrompt: (
        history: Array<{ role: string; speaker: string; text: string }>
      ) => string;
      buildUserPrompt: (
        problem: string,
        language: 'zh-CN' | 'en',
        mentors: ReturnType<typeof createCustomMentorProfile>[],
        compactedConversation: {
          entries: Array<{ role: string; speaker: string; text: string }>;
          summary: string;
          omittedCount: number;
          usedLlmCompression: boolean;
        }
      ) => string;
      buildMentorDirectiveBlock: (mentors: ReturnType<typeof createCustomMentorProfile>[]) => string;
    };
  };
  if (!handler.__test__) {
    throw new Error('mentor-table test helpers are not exposed');
  }
  return handler.__test__;
}

describe('mentor-table backend context continuity', () => {
  it('builds a shared prompt that includes prior user and mentor conversation history', async () => {
    const helpers = await loadMentorTableTestHelpers();
    const mentors = [createCustomMentorProfile('Lisa Su'), createCustomMentorProfile('Satya Nadella')];
    const history = helpers.normalizeConversationHistory([
      { role: 'user', speaker: 'You', text: 'I am overwhelmed at work.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Start by cutting the scope and stabilizing the basics.' },
      { role: 'mentor', speaker: 'Satya Nadella', text: 'Align with your team on one priority before expanding.' },
      { role: 'user', speaker: 'You', text: 'Lisa, Satya, my boss keeps changing priorities every day.' }
    ]);

    const prompt = helpers.buildUserPrompt(
      'Lisa, Satya, my boss keeps changing priorities every day.',
      'en',
      mentors,
      {
        entries: history,
        summary: '',
        omittedCount: 0,
        usedLlmCompression: false
      }
    );

    expect(prompt).toContain('Conversation context (newest messages may include user and mentor back-and-forth):');
    expect(prompt).toContain('[user] You: I am overwhelmed at work.');
    expect(prompt).toContain('[mentor] Lisa: Start by cutting the scope and stabilizing the basics.');
    expect(prompt).toContain('[mentor] Satya Nadella: Align with your team on one priority before expanding.');
    expect(prompt).toContain('Use this context as part of reasoning. Respond to the latest user concern while aligning with conversation flow.');
  });

  it('keeps the first two and last two rounds when compaction is forced for long group conversations', async () => {
    const helpers = await loadMentorTableTestHelpers();
    const history = [
      { role: 'user', speaker: 'You', text: 'Round 1 user concern about burnout.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 1 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 1 Satya advice.' },
      { role: 'user', speaker: 'You', text: 'Round 2 user follow-up about unclear priorities.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 2 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 2 Satya advice.' },
      { role: 'user', speaker: 'You', text: 'Round 3 user update about stress.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 3 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 3 Satya advice.' },
      { role: 'user', speaker: 'You', text: 'Round 4 user update about team conflict.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 4 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 4 Satya advice.' },
      { role: 'user', speaker: 'You', text: 'Round 5 user asks both mentors for a plan.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 5 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 5 Satya advice.' },
      { role: 'user', speaker: 'You', text: 'Round 6 user asks how to communicate upward.' },
      { role: 'mentor', speaker: 'Lisa', text: 'Round 6 Lisa advice.' },
      { role: 'mentor', speaker: 'Satya', text: 'Round 6 Satya advice.' }
    ];

    const compacted = await helpers.compactConversationHistory(history, {
      tokenThreshold: 1,
      maxItems: 99,
      maxChars: 20000,
      language: 'en',
      model: 'test-model',
      apiKey: '',
      chatCompletionsUrl: 'http://127.0.0.1:9/disabled',
      compressTimeoutMs: 5
    });

    const formatted = helpers.formatConversationHistoryForPrompt(compacted.entries);

    expect(compacted.usedLlmCompression).toBe(true);
    expect(compacted.summary).toContain('Middle rounds compacted');
    expect(formatted).toContain('Round 1 user concern about burnout.');
    expect(formatted).toContain('Round 2 user follow-up about unclear priorities.');
    expect(formatted).toContain('Round 5 user asks both mentors for a plan.');
    expect(formatted).toContain('Round 6 user asks how to communicate upward.');
    expect(formatted).not.toContain('Round 3 user update about stress.');
    expect(formatted).not.toContain('Round 4 user update about team conflict.');
  });

  it('includes mentor-specific directive blocks so each persona keeps its own voice while sharing history', async () => {
    const helpers = await loadMentorTableTestHelpers();
    const mentors = [createCustomMentorProfile('Lisa Su'), createCustomMentorProfile('Satya Nadella')];

    const directives = helpers.buildMentorDirectiveBlock(mentors);

    expect(directives).toContain('MentorId: custom_lisa_su');
    expect(directives).toContain('MentorName: Lisa Su');
    expect(directives).toContain('SpeakingStyle: direct and engineering-focused');
    expect(directives).toContain('MentorId: custom_satya_nadella');
    expect(directives).toContain('MentorName: Satya Nadella');
    expect(directives).toContain('SpeakingStyle: calm and empathetic');
  });
});
