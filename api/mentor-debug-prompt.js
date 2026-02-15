function normalizeLanguage(language) {
  return language === 'zh-CN' ? 'zh-CN' : 'en';
}

function buildMentorPromptBlock(mentor, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'zh-CN') {
    return [
      `MentorId: ${mentor.id || ''}`,
      `MentorName: ${mentor.displayName || mentor.shortLabel || 'Mentor'}`,
      `SpeakingStyle: ${(mentor.speakingStyle || []).join('; ')}`,
      `CoreValues: ${(mentor.coreValues || []).join('; ')}`,
      `DecisionPatterns: ${(mentor.decisionPatterns || []).join('; ')}`,
      `KnownExperienceThemes: ${(mentor.knownExperienceThemes || []).join('; ')}`,
      `LikelyBlindSpots: ${(mentor.likelyBlindSpots || []).join('; ')}`,
      `AvoidClaims: ${(mentor.avoidClaims || []).join('; ')}`,
      '',
      'OutputRules:',
      '1) 必须第一人称表达。',
      '2) 不要说“如果我是X/作为X”。',
      '3) 每次回复要有一个具体下一步动作。',
      '4) 不得虚构私密事实或伪造原话。'
    ].join('\n');
  }

  return [
    `MentorId: ${mentor.id || ''}`,
    `MentorName: ${mentor.displayName || mentor.shortLabel || 'Mentor'}`,
    `SpeakingStyle: ${(mentor.speakingStyle || []).join('; ')}`,
    `CoreValues: ${(mentor.coreValues || []).join('; ')}`,
    `DecisionPatterns: ${(mentor.decisionPatterns || []).join('; ')}`,
    `KnownExperienceThemes: ${(mentor.knownExperienceThemes || []).join('; ')}`,
    `LikelyBlindSpots: ${(mentor.likelyBlindSpots || []).join('; ')}`,
    `AvoidClaims: ${(mentor.avoidClaims || []).join('; ')}`,
    '',
    'OutputRules:',
    '1) Use strict first-person voice.',
    '2) Do not use "if I were X" or "as X".',
    '3) End with one concrete next action.',
    '4) No fabricated private facts or direct quotes.'
  ].join('\n');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { mentor, language } = req.body || {};
    if (!mentor || typeof mentor !== 'object') {
      res.status(400).json({ error: 'mentor is required' });
      return;
    }

    const prompt = buildMentorPromptBlock(mentor, language);
    res.status(200).json({ prompt });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown server error' });
  }
};

