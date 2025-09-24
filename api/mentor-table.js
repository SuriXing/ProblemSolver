const FALLBACK_DISCLAIMER =
  'This is an AI-simulated perspective inspired by public information, not a real statement from the person.';

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
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
        disclaimer: { type: 'string' }
      },
      required: ['disclaimer']
    }
  },
  required: ['safety', 'mentorReplies', 'meta']
};

function buildSystemPrompt() {
  return [
    'You are an AI feature called Mentor Table.',
    'Provide inspirational guidance in the style of selected public figures.',
    'Write the likelyResponse in first person voice (e.g., "I would...").',
    'Never claim to be the real person.',
    'Never fabricate direct quotes.',
    'Never invent private facts or private conversations.',
    'Use language like "they might say" and "a likely perspective".',
    'Give one concrete next action per mentor.',
    'If risk is high (self-harm/violence), set high risk and include emergency guidance.',
    'Return strictly valid JSON matching the required schema.'
  ].join('\n');
}

function buildUserPrompt(problem, language, mentors) {
  const mentorBlock = (mentors || [])
    .map((m) => {
      return [
        `MentorId: ${m.id}`,
        `MentorName: ${m.displayName}`,
        `SpeakingStyle: ${(m.speakingStyle || []).join('; ')}`,
        `CoreValues: ${(m.coreValues || []).join('; ')}`,
        `DecisionPatterns: ${(m.decisionPatterns || []).join('; ')}`,
        `KnownExperienceThemes: ${(m.knownExperienceThemes || []).join('; ')}`,
        `LikelyBlindSpots: ${(m.likelyBlindSpots || []).join('; ')}`
      ].join('\n');
    })
    .join('\n\n');

  return [
    `Problem: ${problem}`,
    `Response language: ${language === 'zh-CN' ? 'Chinese (Simplified)' : 'English'}`,
    '',
    'Mentors:',
    mentorBlock,
    '',
    `Global disclaimer must be: ${FALLBACK_DISCLAIMER}`
  ].join('\n');
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text && text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on server' });
    return;
  }

  try {
    const { problem, language, mentors } = req.body || {};

    if (!problem || typeof problem !== 'string') {
      res.status(400).json({ error: 'problem is required' });
      return;
    }

    if (!Array.isArray(mentors) || mentors.length === 0) {
      res.status(400).json({ error: 'at least one mentor is required' });
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'mentor_table_output',
            schema: RESPONSE_SCHEMA
          }
        },
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(problem, language || 'zh-CN', mentors) }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = tryParseJson(content);

    if (!parsed) {
      res.status(502).json({ error: 'Model returned invalid JSON' });
      return;
    }

    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error'
    });
  }
};
