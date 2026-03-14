import { createCustomMentorProfile } from '../mentorProfiles';
import { simulateMentorTable } from '../mentorEngine';

describe('mentorEngine', () => {
  it('returns localized fallback replies in Chinese', () => {
    const result = simulateMentorTable('我最近压力很大，不知道怎么办。', [createCustomMentorProfile('Bill Gates')], 'zh-CN');

    expect(result.language).toBe('zh-CN');
    expect(result.meta.source).toBe('fallback');
    expect(result.meta.disclaimer).toContain('AI模拟');
    expect(result.mentorReplies).toHaveLength(1);
    expect(result.mentorReplies[0].likelyResponse).toContain('我');
    expect(result.mentorReplies[0].oneActionStep).toContain('下一步');
  });

  it('detects high-risk input and exposes emergency guidance', () => {
    const result = simulateMentorTable('I want to die and hurt myself.', [createCustomMentorProfile('Oprah Winfrey')], 'en');

    expect(result.safety.riskLevel).toBe('high');
    expect(result.safety.needsProfessionalHelp).toBe(true);
    expect(result.safety.emergencyMessage).toContain('emergency services');
  });

  it('returns one reply per mentor and keeps their voices distinct enough to be useful', () => {
    const result = simulateMentorTable(
      'My boss forces holiday overtime and I feel exhausted.',
      [createCustomMentorProfile('Bill Gates'), createCustomMentorProfile('Kobe Bryant')],
      'en'
    );

    expect(result.mentorReplies).toHaveLength(2);
    expect(result.mentorReplies[0].mentorId).toBe('bill_gates');
    expect(result.mentorReplies[1].mentorId).toBe('kobe_bryant');
    expect(result.mentorReplies[0].likelyResponse).not.toEqual(result.mentorReplies[1].likelyResponse);
  });
});
