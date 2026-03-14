import { createCustomMentorProfile, getSuggestedPeople } from '../mentorProfiles';

describe('mentorProfiles', () => {
  it('maps a builtin person name back to the builtin mentor persona', () => {
    const profile = createCustomMentorProfile('Bill Gates');

    expect(profile.id).toBe('bill_gates');
    expect(profile.displayName).toBe('Bill Gates');
    expect(profile.coreValues).toContain('learning velocity');
    expect(profile.decisionPatterns).toContain('define the bottleneck first');
  });

  it('builds a known custom persona with distinct traits', () => {
    const profile = createCustomMentorProfile('Lisa Su');

    expect(profile.id).toBe('custom_lisa_su');
    expect(profile.displayName).toBe('Lisa Su');
    expect(profile.speakingStyle).toContain('direct and engineering-focused');
    expect(profile.coreValues).toContain('technical excellence');
  });

  it('builds MBTI personas with MBTI-specific guidance traits', () => {
    const profile = createCustomMentorProfile('INTJ');

    expect(profile.id).toBe('custom_intj');
    expect(profile.shortLabel).toBe('INTJ');
    expect(profile.searchKeywords).toEqual(['intj', 'intj']);
    expect(profile.decisionPatterns).toContain('model the system first');
    expect(profile.likelyBlindSpots).toContain('can overlook emotional pacing in tense moments');
  });

  it('suggests built-in mentors from fuzzy queries', () => {
    const suggestions = getSuggestedPeople('opra');

    expect(suggestions.map((item) => item.id)).toContain('oprah_winfrey');
  });
});
