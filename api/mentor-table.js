const FALLBACK_DISCLAIMER =
  'This is an AI-simulated perspective inspired by public information, not a real statement from the person.';
const RESPONSE_SCHEMA_VERSION = 'mentor_table.v1';

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'string', enum: [RESPONSE_SCHEMA_VERSION] },
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
};

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'zh-CN';
}

function normalizeRiskLevel(value) {
  if (value === 'none' || value === 'low' || value === 'medium' || value === 'high') return value;
  return 'low';
}

function providerFromBaseUrl(baseUrl) {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return 'unknown';
  }
}

function finalizeContractShape(normalized, { language, baseUrl, model }) {
  const lang = normalizeLanguage(language);
  const safety = normalized?.safety || {};
  const meta = normalized?.meta || {};
  const replies = Array.isArray(normalized?.mentorReplies)
    ? normalized.mentorReplies.filter((item) => item && typeof item === 'object')
    : [];

  return {
    schemaVersion: RESPONSE_SCHEMA_VERSION,
    language: lang,
    safety: {
      riskLevel: normalizeRiskLevel(safety.riskLevel),
      needsProfessionalHelp: Boolean(safety.needsProfessionalHelp),
      emergencyMessage: typeof safety.emergencyMessage === 'string' ? safety.emergencyMessage : ''
    },
    mentorReplies: replies.map((item) => ({
      mentorId: String(item.mentorId || ''),
      mentorName: String(item.mentorName || 'Mentor'),
      likelyResponse: String(item.likelyResponse || ''),
      whyThisFits: String(item.whyThisFits || ''),
      oneActionStep: String(item.oneActionStep || ''),
      confidenceNote: String(item.confidenceNote || defaultConfidenceNote(lang))
    })),
    meta: {
      disclaimer:
        typeof meta.disclaimer === 'string' && meta.disclaimer.trim()
          ? meta.disclaimer
          : FALLBACK_DISCLAIMER,
      generatedAt: new Date().toISOString(),
      provider: providerFromBaseUrl(baseUrl),
      model: typeof model === 'string' ? model : ''
    }
  };
}

function buildSystemPrompt() {
  return [
    'You are an AI feature called Mentor Table.',
    'Provide inspirational guidance in the style of selected public figures.',
    'Write likelyResponse strictly in direct first-person voice.',
    'Do not use phrases such as "if I were", "in a X-like way", "as X", or "from X perspective".',
    'Use natural voice like: "I understand this is hard. I would..."',
    'Each mentor reply must be distinctly different in tone, framing, and action.',
    'Do not repeat the same advice structure across mentors.',
    'Never claim to be the real person.',
    'Never fabricate direct quotes.',
    'Never invent private facts or private conversations.',
    'For EACH selected mentor, return exactly ONE reply.',
    'mentorReplies length must equal selected mentor count, no missing mentor, no duplicate mentorId.',
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
    `Response language: ${normalizeLanguage(language) === 'zh-CN' ? 'Chinese (Simplified)' : 'English'}`,
    `schemaVersion must be: ${RESPONSE_SCHEMA_VERSION}`,
    '',
    'Mentors:',
    mentorBlock,
    '',
    `Global disclaimer must be: ${FALLBACK_DISCLAIMER}`
  ].join('\n');
}

function tryParseJson(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;

  const normalizedText = String(text).trim();

  // Handle fenced code blocks: ```json ... ```
  const fenced = normalizedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // Continue trying below.
    }
  }

  try {
    return JSON.parse(normalizedText);
  } catch {
    // Handle top-level array payloads.
    if (normalizedText.startsWith('[') && normalizedText.endsWith(']')) {
      try {
        const arr = JSON.parse(normalizedText);
        return { replies: arr };
      } catch {
        // Continue trying below.
      }
    }

    // Handle multiple top-level JSON objects separated by semicolons/newlines.
    const multiMatches = normalizedText.match(/\{[\s\S]*?\}/g);
    if (multiMatches && multiMatches.length > 1) {
      const parsedItems = multiMatches
        .map((chunk) => {
          try {
            return JSON.parse(chunk);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (parsedItems.length > 0) {
        return { replies: parsedItems };
      }
    }

    const match = normalizedText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeFirstPerson(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/^\s*if i were[^,.]*[,.]\s*/i, '')
    .replace(/^\s*in a [^,.]*-like way[,.]?\s*/i, '')
    .replace(/^\s*as [^,.]+[,.]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultConfidenceNote(language) {
  return language === 'zh-CN'
    ? '这是基于公开信息生成的AI模拟视角，不代表本人真实发言。'
    : 'This is an AI-simulated perspective based on public information, not an actual statement by the person.';
}

function defaultActionStep(language) {
  return language === 'zh-CN'
    ? '下一步：先写下今天能完成的一件小事，并在30分钟内执行。'
    : 'Next step: choose one small concrete action and complete it within 30 minutes today.';
}

function normalizeProviderPayload(raw, { mentors, language }) {
  if (!raw || typeof raw !== 'object') return null;

  const normalizeSafety = (safety) => ({
    riskLevel: safety?.riskLevel || 'low',
    needsProfessionalHelp: Boolean(safety?.needsProfessionalHelp),
    emergencyMessage: safety?.emergencyMessage || ''
  });

  const normalizeReply = (item) => {
    if (!item || typeof item !== 'object') return null;
    const mentorId = item.mentorId || item.MentorId || item.id || '';
    const mentorName = item.mentorName || item.MentorName || mentorId || 'Mentor';
    const likelyResponse =
      item.likelyResponse || item.Response || item.response || item.message || item.advice || '';
    if (!likelyResponse) return null;

    return {
      mentorId,
      mentorName,
      likelyResponse,
      whyThisFits: item.whyThisFits || item.WhyThisFits || item.reason || item.rationale || '',
      oneActionStep:
        item.oneActionStep ||
        item.OneActionStep ||
        item.nextAction ||
        item.NextAction ||
        defaultActionStep(language),
      confidenceNote:
        item.confidenceNote ||
        item.ConfidenceNote ||
        item.confidence ||
        item.note ||
        defaultConfidenceNote(language)
    };
  };

  // Shape variant: { mentorReplies: [...], ... } but missing strict safety/meta keys.
  if (Array.isArray(raw.mentorReplies)) {
    const mentorReplies = raw.mentorReplies.map(normalizeReply).filter(Boolean);
    if (mentorReplies.length > 0) {
      return {
        safety: normalizeSafety(raw.safety),
        mentorReplies,
        meta: {
          disclaimer:
            raw?.meta?.disclaimer ||
            raw?.GlobalDisclaimer ||
            raw?.globalDisclaimer ||
            raw?.disclaimer ||
            FALLBACK_DISCLAIMER
        }
      };
    }
  }

  // Shape: { MentorId, Response, GlobalDisclaimer, ... }
  if (typeof raw.MentorId === 'string' && typeof raw.Response === 'string') {
    const matchedMentor =
      (mentors || []).find((m) => m.id === raw.MentorId || m.displayName === raw.MentorName) || null;
    return {
      safety: {
        riskLevel: 'low',
        needsProfessionalHelp: false,
        emergencyMessage: ''
      },
      mentorReplies: [
        {
          mentorId: raw.MentorId,
          mentorName: raw.MentorName || matchedMentor?.displayName || raw.MentorId,
          likelyResponse: raw.Response,
          whyThisFits: raw.WhyThisFits || '',
          oneActionStep: raw.OneActionStep || raw.NextAction || defaultActionStep(language),
          confidenceNote: raw.ConfidenceNote || defaultConfidenceNote(language)
        }
      ],
      meta: {
        disclaimer: raw.GlobalDisclaimer || FALLBACK_DISCLAIMER
      }
    };
  }

  // Shape: { replies: [{ MentorId, Response, ... }], ... }
  if (Array.isArray(raw.replies)) {
    const mentorReplies = raw.replies
      .map(normalizeReply)
      .filter(Boolean);

    if (mentorReplies.length > 0) {
      return {
        safety: normalizeSafety(raw.safety),
        mentorReplies,
        meta: {
          disclaimer:
            raw?.meta?.disclaimer ||
            raw?.GlobalDisclaimer ||
            raw?.globalDisclaimer ||
            raw?.disclaimer ||
            FALLBACK_DISCLAIMER
        }
      };
    }
  }

  // Shape: { "bill_gates": { mentorId, mentorName, response, ... }, ... }
  // Some providers return a mentorId-keyed object instead of an array.
  const objectValues = Object.values(raw || {}).filter((v) => v && typeof v === 'object' && !Array.isArray(v));
  if (objectValues.length > 0) {
    const mentorReplies = objectValues
      .map((item) => normalizeReply(item))
      .filter(Boolean);

    if (mentorReplies.length > 0) {
      return {
        safety: normalizeSafety(raw.safety),
        mentorReplies,
        meta: {
          disclaimer:
            raw?.meta?.disclaimer ||
            raw?.GlobalDisclaimer ||
            raw?.globalDisclaimer ||
            raw?.disclaimer ||
            FALLBACK_DISCLAIMER
        }
      };
    }
  }

  return null;
}

function extractAssistantContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const texts = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      })
      .filter(Boolean);
    return texts.join('\n').trim();
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content);
  }
  return '';
}

async function callChatCompletions({ url, apiKey, payload, signal }) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
    signal
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.LLM_API_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const upstreamTimeoutMs = Number(process.env.MENTOR_UPSTREAM_TIMEOUT_MS || 25000);
  const chatCompletionsUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const isDashscope = /dashscope\.aliyuncs\.com/i.test(baseUrl);

  if (!apiKey) {
    res.status(500).json({ error: 'LLM_API_KEY (or OPENAI_API_KEY) is not configured on server' });
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

    const payload = {
      model,
      temperature: 0.7,
      response_format: isDashscope
        ? { type: 'json_object' }
        : {
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
    };

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);
    let response;
    try {
      console.log(`[mentor-api] upstream request start model=${model}`);
      response = await callChatCompletions({
        url: chatCompletionsUrl,
        apiKey,
        payload,
        signal: controller.signal
      });

      // Some OpenAI-compatible providers may not support json_schema mode.
      // Retry once with plain JSON instruction if the first request is rejected.
      if (!response.ok && response.status >= 400 && response.status < 500 && payload.response_format?.type === 'json_schema') {
        const fallbackPayload = {
          ...payload,
          response_format: { type: 'json_object' }
        };

        response = await callChatCompletions({
          url: chatCompletionsUrl,
          apiKey,
          payload: fallbackPayload,
          signal: controller.signal
        });
      }
    } finally {
      clearTimeout(timeout);
    }

    console.log(`[mentor-api] upstream response status=${response.status} elapsed=${Date.now() - startedAt}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    const data = await response.json();
    let content = extractAssistantContent(data);
    let parsed = tryParseJson(content);

    // Repair pass: ask model to convert its own output into strict JSON.
    if (!parsed) {
      const repairPayload = {
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Convert the given text into valid JSON only. No markdown. Use keys: schemaVersion, language, safety, mentorReplies, meta.'
          },
          {
            role: 'user',
            content:
              `Selected mentor count: ${mentors.length}\n` +
              `Target schema keys: schemaVersion, language, safety, mentorReplies, meta\n` +
              `Raw output to repair:\n${String(content || '').slice(0, 6000)}`
          }
        ]
      };

      const repairResponse = await callChatCompletions({
        url: chatCompletionsUrl,
        apiKey,
        payload: repairPayload
      });

      if (repairResponse.ok) {
        const repairedData = await repairResponse.json();
        content = extractAssistantContent(repairedData);
        parsed = tryParseJson(content);
      }
    }

    const normalized = normalizeProviderPayload(parsed, { mentors, language: language || 'zh-CN' });

    if (!normalized) {
      const preview = String(content || '').slice(0, 180).replace(/\s+/g, ' ');
      res.status(502).json({ error: `Model returned invalid JSON. Preview: ${preview}` });
      return;
    }

    if (Array.isArray(normalized.mentorReplies)) {
      normalized.mentorReplies = normalized.mentorReplies.map((item) => ({
        ...item,
        likelyResponse: sanitizeFirstPerson(item.likelyResponse),
        oneActionStep: sanitizeFirstPerson(item.oneActionStep)
      }));
    }

    // Ensure one reply per selected mentor; fill missing with a distinct fallback note.
    if (Array.isArray(mentors) && mentors.length > 0) {
      const byId = new Map();
      for (const reply of normalized.mentorReplies || []) {
        if (reply?.mentorId && !byId.has(reply.mentorId)) {
          byId.set(reply.mentorId, reply);
        }
      }

      for (const mentor of mentors) {
        if (!byId.has(mentor.id)) {
          byId.set(mentor.id, {
            mentorId: mentor.id,
            mentorName: mentor.displayName,
            likelyResponse:
              (language || 'zh-CN') === 'zh-CN'
                ? `我理解你的处境。对这个问题，我会用我一贯的方式先明确最关键的一步，再快速执行并复盘。`
                : `I understand your situation. I would approach this with my typical style: define the key first move, execute, then review quickly.`,
            whyThisFits:
              (language || 'zh-CN') === 'zh-CN'
                ? `这条建议基于${mentor.displayName}公开风格生成。`
                : `This guidance is generated from ${mentor.displayName}'s public style.`,
            oneActionStep: defaultActionStep(language || 'zh-CN'),
            confidenceNote: defaultConfidenceNote(language || 'zh-CN')
          });
        }
      }

      normalized.mentorReplies = mentors.map((m) => byId.get(m.id));
    }

    const finalized = finalizeContractShape(normalized, {
      language: normalizeLanguage(language || 'zh-CN'),
      baseUrl,
      model
    });

    res.status(200).json(finalized);
  } catch (error) {
    console.error('[mentor-api] error:', error);
    res.status(500).json({
      error: error instanceof Error && error.name === 'AbortError'
        ? 'Upstream LLM request timed out'
        : error instanceof Error ? error.message : 'Unknown server error'
    });
  }
};
