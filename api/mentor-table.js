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

function riskLevelScore(level) {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  if (level === 'low') return 1;
  if (level === 'none') return 0;
  return 1;
}

function mergeSafetyState(acc, next) {
  if (!next || typeof next !== 'object') return acc;
  const nextRisk = normalizeRiskLevel(next.riskLevel);
  const accRisk = normalizeRiskLevel(acc.riskLevel);
  const useNext = riskLevelScore(nextRisk) > riskLevelScore(accRisk);
  return {
    riskLevel: useNext ? nextRisk : accRisk,
    needsProfessionalHelp: Boolean(acc.needsProfessionalHelp || next.needsProfessionalHelp),
    emergencyMessage: useNext
      ? next.emergencyMessage || acc.emergencyMessage || ''
      : acc.emergencyMessage || next.emergencyMessage || ''
  };
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'zh-CN';
}

function detectLanguageFromText(text) {
  if (typeof text !== 'string') return null;
  const value = text.trim();
  if (!value) return null;
  const cjkCount = (value.match(/[\u3400-\u9fff]/g) || []).length;
  const latinCount = (value.match(/[A-Za-z]/g) || []).length;
  if (cjkCount === 0 && latinCount === 0) return null;
  if (cjkCount >= latinCount * 0.8) return 'zh-CN';
  if (latinCount >= cjkCount * 0.8) return 'en';
  return cjkCount >= latinCount ? 'zh-CN' : 'en';
}

function resolveEffectiveLanguage(requestedLanguage, problem, conversationHistory) {
  const problemLanguage = detectLanguageFromText(problem);
  if (problemLanguage) return problemLanguage;

  if (Array.isArray(conversationHistory)) {
    for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
      const item = conversationHistory[i];
      if (!item || item.role !== 'user') continue;
      const detected = detectLanguageFromText(item.text);
      if (detected) return detected;
    }
  }

  return normalizeLanguage(requestedLanguage);
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

function buildMentorDirectiveBlock(mentors = []) {
  if (!Array.isArray(mentors) || mentors.length === 0) return 'No mentor directives provided.';
  return mentors
    .map((m) =>
      [
        `MentorId: ${m.id}`,
        `MentorName: ${m.displayName}`,
        `SpeakingStyle: ${(m.speakingStyle || []).join('; ')}`,
        `CoreValues: ${(m.coreValues || []).join('; ')}`,
        `DecisionPatterns: ${(m.decisionPatterns || []).join('; ')}`,
        `KnownExperienceThemes: ${(m.knownExperienceThemes || []).join('; ')}`,
        `LikelyBlindSpots: ${(m.likelyBlindSpots || []).join('; ')}`,
        `AvoidClaims: ${(m.avoidClaims || []).join('; ')}`
      ].join('\n')
    )
    .join('\n\n');
}

function buildSystemPrompt(mentors) {
  const mentorDirectives = buildMentorDirectiveBlock(mentors);
  return [
    'We are running a Mentor Table.',
    'You are the following mentor directives set:',
    mentorDirectives,
    '',
    'Priority rules:',
    '1) Safety first. If content suggests self-harm or violence risk, raise risk and provide urgent help guidance.',
    '2) Persona fidelity. For each selected mentor, follow that mentor directive block (style, values, decision patterns, blind spots).',
    '3) Distinct voices. Mentors must not sound the same; vary framing, tone, and action focus.',
    '4) Conversation continuity. Use prior conversation context; respond to the latest user concern while staying coherent with earlier turns.',
    '5) First-person style only. Speak naturally as the simulated mentor voice; never use "if I were X" or "as X".',
    '6) No impersonation claims. Never claim to be the real person; no fabricated quotes or private facts.',
    '7) Actionability. End each mentor advice with one concrete next step.',
    '',
    'Output discipline:',
    '- Return only one valid JSON object that conforms to the provided schema.',
    '- No markdown, no extra prose outside JSON.',
    '- For each selected mentor, return exactly one reply. No missing mentor, no duplicate mentorId.'
  ].join('\n');
}

function normalizeHistoryRole(value) {
  if (value === 'user' || value === 'mentor' || value === 'system') return value;
  return 'system';
}

function normalizeConversationHistory(history) {
  return Array.isArray(history)
    ? history
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const role = normalizeHistoryRole(item.role);
          const speaker = typeof item.speaker === 'string' ? item.speaker.trim() : '';
          const text = typeof item.text === 'string' ? item.text.trim().replace(/\s+/g, ' ') : '';
          return { role, speaker, text };
        })
        .filter((item) => item.text)
    : [];
}

function estimateTokens(text) {
  if (!text) return 0;
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const nonCjk = Math.max(0, text.length - cjk);
  return cjk + Math.ceil(nonCjk / 4);
}

function buildConversationRounds(entries) {
  const rounds = [];
  let current = [];

  for (const item of entries) {
    if (item.role === 'user') {
      if (current.length) rounds.push(current);
      current = [item];
      continue;
    }
    if (!current.length) {
      current = [item];
    } else {
      current.push(item);
    }
  }
  if (current.length) rounds.push(current);
  return rounds;
}

function summarizeCompactedMiddleDeterministic(middleEntries) {
  const omittedUsers = middleEntries
    .filter((item) => item.role === 'user')
    .slice(-3)
    .map((item) => item.text.slice(0, 140));
  const omittedMentors = Array.from(
    new Set(
      middleEntries
        .filter((item) => item.role === 'mentor')
        .map((item) => item.speaker)
        .filter(Boolean)
    )
  ).slice(0, 8);

  return `Middle rounds compacted. User-highlights: ${omittedUsers.join(' | ') || 'none'}. Mentor-participants: ${omittedMentors.join(', ') || 'none'}.`;
}

function compactConversationHistoryDeterministic(entries, maxItems = 36, maxChars = 6000) {
  if (entries.length === 0) {
    return { entries: [], summary: '', omittedCount: 0, usedLlmCompression: false, estimatedTokens: 0 };
  }

  const countChars = (rows) => rows.reduce((sum, item) => sum + item.text.length + item.speaker.length + 12, 0);
  if (entries.length <= maxItems && countChars(entries) <= maxChars) {
    return {
      entries,
      summary: '',
      omittedCount: 0,
      usedLlmCompression: false,
      estimatedTokens: estimateTokens(formatConversationHistoryForPrompt(entries))
    };
  }

  const headKeep = Math.min(4, entries.length);
  const head = entries.slice(0, headKeep);

  const tailBudget = Math.max(1200, Math.floor(maxChars * 0.68));
  const tail = [];
  let tailChars = 0;
  for (let i = entries.length - 1; i >= headKeep; i -= 1) {
    const item = entries[i];
    const itemChars = item.text.length + item.speaker.length + 12;
    if (tail.length >= Math.max(6, maxItems - headKeep)) break;
    if (tailChars + itemChars > tailBudget) break;
    tail.push(item);
    tailChars += itemChars;
  }
  tail.reverse();

  let compactedEntries = [...head, ...tail];
  if (compactedEntries.length > maxItems) {
    compactedEntries = compactedEntries.slice(compactedEntries.length - maxItems);
  }

  const omittedCount = Math.max(0, entries.length - compactedEntries.length);
  const omittedMiddle = entries.slice(headKeep, entries.length - tail.length);
  const summary = omittedCount > 0 ? summarizeCompactedMiddleDeterministic(omittedMiddle) : '';

  return {
    entries: compactedEntries,
    summary,
    omittedCount,
    usedLlmCompression: false,
    estimatedTokens: estimateTokens(formatConversationHistoryForPrompt(entries))
  };
}

async function summarizeCompactedMiddleWithLLM({
  middleEntries,
  language,
  model,
  apiKey,
  chatCompletionsUrl,
  compressTimeoutMs
}) {
  const lang = normalizeLanguage(language);
  const middleText = formatConversationHistoryForPrompt(middleEntries).slice(0, 120000);
  if (!middleText.trim()) return '';

  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          lang === 'zh-CN'
            ? '你是对话压缩器。请把对话中段压缩成结构化摘要。保持事实，不新增观点，不输出Markdown。'
            : 'You are a conversation compressor. Compress middle conversation rounds into a structured factual summary. No markdown.'
      },
      {
        role: 'user',
        content:
          lang === 'zh-CN'
            ? [
                '请输出JSON对象，字段如下：',
                '{',
                '  "summary": "2-6句概述主线",',
                '  "userConcerns": ["最多5条用户关切"],',
                '  "mentorDirections": ["最多6条导师建议方向"],',
                '  "openLoops": ["最多4条未解决问题"]',
                '}',
                '',
                '对话中段如下：',
                middleText
              ].join('\n')
            : [
                'Return a JSON object with fields:',
                '{',
                '  "summary": "2-6 sentence overview",',
                '  "userConcerns": ["up to 5 user concerns"],',
                '  "mentorDirections": ["up to 6 mentor guidance directions"],',
                '  "openLoops": ["up to 4 unresolved items"]',
                '}',
                '',
                'Middle conversation rounds:',
                middleText
              ].join('\n')
      }
    ]
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), compressTimeoutMs);
  try {
    const response = await callChatCompletions({
      url: chatCompletionsUrl,
      apiKey,
      payload,
      signal: controller.signal
    });
    if (!response.ok) return '';
    const data = await response.json();
    const content = extractAssistantContent(data);
    const parsed = tryParseJson(content);
    if (!parsed || typeof parsed !== 'object') return '';

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const userConcerns = Array.isArray(parsed.userConcerns) ? parsed.userConcerns.filter((x) => typeof x === 'string') : [];
    const mentorDirections = Array.isArray(parsed.mentorDirections) ? parsed.mentorDirections.filter((x) => typeof x === 'string') : [];
    const openLoops = Array.isArray(parsed.openLoops) ? parsed.openLoops.filter((x) => typeof x === 'string') : [];

    const joined = [
      summary,
      userConcerns.length ? `UserConcerns: ${userConcerns.join(' | ')}` : '',
      mentorDirections.length ? `MentorDirections: ${mentorDirections.join(' | ')}` : '',
      openLoops.length ? `OpenLoops: ${openLoops.join(' | ')}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    return joined.trim();
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

async function compactConversationHistory(history, options = {}) {
  const normalized = normalizeConversationHistory(history);
  const maxItems = Number(options.maxItems || 36);
  const maxChars = Number(options.maxChars || 6000);
  const tokenThreshold = Number(options.tokenThreshold || 100000);

  if (normalized.length === 0) {
    return { entries: [], summary: '', omittedCount: 0, usedLlmCompression: false, estimatedTokens: 0 };
  }

  const fullText = formatConversationHistoryForPrompt(normalized);
  const estimatedTokens = estimateTokens(fullText);
  if (estimatedTokens < tokenThreshold) {
    return compactConversationHistoryDeterministic(normalized, maxItems, maxChars);
  }

  const rounds = buildConversationRounds(normalized);
  if (rounds.length <= 4) {
    const fallbackCompacted = compactConversationHistoryDeterministic(normalized, maxItems, maxChars);
    return { ...fallbackCompacted, estimatedTokens };
  }

  const protectedRoundIndexes = new Set([0, 1, rounds.length - 2, rounds.length - 1]);
  const preservedEntries = [];
  const middleEntries = [];

  rounds.forEach((round, idx) => {
    if (protectedRoundIndexes.has(idx)) preservedEntries.push(...round);
    else middleEntries.push(...round);
  });

  const llmSummary = await summarizeCompactedMiddleWithLLM({
    middleEntries,
    language: options.language,
    model: options.model,
    apiKey: options.apiKey,
    chatCompletionsUrl: options.chatCompletionsUrl,
    compressTimeoutMs: Number(options.compressTimeoutMs || 12000)
  });
  const summary = llmSummary || summarizeCompactedMiddleDeterministic(middleEntries);

  return {
    entries: preservedEntries,
    summary,
    omittedCount: middleEntries.length,
    usedLlmCompression: true,
    estimatedTokens
  };
}

function formatConversationHistoryForPrompt(history) {
  if (!Array.isArray(history) || history.length === 0) return '';
  return history
    .map((item, idx) => {
      const speaker = item.speaker || item.role;
      return `${idx + 1}. [${item.role}] ${speaker}: ${item.text}`;
    })
    .join('\n');
}

function buildUserPrompt(problem, language, mentors, compactedConversation) {
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

  const compacted = compactedConversation || { entries: [], summary: '', omittedCount: 0, usedLlmCompression: false };
  const historyText = formatConversationHistoryForPrompt(compacted.entries || []);

  return [
    `Problem: ${problem}`,
    `Response language: ${normalizeLanguage(language) === 'zh-CN' ? 'Chinese (Simplified)' : 'English'}`,
    `schemaVersion must be: ${RESPONSE_SCHEMA_VERSION}`,
    '',
    'Mentors:',
    mentorBlock,
    '',
    'Conversation context (newest messages may include user and mentor back-and-forth):',
    compacted.usedLlmCompression ? 'Middle rounds were compacted via a separate LLM compression call.' : '',
    compacted.summary || 'No compaction needed.',
    historyText || 'No prior conversation history.',
    '',
    'Use this context as part of reasoning. Respond to the latest user concern while aligning with conversation flow.',
    '',
    'Required output JSON shape (single object, no markdown):',
    '{',
    '  "schemaVersion": "mentor_table.v1",',
    '  "language": "en|zh-CN",',
    '  "safety": { "riskLevel": "none|low|medium|high", "needsProfessionalHelp": false, "emergencyMessage": "" },',
    '  "mentorReplies": [',
    '    {',
    '      "mentorId": "string",',
    '      "mentorName": "string",',
    '      "likelyResponse": "string",',
    '      "whyThisFits": "string",',
    '      "oneActionStep": "string",',
    '      "confidenceNote": "string"',
    '    }',
    '  ],',
    '  "meta": { "disclaimer": "string", "generatedAt": "ISO string" }',
    '}',
    '',
    `Global disclaimer must be: ${FALLBACK_DISCLAIMER}`
  ].join('\n');
}

function tryParseJson(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;

  const normalizedText = String(text).trim();
  const tryParseNested = (value) => {
    let current = value;
    for (let i = 0; i < 3; i += 1) {
      if (typeof current !== 'string') break;
      const trimmed = current.trim();
      if (!trimmed) return null;
      if (!(trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"'))) return null;
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          current = parsed;
          continue;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Handle fenced code blocks: ```json ... ```
  const fenced = normalizedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    const parsedFenced = tryParseNested(fenced[1].trim());
    if (parsedFenced) return parsedFenced;
  }

  const parsedDirect = tryParseNested(normalizedText);
  if (parsedDirect) return parsedDirect;

  {
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
    return tryParseNested(match[0]);
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

  // Shape: { MentorId/mentorId, Response/response/message, GlobalDisclaimer, ... }
  // Some providers return a single mentor reply object in lowercase keys.
  const singleMentorId = raw.MentorId || raw.mentorId || raw.id;
  const singleResponse =
    raw.Response || raw.response || raw.message || raw.advice || raw.content || raw.reply;
  if (typeof singleMentorId === 'string' && typeof singleResponse === 'string') {
    const matchedMentor =
      (mentors || []).find(
        (m) =>
          m.id === singleMentorId ||
          m.displayName === (raw.MentorName || raw.mentorName || raw.name)
      ) || null;
    return {
      safety: {
        riskLevel: 'low',
        needsProfessionalHelp: false,
        emergencyMessage: ''
      },
      mentorReplies: [
        {
          mentorId: singleMentorId,
          mentorName:
            raw.MentorName ||
            raw.mentorName ||
            raw.name ||
            matchedMentor?.displayName ||
            singleMentorId,
          likelyResponse: singleResponse,
          whyThisFits: raw.WhyThisFits || raw.whyThisFits || raw.reason || '',
          oneActionStep:
            raw.OneActionStep ||
            raw.oneActionStep ||
            raw.NextAction ||
            raw.nextAction ||
            raw.next_step ||
            defaultActionStep(language),
          confidenceNote:
            raw.ConfidenceNote ||
            raw.confidenceNote ||
            raw.confidence ||
            defaultConfidenceNote(language)
        }
      ],
      meta: {
        disclaimer: raw.GlobalDisclaimer || raw.globalDisclaimer || raw.disclaimer || FALLBACK_DISCLAIMER
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

  // Shape: { schemaVersion, response: { "<mentorIdOrName>": { message, ... } } }
  // Some providers wrap mentor replies under "response" as an object map.
  if (raw.response && typeof raw.response === 'object' && !Array.isArray(raw.response)) {
    const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
    const mentorReplies = Object.entries(raw.response)
      .map(([key, value]) => {
        if (!value || typeof value !== 'object') return null;

        const item = value;
        const keyNormalized = normalizeKey(key);
        const matchedMentor =
          (mentors || []).find((m) => normalizeKey(m.id) === keyNormalized || normalizeKey(m.displayName) === keyNormalized) ||
          null;

        const mentorId = item.mentorId || item.MentorId || item.id || matchedMentor?.id || key;
        const mentorName =
          item.mentorName || item.MentorName || item.name || matchedMentor?.displayName || key;

        const likelyResponseRaw =
          item.likelyResponse ||
          item.Response ||
          item.response ||
          item.message ||
          item.advice ||
          item.content ||
          item.reply ||
          '';
        const likelyResponse = typeof likelyResponseRaw === 'string' ? likelyResponseRaw.trim() : '';
        if (!likelyResponse) return null;

        const oneActionStepRaw =
          item.oneActionStep ||
          item.OneActionStep ||
          item.nextAction ||
          item.NextAction ||
          item.next_step ||
          item.nextStep ||
          item.nextMove ||
          item.action ||
          defaultActionStep(language);

        const oneActionStep = typeof oneActionStepRaw === 'string' ? oneActionStepRaw : defaultActionStep(language);

        return {
          mentorId,
          mentorName,
          likelyResponse,
          whyThisFits: item.whyThisFits || item.WhyThisFits || item.reason || item.rationale || '',
          oneActionStep,
          confidenceNote:
            item.confidenceNote ||
            item.ConfidenceNote ||
            item.confidence ||
            item.note ||
            defaultConfidenceNote(language)
        };
      })
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

function extractLooseStringField(text, keys) {
  if (!text || typeof text !== 'string') return '';
  for (const key of keys) {
    const strictMatch = text.match(
      new RegExp(
        `"${key}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"(?:[^"]+)"\\s*:|\\s*[}\\]])`,
        'i'
      )
    );
    if (strictMatch && strictMatch[1]) return strictMatch[1].trim();

    const lineMatch = text.match(new RegExp(`"${key}"\\s*:\\s*"([^\\n\\r"]{1,1200})`, 'i'));
    if (lineMatch && lineMatch[1]) return lineMatch[1].trim();

    const bareMatch = text.match(new RegExp(`${key}\\s*[:=]\\s*([^\\n\\r,}{]{1,800})`, 'i'));
    if (bareMatch && bareMatch[1]) return bareMatch[1].trim();
  }
  return '';
}

function normalizeProviderPayloadLoose(text, { mentor, language }) {
  if (!text || typeof text !== 'string') return null;
  const lang = normalizeLanguage(language);
  const mentorId =
    extractLooseStringField(text, ['mentorId', 'MentorId', 'id']) ||
    String(mentor?.id || '');
  const mentorName =
    extractLooseStringField(text, ['mentorName', 'MentorName', 'name']) ||
    String(mentor?.displayName || mentorId || 'Mentor');
  const likelyResponse = extractLooseStringField(text, [
    'likelyResponse',
    'Response',
    'response',
    'Reply',
    'reply',
    'message',
    'advice',
    'content'
  ]);
  if (!likelyResponse) return null;

  const whyThisFits =
    extractLooseStringField(text, ['whyThisFits', 'WhyThisFits', 'reason', 'rationale']) ||
    (lang === 'zh-CN'
      ? `这条建议基于${mentorName}公开风格生成。`
      : `This guidance is generated from ${mentorName}'s public style.`);

  const oneActionStep =
    extractLooseStringField(text, [
      'oneActionStep',
      'OneActionStep',
      'nextAction',
      'NextAction',
      'next_step',
      'nextStep',
      'action'
    ]) || defaultActionStep(lang);

  const confidenceNote =
    extractLooseStringField(text, ['confidenceNote', 'ConfidenceNote', 'confidence', 'note']) ||
    defaultConfidenceNote(lang);

  const disclaimer =
    extractLooseStringField(text, ['globalDisclaimer', 'GlobalDisclaimer', 'disclaimer']) ||
    FALLBACK_DISCLAIMER;

  return {
    safety: {
      riskLevel: 'low',
      needsProfessionalHelp: false,
      emergencyMessage: ''
    },
    mentorReplies: [
      {
        mentorId,
        mentorName,
        likelyResponse,
        whyThisFits,
        oneActionStep,
        confidenceNote
      }
    ],
    meta: {
      disclaimer
    }
  };
}

function buildServerFallbackNormalized({ mentors, language }) {
  const lang = normalizeLanguage(language);
  return {
    safety: {
      riskLevel: 'low',
      needsProfessionalHelp: false,
      emergencyMessage: ''
    },
    mentorReplies: (mentors || []).map((mentor) => ({
      mentorId: mentor.id,
      mentorName: mentor.displayName,
      likelyResponse:
        lang === 'zh-CN'
          ? '我理解你现在不容易。我会先把问题拆成一个最小可执行步骤，先完成第一步，再继续迭代。'
          : 'I understand this is difficult. I would break this into one smallest executable step, complete it first, and iterate.',
      whyThisFits:
        lang === 'zh-CN'
          ? `这条建议基于 ${mentor.displayName} 的公开风格生成。`
          : `This guidance is generated from ${mentor.displayName}'s public style.`,
      oneActionStep: defaultActionStep(lang),
      confidenceNote: defaultConfidenceNote(lang)
    })),
    meta: {
      disclaimer: FALLBACK_DISCLAIMER
    }
  };
}

function pickReplyForMentor(mentor, normalized) {
  if (!normalized || !Array.isArray(normalized.mentorReplies)) return null;
  const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  const mentorIdKey = normalizeKey(mentor.id);
  const mentorNameKey = normalizeKey(mentor.displayName);
  return (
    normalized.mentorReplies.find((item) => normalizeKey(item.mentorId) === mentorIdKey) ||
    normalized.mentorReplies.find((item) => normalizeKey(item.mentorName) === mentorNameKey) ||
    normalized.mentorReplies[0] ||
    null
  );
}

function buildFallbackReplyForMentor(mentor, language) {
  const normalized = buildServerFallbackNormalized({ mentors: [mentor], language });
  return normalized.mentorReplies[0];
}

async function requestMentorReplyFromLLM({
  mentor,
  problem,
  language,
  compactedConversation,
  model,
  apiKey,
  chatCompletionsUrl,
  isDashscope,
  upstreamTimeoutMs
}) {
  const payload = {
    model,
    temperature: 0.55,
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
      { role: 'system', content: buildSystemPrompt([mentor]) },
      { role: 'user', content: buildUserPrompt(problem, language, [mentor], compactedConversation) }
    ]
  };

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), upstreamTimeoutMs);
  let response;
  try {
    console.log(`[mentor-api] upstream request start mentor=${mentor.id} model=${model}`);
    response = await callChatCompletions({
      url: chatCompletionsUrl,
      apiKey,
      payload,
      signal: controller.signal
    });

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

  console.log(
    `[mentor-api] upstream response mentor=${mentor.id} status=${response.status} elapsed=${Date.now() - startedAt}ms`
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mentor API failed for ${mentor.id} with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  let content = extractAssistantContent(data);
  let parsed = tryParseJson(content);

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
            `Target mentor id: ${mentor.id}\n` +
            'Target schema keys: schemaVersion, language, safety, mentorReplies, meta\n' +
            `Raw output to repair:\n${String(content || '').slice(0, 6000)}`
        }
      ]
    };

    const repairController = new AbortController();
    const repairTimeout = setTimeout(() => repairController.abort(), Math.min(12000, upstreamTimeoutMs));
    try {
      const repairResponse = await callChatCompletions({
        url: chatCompletionsUrl,
        apiKey,
        payload: repairPayload,
        signal: repairController.signal
      });

      if (repairResponse.ok) {
        const repairedData = await repairResponse.json();
        content = extractAssistantContent(repairedData);
        parsed = tryParseJson(content);
      }
    } finally {
      clearTimeout(repairTimeout);
    }
  }

  const normalized =
    normalizeProviderPayload(parsed, { mentors: [mentor], language }) ||
    normalizeProviderPayloadLoose(String(content || ''), { mentor, language });
  if (!normalized) {
    const preview = String(content || '').slice(0, 180).replace(/\s+/g, ' ');
    throw new Error(`Model returned invalid JSON for ${mentor.id}. Preview: ${preview}`);
  }

  const reply = pickReplyForMentor(mentor, normalized);
  if (!reply) {
    throw new Error(`Model returned no reply for ${mentor.id}`);
  }

  return {
    reply,
    safety: normalized.safety || { riskLevel: 'low', needsProfessionalHelp: false, emergencyMessage: '' }
  };
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
  const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'qwen-max';
  const baseUrl = process.env.LLM_API_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const upstreamTimeoutMs = Number(process.env.MENTOR_UPSTREAM_TIMEOUT_MS || 25000);
  const chatCompletionsUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const isDashscope = /dashscope\.aliyuncs\.com/i.test(baseUrl);

  if (!apiKey) {
    res.status(500).json({ error: 'LLM_API_KEY (or OPENAI_API_KEY) is not configured on server' });
    return;
  }

  try {
    const { problem, language, mentors, conversationHistory } = req.body || {};

    if (!problem || typeof problem !== 'string') {
      res.status(400).json({ error: 'problem is required' });
      return;
    }

    if (!Array.isArray(mentors) || mentors.length === 0) {
      res.status(400).json({ error: 'at least one mentor is required' });
      return;
    }

    const effectiveLanguage = resolveEffectiveLanguage(language, problem, conversationHistory);
    const historyMaxItems = Number(process.env.MENTOR_HISTORY_MAX_ITEMS || 36);
    const historyMaxChars = Number(process.env.MENTOR_HISTORY_MAX_CHARS || 6000);
    const historyCompressTokenThreshold = Number(process.env.MENTOR_HISTORY_COMPRESS_TOKENS || 100000);
    const historyCompressTimeoutMs = Number(process.env.MENTOR_HISTORY_COMPRESS_TIMEOUT_MS || 12000);
    const compactedConversation = await compactConversationHistory(conversationHistory, {
      maxItems: historyMaxItems,
      maxChars: historyMaxChars,
      tokenThreshold: historyCompressTokenThreshold,
      compressTimeoutMs: historyCompressTimeoutMs,
      language: effectiveLanguage,
      model,
      apiKey,
      chatCompletionsUrl
    });
    if (compactedConversation.usedLlmCompression) {
      console.log(
        `[mentor-api] history compressed via llm estimatedTokens=${compactedConversation.estimatedTokens} preservedEntries=${compactedConversation.entries.length} omittedEntries=${compactedConversation.omittedCount}`
      );
    }

    const perMentor = await Promise.all(
      mentors.map(async (mentor) => {
        try {
          const output = await requestMentorReplyFromLLM({
            mentor,
            problem,
            language: effectiveLanguage,
            compactedConversation,
            model,
            apiKey,
            chatCompletionsUrl,
            isDashscope,
            upstreamTimeoutMs
          });
          return { mentor, ok: true, output };
        } catch (error) {
          return { mentor, ok: false, error };
        }
      })
    );

    const failedMentors = [];
    const normalized = {
      safety: {
        riskLevel: 'low',
        needsProfessionalHelp: false,
        emergencyMessage: ''
      },
      mentorReplies: [],
      meta: { disclaimer: FALLBACK_DISCLAIMER }
    };

    for (const item of perMentor) {
      const mentor = item.mentor;
      if (item.ok && item.output) {
        normalized.safety = mergeSafetyState(normalized.safety, item.output.safety);
        const reply = item.output.reply;
        normalized.mentorReplies.push({
          mentorId: mentor.id,
          mentorName: mentor.displayName,
          likelyResponse: sanitizeFirstPerson(String(reply.likelyResponse || '')),
          whyThisFits:
            String(reply.whyThisFits || '') ||
            (effectiveLanguage === 'zh-CN'
              ? `这条建议基于${mentor.displayName}公开风格生成。`
              : `This guidance is generated from ${mentor.displayName}'s public style.`),
          oneActionStep: sanitizeFirstPerson(String(reply.oneActionStep || defaultActionStep(effectiveLanguage))),
          confidenceNote: String(reply.confidenceNote || defaultConfidenceNote(effectiveLanguage))
        });
      } else {
        failedMentors.push(mentor.id);
        console.warn(
          `[mentor-api] per-mentor generation failed mentor=${mentor.id}: ${
            item.error instanceof Error ? item.error.message : String(item.error)
          }`
        );
        const fallbackReply = buildFallbackReplyForMentor(mentor, effectiveLanguage);
        normalized.mentorReplies.push({
          mentorId: mentor.id,
          mentorName: mentor.displayName,
          likelyResponse: sanitizeFirstPerson(String(fallbackReply.likelyResponse || '')),
          whyThisFits: String(fallbackReply.whyThisFits || ''),
          oneActionStep: sanitizeFirstPerson(String(fallbackReply.oneActionStep || defaultActionStep(effectiveLanguage))),
          confidenceNote: String(fallbackReply.confidenceNote || defaultConfidenceNote(effectiveLanguage))
        });
      }
    }

    const finalized = finalizeContractShape(normalized, {
      language: effectiveLanguage,
      baseUrl,
      model
    });

    if (failedMentors.length === mentors.length) {
      finalized.meta.provider = 'server-fallback';
    } else if (failedMentors.length > 0) {
      finalized.meta.provider = 'partial-fallback';
    }

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
