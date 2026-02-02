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
  safety: {
    riskLevel: MentorRiskLevel;
    needsProfessionalHelp: boolean;
    emergencyMessage: string;
  };
  mentorReplies: MentorReply[];
  meta: {
    disclaimer: string;
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
  if (language === 'zh-CN') {
    return `如果我是${mentor.displayName}视角，我会先把问题拆成可执行步骤：先明确你最卡的点，再用稳定节奏推进，而不是一次解决全部。你提到的“${problem.slice(0, 42)}${problem.length > 42 ? '...' : ''}”，我会先从一个最小动作开始。`;
  }

  return `If I were approaching this in a ${mentor.displayName}-like way, I would break it into executable steps first: define the main bottleneck, then move with steady momentum instead of solving everything at once. For “${problem.slice(0, 80)}${problem.length > 80 ? '...' : ''}”, I would start with one focused move.`;
}

function buildWhyThisFits(mentor: MentorProfile, language: 'zh-CN' | 'en'): string {
  if (language === 'zh-CN') {
    return `这类建议贴合其公开形象：说话方式偏${mentor.speakingStyle[0]}，核心价值常围绕${mentor.coreValues.slice(0, 2).join('、')}，遇到压力时更倾向于${mentor.decisionPatterns[0]}。`;
  }

  return `This fits their public persona: a ${mentor.speakingStyle[0]} tone, values around ${mentor.coreValues.slice(0, 2).join(' and ')}, and a tendency to ${mentor.decisionPatterns[0]}.`;
}

function buildOneActionStep(mentor: MentorProfile, language: 'zh-CN' | 'en'): string {
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
          : 'Mentor Table provides AI-simulated inspiration only and is not medical, legal, or financial advice.'
    }
  };
}
