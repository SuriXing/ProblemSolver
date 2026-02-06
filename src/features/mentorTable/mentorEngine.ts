import { MentorProfile } from './mentorProfiles';

export type MentorRiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface MentorReply {
  mentorId: string;
  mentorName: string;
  likelyResponse: string;
  whyThisFits: string;
  oneActionStep: string;
  confidenceNote: string;
}

export interface MentorSimulationResult {
  schemaVersion: 'mentor_table.v1';
  language: 'zh-CN' | 'en';
  safety: {
    riskLevel: MentorRiskLevel;
    needsProfessionalHelp: boolean;
    emergencyMessage: string;
  };
  mentorReplies: MentorReply[];
  meta: {
    disclaimer: string;
    generatedAt: string;
    provider?: string;
    model?: string;
    source?: 'llm' | 'fallback';
    debugMessage?: string;
  };
}

const ZH_EMERGENCY_MESSAGE =
  '如果你现在有伤害自己或他人的想法，请立刻联系当地紧急服务或危机热线，并尽快寻求可信赖的大人/朋友/专业人士帮助。';

const EN_EMERGENCY_MESSAGE =
  'If you may harm yourself or others, contact local emergency services or a crisis hotline right now and seek trusted in-person help.';

function detectRiskLevel(problem: string): MentorRiskLevel {
  const normalized = problem.toLowerCase();
  const highRiskTerms = [
    'suicide',
    'kill myself',
    'self harm',
    'hurt myself',
    'want to die',
    '伤害自己',
    '自杀',
    '不想活',
    '伤害他人'
  ];
  const mediumRiskTerms = ['panic', 'hopeless', '绝望', '崩溃', '失眠'];

  if (highRiskTerms.some((term) => normalized.includes(term))) return 'high';
  if (mediumRiskTerms.some((term) => normalized.includes(term))) return 'medium';
  return problem.trim() ? 'low' : 'none';
}

function buildLikelyResponse(problem: string, mentor: MentorProfile, language: 'zh-CN' | 'en'): string {
  const excerpt = problem.slice(0, language === 'zh-CN' ? 42 : 80) + (problem.length > (language === 'zh-CN' ? 42 : 80) ? '...' : '');

  if (mentor.id === 'bill_gates') {
    if (language === 'zh-CN') {
      return `我能理解你现在的压力。刚开始做产品时，最难的是在不确定里做决定。面对“${excerpt}”，我会先抓一个最关键瓶颈，先把它解决，再看下一步。`;
    }
    return `I understand this pressure. Early on, the hardest part was deciding in uncertainty. With “${excerpt}”, I would isolate the single biggest bottleneck, solve that first, and then reassess.`;
  }

  if (mentor.id === 'oprah_winfrey') {
    if (language === 'zh-CN') {
      return `我听见你背后的情绪了，这真的不轻松。面对“${excerpt}”，我会先诚实地承认自己的感受，再给自己一个不被打扰的边界，慢慢把力量找回来。`;
    }
    return `I hear the emotional weight in what you shared, and it is not easy. With “${excerpt}”, I would first name what I truly feel, then protect my energy with one clear boundary so I can recover strength.`;
  }

  if (mentor.id === 'kobe_bryant') {
    if (language === 'zh-CN') {
      return `我知道这种卡住感。真正改变通常不是一口气爆发，而是重复正确动作。针对“${excerpt}”，我会今天就开始一个固定训练节奏，不等状态好了再行动。`;
    }
    return `I know what that stuck feeling is like. Real change is usually not one burst of motivation, but repeating the right actions. For “${excerpt}”, I would start a fixed routine today and move before I feel ready.`;
  }

  if (mentor.id === 'miyazaki_hayao') {
    if (language === 'zh-CN') {
      return `我理解你现在的混乱感。很多答案不是靠逼自己想出来，而是在认真做事时慢慢浮现。面对“${excerpt}”，我会先做一件小而完整的事，让心重新安静下来。`;
    }
    return `I understand this sense of inner noise. Many answers appear while doing careful work, not while forcing clarity. With “${excerpt}”, I would finish one small complete task to recover calm and direction.`;
  }

  if (mentor.id === 'elon_musk') {
    if (language === 'zh-CN') {
      return `我明白你在承受什么。遇到复杂问题时，我会回到第一性原理：哪些是假设，哪些是事实。对“${excerpt}”，我会先拆掉一个错误假设，再重建行动路径。`;
    }
    return `I get what you are carrying. In hard situations, I go back to first principles: what is fact and what is assumption. For “${excerpt}”, I would remove one bad assumption and rebuild the plan from there.`;
  }

  if (language === 'zh-CN') {
    return `我先把问题拆成可执行步骤：先明确你最卡的点，再用稳定节奏推进，而不是一次解决全部。你提到的“${excerpt}”，我会先从一个最小动作开始。`;
  }

  return `I would break this into executable steps first: define the main bottleneck, then move with steady momentum instead of solving everything at once. For “${excerpt}”, I would start with one focused move.`;
}

function buildWhyThisFits(mentor: MentorProfile, language: 'zh-CN' | 'en'): string {
  if (language === 'zh-CN') {
    return `这类建议贴合其公开形象：说话方式偏${mentor.speakingStyle[0]}，核心价值常围绕${mentor.coreValues.slice(0, 2).join('、')}，遇到压力时更倾向于${mentor.decisionPatterns[0]}。`;
  }

  return `This fits their public persona: a ${mentor.speakingStyle[0]} tone, values around ${mentor.coreValues.slice(0, 2).join(' and ')}, and a tendency to ${mentor.decisionPatterns[0]}.`;
}

function buildOneActionStep(mentor: MentorProfile, language: 'zh-CN' | 'en'): string {
  if (mentor.id === 'bill_gates') {
    return language === 'zh-CN'
      ? '下一步：列出3个问题，只选“影响最大”的1个，给它安排今天30分钟深度处理。'
      : 'Next step: list 3 issues, pick the highest-impact one, and give it 30 focused minutes today.';
  }
  if (mentor.id === 'oprah_winfrey') {
    return language === 'zh-CN'
      ? '下一步：写下你此刻最真实的情绪，并设定一个今天就执行的边界（比如拒绝1件消耗你的事）。'
      : 'Next step: write down your real feeling and set one boundary you will enforce today.';
  }
  if (mentor.id === 'kobe_bryant') {
    return language === 'zh-CN'
      ? '下一步：设一个7天固定节奏，每天同一时间做20分钟最关键动作，不间断。'
      : 'Next step: set a 7-day routine and do 20 minutes of the key action at the same time daily.';
  }
  if (mentor.id === 'miyazaki_hayao') {
    return language === 'zh-CN'
      ? '下一步：今天完成一件“小而完整”的任务，结束时写一句你学到的东西。'
      : 'Next step: complete one small, finished task today and write one line about what it taught you.';
  }
  if (mentor.id === 'elon_musk') {
    return language === 'zh-CN'
      ? '下一步：把当前困境拆成“事实/假设”两列，删除1个错误假设后重排你的计划。'
      : 'Next step: split the problem into facts vs assumptions, remove one weak assumption, then rebuild your plan.';
  }
  const pattern = mentor.decisionPatterns[1] || mentor.decisionPatterns[0] || 'take one focused step';
  if (language === 'zh-CN') {
    return `下一步（今天可做）：写下1个你能在20分钟内完成的小任务，并按“${pattern}”执行，完成后再决定下一个动作。`;
  }

  return `Next step (today): define one 20-minute task and execute it using this principle: “${pattern}.” Then reassess.`;
}

export function simulateMentorTable(
  problem: string,
  mentors: MentorProfile[],
  language: 'zh-CN' | 'en'
): MentorSimulationResult {
  const riskLevel = detectRiskLevel(problem);
  const isHighRisk = riskLevel === 'high';

  return {
    schemaVersion: 'mentor_table.v1',
    language,
    safety: {
      riskLevel,
      needsProfessionalHelp: riskLevel === 'high' || riskLevel === 'medium',
      emergencyMessage: isHighRisk ? (language === 'zh-CN' ? ZH_EMERGENCY_MESSAGE : EN_EMERGENCY_MESSAGE) : ''
    },
    mentorReplies: mentors.map((mentor) => ({
      mentorId: mentor.id,
      mentorName: mentor.displayName,
      likelyResponse: buildLikelyResponse(problem, mentor, language),
      whyThisFits: buildWhyThisFits(mentor, language),
      oneActionStep: buildOneActionStep(mentor, language),
      confidenceNote:
        language === 'zh-CN'
          ? '这是基于公开信息生成的AI模拟视角，不代表本人真实发言。'
          : 'This is an AI-simulated perspective based on public information, not an actual statement by the person.'
    })),
    meta: {
      disclaimer:
        language === 'zh-CN'
          ? '名人桌为AI模拟建议，仅用于启发，不构成医疗/法律/财务等专业意见。'
          : 'Mentor Table provides AI-simulated inspiration only and is not medical, legal, or financial advice.',
      generatedAt: new Date().toISOString(),
      provider: 'local-simulator',
      model: 'rule-based',
      source: 'fallback'
    }
  };
}
