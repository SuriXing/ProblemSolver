import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faLightbulb,
  faCircleInfo,
  faUsers,
  faTriangleExclamation,
  faPlus,
  faXmark,
  faMagnifyingGlass,
  faShuffle,
  faRotate,
  faWandMagicSparkles,
  faChevronLeft,
  faChevronRight,
  faDice,
  faBell,
  faBookOpen,
  faBug
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
import { MentorProfile, createCustomMentorProfile, getCartoonAvatarUrl, getSuggestedPeople } from '../../features/mentorTable/mentorProfiles';
import { MentorSimulationResult } from '../../features/mentorTable/mentorEngine';
import { fetchMentorDebugPrompt, generateMentorAdvice, MentorConversationMessage } from '../../features/mentorTable/mentorApi';
import {
  PersonOption,
  fetchPersonImage,
  fetchPersonImageCandidates,
  findVerifiedPerson,
  getChineseDisplayName,
  getVerifiedPlaceholderImage,
  searchPeopleWithPhotos,
  searchVerifiedPeopleLocal
} from '../../features/mentorTable/personLookup';
import styles from './MentorTablePage.module.css';

type SceneStyle = 'cute' | 'nature' | 'spooky' | 'cyber' | 'library';
type RitualPhase = 'invite' | 'scene' | 'wish' | 'session';
type SessionMode = 'idle' | 'booting' | 'live';

interface MemoryCard {
  id: string;
  title: string;
  style: SceneStyle;
  createdAt: string;
  takeaways: string[];
}

interface ConversationTurn {
  id: string;
  user: string;
  replies: Array<{ mentorName: string; text: string }>;
}

interface ExpandedSuggestionCard {
  mentorName: string;
  likelyResponse: string;
  oneActionStep: string;
}

interface SuggestionDeckEntry {
  key: string;
  mentorIndex: number;
  displayName: string;
  likelyResponse: string;
  oneActionStep: string;
  status?: 'ready' | 'typing';
  replyId?: string;
}

const MAX_PEOPLE = 10;
const COORDINATE_PASS_NOTE_WITH_ALL = (import.meta.env.VITE_MENTOR_NOTE_COORDINATE_ALL ?? '1') !== '0';
const ONBOARDING_KEY = 'mentorTableOnboardingHiddenV2';
const DEFAULT_PLACEHOLDER_AVATAR = getVerifiedPlaceholderImage();

const onboardingSlides = [
  {
    title: '名人桌功能说明',
    body: '你可以选择咨询对象并输入问题，然后查看每位对象给出的建议。'
  },
  {
    title: '支持对象类型',
    body: '支持：名人、MBTI（如 INTJ）、动漫角色、游戏角色、电影角色（如钢铁侠）。'
  },
  {
    title: '如何使用',
    body: '步骤：选择对象 → 选择场景 → 输入问题 → 开始查看回复。'
  },
  {
    title: '回复与记录',
    body: '你可以给单个人留言，也可以回复所有人。会话总结可以保存到右下角记忆抽屉。'
  },
  {
    title: '说明显示设置',
    body: '最后一步你可以选择“下次继续显示”或“下次不再显示”本说明。'
  }
];

const vibeTags = ['Builder', 'Storyteller', 'Competitor', 'Strategist', 'Dreamer', 'Rebel'];
const vibeTagsZh = ['构建者', '讲述者', '行动派', '战略派', '梦想家', '突破者'];


function getMentorCategory(name: string): 'tech' | 'sports' | 'artist' | 'leader' {
  const normalized = name.toLowerCase();
  if (normalized.includes('kobe')) return 'sports';
  if (normalized.includes('miyazaki') || normalized.includes('taylor') || normalized.includes('swift')) return 'artist';
  if (normalized.includes('bill') || normalized.includes('elon') || normalized.includes('jobs') || normalized.includes('lisa su') || normalized.includes('satya') || normalized.includes('nadella')) return 'tech';
  return 'leader';
}

function styleClassForCard(style: SceneStyle): string {
  if (style === 'cute') return styles.messageCardCute;
  if (style === 'nature') return styles.messageCardNature;
  if (style === 'spooky') return styles.messageCardSpooky;
  if (style === 'cyber') return styles.messageCardCyber;
  return styles.messageCardLibrary;
}

const MentorTablePage: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isZh = i18n.language?.toLowerCase().startsWith('zh');
  const [phase, setPhase] = useState<RitualPhase>('invite');
  const [sessionMode, setSessionMode] = useState<SessionMode>('idle');
  const [problem, setProblem] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<PersonOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PersonOption[]>([]);
  const [result, setResult] = useState<MentorSimulationResult | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_KEY) !== '1';
  });
  const [dontShowOnboardingAgain, setDontShowOnboardingAgain] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scene, setScene] = useState<SceneStyle>('cute');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [lastSummonedName, setLastSummonedName] = useState<string>('');
  const [candleLevel, setCandleLevel] = useState(1);
  const [tableRipple, setTableRipple] = useState<{ x: number; y: number; key: string } | null>(null);
  const [openNoteFor, setOpenNoteFor] = useState<string>('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [noteReplies, setNoteReplies] = useState<Record<string, Array<{ role: 'user' | 'mentor'; text: string }>>>({});
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [memories, setMemories] = useState<MemoryCard[]>([]);
  const [visibleReplyCount, setVisibleReplyCount] = useState(0);
  const [isConversationHovered, setIsConversationHovered] = useState(false);
  const [showSessionWrap, setShowSessionWrap] = useState(false);
  const [showGroupSolve, setShowGroupSolve] = useState(false);
  const [replyAllDraft, setReplyAllDraft] = useState('');
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const [imageAttemptByKey, setImageAttemptByKey] = useState<Record<string, number>>({});
  const [imageRetryByKey, setImageRetryByKey] = useState<Record<string, number>>({});
  const [expandedReplyId, setExpandedReplyId] = useState('');
  const [expandedSuggestion, setExpandedSuggestion] = useState<ExpandedSuggestionCard | null>(null);
  const [isRoundGenerating, setIsRoundGenerating] = useState(false);
  const [hoveredDebugMentorId, setHoveredDebugMentorId] = useState('');
  const [openDebugMentorId, setOpenDebugMentorId] = useState('');
  const [debugPromptByMentorId, setDebugPromptByMentorId] = useState<Record<string, string>>({});
  const [debugPromptLoadingByMentorId, setDebugPromptLoadingByMentorId] = useState<Record<string, boolean>>({});
  const [debugPromptErrorByMentorId, setDebugPromptErrorByMentorId] = useState<Record<string, string>>({});
  const [saveNotice, setSaveNotice] = useState('');
  const conversationPanelRef = useRef<HTMLDivElement | null>(null);

  const sceneOptions: Array<{
    id: SceneStyle;
    label: string;
    desc: string;
    vibeLine: string;
    cta: string;
  }> = useMemo(
    () =>
      isZh
        ? [
            { id: 'cute', label: '可爱美学', desc: '粉彩闪光 + 贴纸便签', vibeLine: '柔和、温暖、闪闪发光。', cta: '发送便签 ✨' },
            { id: 'nature', label: '自然', desc: '户外草地 + 手帐纸感', vibeLine: '清新、扎实、自然开阔。', cta: '释放想法 🍃' },
            { id: 'spooky', label: '诡秘', desc: '烛光薄雾 + 旧纸信笺', vibeLine: '安静、微诡、烛光氛围。', cta: '向圆桌低语 🕯️' },
            { id: 'cyber', label: '赛博夜色', desc: '霓虹雨幕 + 全息面板', vibeLine: '霓虹、未来、科技感。', cta: '发送信号 ▣' },
            { id: 'library', label: '书房', desc: '暖灯书桌 + 笔记本', vibeLine: '暖光、专注、沉静思考。', cta: '翻开章节 📚' }
          ]
        : [
            { id: 'cute', label: 'Cute & Aesthetic', desc: 'pastel sparkles + sticker notes', vibeLine: 'Soft, cozy, sparkly.', cta: 'Send the Note ✨' },
            { id: 'nature', label: 'Nature', desc: 'open air + field notes', vibeLine: 'Fresh, grounded, open-air.', cta: 'Release the Thought 🍃' },
            { id: 'spooky', label: 'Spooky & Creepy', desc: 'candle fog + parchment', vibeLine: 'Quiet, eerie, candlelit.', cta: 'Whisper to the Table 🕯️' },
            { id: 'cyber', label: 'Cyber Noir', desc: 'neon rain + holo panel', vibeLine: 'Neon rain, futuristic.', cta: 'Transmit Signal ▣' },
            { id: 'library', label: 'Library / Study', desc: 'warm lamp + notebook', vibeLine: 'Warm study lamp, calm focus.', cta: 'Open the Chapter 📚' }
          ],
    [isZh]
  );

  const selectedMentors = useMemo(
    () => selectedPeople.map((person) => createCustomMentorProfile(person.name)),
    [selectedPeople]
  );

  const ritualStep = phase === 'invite' ? 0 : phase === 'scene' ? 1 : phase === 'wish' ? 2 : 3;
  const sceneIndex = sceneOptions.findIndex((s) => s.id === scene);
  const currentScene = sceneOptions[sceneIndex] || sceneOptions[0];
  const localizedVibeTags = isZh ? vibeTagsZh : vibeTags;

  const t = {
    heroTitle: isZh ? '名人桌 · 召唤房间' : 'Celebrity Mentor Table · Summoning Room',
    heroSub: isZh ? '这不是普通页面，而是一个互动舞台。' : 'Not a page. A stage.',
    summonGuests: isZh ? '召唤人物' : 'Summon Guests',
    portalPicker: isZh ? '传送门风格' : 'Portal Picker',
    placeArtifact: isZh ? '放下你的问题卡' : 'Place Your Artifact',
    openCircle: isZh ? '开启圆桌' : 'Open Circle',
    edit: isZh ? '编辑' : 'Edit',
    shuffle: isZh ? '换座位' : 'Shuffle',
    restart: isZh ? '重新开始' : 'Restart',
    summoningRitual: isZh ? '召唤仪式' : 'Summoning Ritual',
    invitePlaceholder: isZh ? '输入对象（名人/MBTI/角色）' : 'Enter target (celebrity/MBTI/character)',
    flip: isZh ? '翻面' : 'flip',
    keepGoing: isZh ? '继续加油' : 'keep going',
    continueToPortal: isZh ? '继续到传送门' : 'Continue to Portal',
    randomVibe: isZh ? '随机风格' : 'Random vibe',
    lockWorld: isZh ? '锁定这个世界' : 'Lock this World',
    artifactPlaceholder: isZh ? '写下你现在最困扰的问题，圆桌会听见。' : 'Write what’s weighing on you. The table will listen.',
    openingPortal: isZh ? '正在开启传送门...' : 'Opening portal...',
    sessionInProgress: isZh ? '会话进行中。' : 'Session in progress.',
    source: isZh ? '来源' : 'Source',
    llmApi: isZh ? 'LLM 接口' : 'LLM API',
    localFallback: isZh ? '本地回退' : 'Local Fallback',
    aiDisclaimer: isZh
      ? '这是基于公开信息的AI模拟视角，不代表真实人物的观点。'
      : 'This is an AI-simulated perspective inspired by public information, not a real statement from the person.',
    youFrontRow: isZh ? '你 · 第一视角' : 'You · Front row',
    concernHint: isZh ? '把你的问题放在桌面上。' : 'Place your concern artifact on the table.',
    tableListening: isZh ? '圆桌正在聆听。' : 'The table is listening.',
    clothPattern: isZh ? '桌布纹理浮现' : 'cloth pattern appears',
    ambientOn: isZh ? '环境粒子启动' : 'ambient particles activate',
    cardsGlow: isZh ? '人物卡开始发光' : 'guest cards glow',
    hoverPause: isZh ? '鼠标停留会暂停滚动，方便阅读。' : 'Hover to pause and read carefully.',
    you: isZh ? '你' : 'You',
    passNoteTo: isZh ? '给' : 'Pass a note to',
    replyTo: isZh ? '回复给' : 'Reply to',
    send: isZh ? '发送' : 'Send',
    typing: isZh ? '正在输入...' : 'typing...',
    typingNow: isZh ? '正在输入中' : 'Typing now',
    mentorTyping: isZh ? '输入中' : 'Typing',
    hideGroup: isZh ? '隐藏共同讨论' : 'Hide group solve',
    showGroup: isZh ? '共同讨论方案' : 'Group solve together',
    jointStrategy: isZh ? '全员讨论 · 联合方案' : 'All mentors · Joint strategy',
    replyToAllHeader: isZh ? '你 · 回复所有导师' : 'You · Reply to all mentors',
    replyAllPlaceholder: isZh ? '回复给所有人...' : 'Reply to all...',
    sendToAll: isZh ? '发送给所有人' : 'Send to all',
    showWrap: isZh ? '显示总结' : 'Show session wrap',
    sessionComplete: isZh ? '会话完成。' : 'Session complete.',
    tonightTakeaway: isZh ? '今晚总结' : 'Tonight’s takeaway',
    save: isZh ? '保存聊天' : 'Save Chat',
    newTable: isZh ? '开启新圆桌' : 'Start a new table',
    memories: isZh ? '记忆抽屉' : 'Memories',
    memoryDrawer: isZh ? '记忆抽屉' : 'Memory Drawer',
    savedInDrawer: isZh ? '已保存到右下角“记忆抽屉”。' : 'Saved to the Memories drawer in the bottom-right.',
    savedSuccess: isZh ? '聊天记录已成功保存。' : 'Conversation saved successfully.',
    noMemories: isZh ? '还没有保存内容。' : 'No saved memories yet.',
    chatWindow: isZh ? '聊天窗口' : 'Conversation',
    backToTable: isZh ? '返回上一页' : 'Back to previous view',
    clickToExpand: isZh ? '点开看完整建议' : 'Open full advice',
    debugPrompt: isZh ? 'Prompt 调试' : 'Prompt Debug',
    closeDebug: isZh ? '关闭' : 'Close',
    inspectPrompt: isZh ? '查看 Prompt' : 'Inspect Prompt',
    loading: isZh ? '加载中...' : 'Loading...',
    debugLoadFailed: isZh ? '加载失败' : 'Failed to load',
    back: isZh ? '上一步' : 'Back',
    next: isZh ? '下一步' : 'Next',
    getStarted: isZh ? '开始' : 'Get Started',
    dontShowAgain: isZh ? '下次不再显示' : "Don't show this again",
    keepShowing: isZh ? '下次继续显示' : 'Keep showing on startup'
  };

  const uiLanguage: 'zh-CN' | 'en' = isZh ? 'zh-CN' : 'en';

  const normalizeNameKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

  // Resolve a raw name to its canonical display form, e.g. "lisa su" → "Lisa Su"
  const resolveDisplayName = (name: string): string => {
    try {
      const verified = findVerifiedPerson(name);
      if (verified) return verified.canonical;
    } catch { /* findVerifiedPerson may not be available */ }
    return name;
  };

  const localizeName = (name: string) => {
    const canonical = resolveDisplayName(name);
    if (!isZh) return canonical;
    return getChineseDisplayName(canonical);
  };

  const createInitialAvatar = (name: string) => {
    const canonical = resolveDisplayName(name);
    const text = canonical
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || '')
      .join('') || '?';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eff5ff"/><stop offset="100%" stop-color="#d6e5ff"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="48" r="44" fill="#ffffff" opacity="0.72"/><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#2b4f90">${text}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const isLikelyFallbackAvatar = (src?: string) => {
    if (!src) return false;
    return src.startsWith('data:image/svg+xml') || src.includes('ui-avatars.com/api');
  };

  const buildImageChain = (name: string, imageUrl?: string, candidateImageUrls?: string[]) => {
    const key = normalizeNameKey(name);
    const person = selectedPeople.find((p) => normalizeNameKey(p.name) === key);

    // Resolve the display name to canonical (e.g. "lisa" → "Lisa Su")
    let resolvedName = name;
    try {
      const verified = findVerifiedPerson(name);
      if (verified) resolvedName = verified.canonical;
    } catch { /* findVerifiedPerson may not be available */ }

    // Server-side proxy: fetches from Wikipedia, caches on disk, serves locally.
    // Works for ANY person/character — no CORS, no rate-limits for the client.
    const proxyUrl = `/api/mentor-image?name=${encodeURIComponent(resolvedName)}`;
    const localFallback = import.meta.env.DEV
      ? `http://127.0.0.1:8787/api/mentor-image?name=${encodeURIComponent(resolvedName)}`
      : undefined;

    // External URLs as fallback if server proxy is down
    let verifiedImages: string[] = [];
    try {
      const verified = findVerifiedPerson(name);
      if (verified) {
        verifiedImages = [verified.imageUrl, ...(verified.candidateImageUrls || [])].filter(Boolean);
      }
    } catch { /* findVerifiedPerson may not be available */ }

    const external = Array.from(
      new Set([imageUrl, person?.imageUrl, ...verifiedImages, ...(candidateImageUrls || []), ...(person?.candidateImageUrls || [])].filter(Boolean))
    ) as string[];

    // Chain: proxy (cached/fetched) → external URLs → cartoon → initials
    return [proxyUrl, localFallback, ...external, getCartoonAvatarUrl(name), createInitialAvatar(name)].filter(Boolean) as string[];
  };

  const imageSrcFor = (name: string, imageUrl?: string, candidateImageUrls?: string[]) => {
    const key = normalizeNameKey(name);
    const chain = buildImageChain(name, imageUrl, candidateImageUrls);
    const idx = Math.min(imageAttemptByKey[key] || 0, chain.length - 1);
    const src = chain[idx];
    // Append cache-buster on retry so the browser re-fetches instead of reusing cached 429
    const retry = imageRetryByKey[key] || 0;
    if (retry > 0 && src && !src.startsWith('data:')) {
      return `${src}${src.includes('?') ? '&' : '?'}_r=${retry}`;
    }
    return src;
  };

  const markImageBroken = (name: string, imageUrl?: string, candidateImageUrls?: string[]) => {
    const key = normalizeNameKey(name);
    const chain = buildImageChain(name, imageUrl, candidateImageUrls);
    const currentAttempt = imageAttemptByKey[key] || 0;
    const currentSrc = chain[Math.min(currentAttempt, chain.length - 1)];
    const retries = imageRetryByKey[key] || 0;

    // Wikimedia returns 429 under concurrent load — retry once after a delay
    const isWikimedia = currentSrc?.includes('wikimedia.org') || currentSrc?.includes('wikipedia.org');
    if (isWikimedia && retries < 1) {
      setTimeout(() => {
        setImageRetryByKey((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      }, 600 + currentAttempt * 400);
      return;
    }

    // Advance to next URL in chain
    setImageRetryByKey((prev) => ({ ...prev, [key]: 0 }));
    setImageAttemptByKey((prev) => {
      const current = prev[key] || 0;
      if (current >= chain.length - 1) return prev;
      return { ...prev, [key]: current + 1 };
    });
  };

  const localizedSceneText = (style: SceneStyle) => sceneOptions.find((s) => s.id === style) || currentScene;

  const localizedSceneName = (style: SceneStyle) => localizedSceneText(style).label;

  const generateMentorFollowup = (_mentorName: string, userText: string) => {
    const excerpt = userText.slice(0, 56).trim();
    if (uiLanguage === 'zh-CN') {
      return `收到你的补充（“${excerpt}${userText.length > 56 ? '...' : ''}”）。我会先给你一个最小可执行动作，你做完后我们再迭代下一步。`;
    }
    return `I got your follow-up (“${excerpt}${userText.length > 56 ? '...' : ''}”). I would start with one smallest executable step, then iterate with you from there.`;
  };

  const mentorThreadKey = (rawName: string) => normalizeMentorKey(resolveMentorName(rawName));

  const buildConversationHistory = (latestUserText?: string): MentorConversationMessage[] => {
    const history: MentorConversationMessage[] = [];
    const baseProblem = problem.trim();
    if (baseProblem) {
      history.push({
        role: 'user',
        speaker: t.you,
        text: baseProblem
      });
    }

    for (const reply of visibleReplies) {
      const mentorName = localizeName(resolveMentorName(reply.mentorName));
      history.push({
        role: 'mentor',
        speaker: mentorName,
        text: `${reply.likelyResponse} ${reply.oneActionStep}`.trim()
      });
    }

    for (const turn of conversationTurns) {
      if (turn.user?.trim()) {
        history.push({
          role: 'user',
          speaker: t.you,
          text: turn.user.trim()
        });
      }
      for (const reply of turn.replies || []) {
        if (!reply?.text?.trim()) continue;
        history.push({
          role: 'mentor',
          speaker: localizeName(reply.mentorName || 'Mentor'),
          text: reply.text.trim()
        });
      }
    }

    if (latestUserText?.trim()) {
      history.push({
        role: 'user',
        speaker: t.you,
        text: latestUserText.trim()
      });
    }

    return history;
  };

  const submitNoteToMentor = async (rawName: string) => {
    const threadKey = mentorThreadKey(rawName);
    const mentorName = localizeName(resolveMentorName(rawName));
    const targetKey = normalizeMentorKey(rawName);
    const text = (noteDrafts[threadKey] || '').trim();
    if (!text) return;
    if (isRoundGenerating) return;

    setIsRoundGenerating(true);
    let mentorReply = generateMentorFollowup(mentorName, text);
    const targetMentor = selectedMentors.find((mentor) => {
      return normalizeMentorKey(mentor.displayName) === targetKey || normalizeMentorKey(mentor.id) === targetKey;
    });
    const coordinatedMentorSet =
      COORDINATE_PASS_NOTE_WITH_ALL && selectedMentors.length > 1
        ? selectedMentors
        : targetMentor
          ? [targetMentor]
          : selectedMentors.slice(0, 1);

    try {
      const aiResult = await generateMentorAdvice({
        problem: text,
        language: uiLanguage,
        mentors: coordinatedMentorSet,
        conversationHistory: buildConversationHistory(text)
      });

      const targetMentorIdKey = targetMentor ? normalizeMentorKey(targetMentor.id) : '';
      const targetMentorNameKey = targetMentor ? normalizeMentorKey(targetMentor.displayName) : targetKey;
      const aiReply =
        aiResult.mentorReplies.find((reply) => targetMentorIdKey && normalizeMentorKey(reply.mentorId) === targetMentorIdKey) ||
        aiResult.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorName) === targetMentorNameKey) ||
        aiResult.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorName) === targetKey) ||
        aiResult.mentorReplies[0];
      if (aiReply?.likelyResponse) {
        mentorReply = aiReply.likelyResponse;
      }
    } finally {
      setIsRoundGenerating(false);
    }

    setNoteReplies((prev) => ({
      ...prev,
      [threadKey]: [
        ...(prev[threadKey] || []),
        { role: 'user', text },
        { role: 'mentor', text: mentorReply }
      ]
    }));
    setConversationTurns((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${threadKey}-${prev.length}`,
        user: text,
        replies: [{ mentorName, text: mentorReply }]
      }
    ]);
    setNoteDrafts((prev) => ({ ...prev, [threadKey]: '' }));
    setOpenNoteFor(threadKey);
    scrollConversationToBottom();
  };

  const handleReplyAll = async () => {
    const text = replyAllDraft.trim();
    if (!text || isRoundGenerating || selectedMentors.length === 0) return;

    setIsRoundGenerating(true);
    try {
      const aiResult = await generateMentorAdvice({
        problem: text,
        language: uiLanguage,
        mentors: selectedMentors,
        conversationHistory: buildConversationHistory(text)
      });

      const replies = selectedMentors.map((mentor) => {
        const matched =
          aiResult.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorId) === normalizeMentorKey(mentor.id)) ||
          aiResult.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorName) === normalizeMentorKey(mentor.displayName));
        return {
          mentorName: mentor.displayName,
          text: matched?.likelyResponse || generateMentorFollowup(mentor.displayName, text)
        };
      });

      setConversationTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          user: text,
          replies
        }
      ]);
      setReplyAllDraft('');
      scrollConversationToBottom();
    } finally {
      setIsRoundGenerating(false);
    }
  };

  const scrollConversationToBottom = () => {
    if (!conversationPanelRef.current) return;
    const node = conversationPanelRef.current;
    window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  };

  useEffect(() => {
    const query = personQuery.trim();
    if (!query) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // ── Instant local results (sync, 0ms) ──
    // Try VERIFIED_PEOPLE search first, then fall back to MENTOR_PROFILES only
    let verifiedHits: PersonOption[] = [];
    try {
      verifiedHits = searchVerifiedPeopleLocal(query);
    } catch {
      // searchVerifiedPeopleLocal may not be available (module HMR / cache)
    }

    let profileHits: PersonOption[] = [];
    try {
      profileHits = getSuggestedPeople(query).map((p) => {
        let img: string | undefined;
        let candidates: string[] | undefined;
        try {
          const v = findVerifiedPerson(p.displayName);
          img = v?.imageUrl;
          candidates = v?.candidateImageUrls;
        } catch { /* findVerifiedPerson may not be available */ }
        return { name: p.displayName, imageUrl: img, candidateImageUrls: candidates } as PersonOption;
      });
    } catch { /* getSuggestedPeople fallback */ }

    const localUnique = new Map<string, PersonOption>();
    for (const p of [...verifiedHits, ...profileHits]) {
      const k = p.name.trim().toLowerCase();
      if (k && !localUnique.has(k)) localUnique.set(k, p);
    }
    const instantResults = Array.from(localUnique.values()).slice(0, 8);
    setSuggestions(instantResults);

    // If we already have local matches, don't show "Searching..." spinner
    const hasLocalHits = instantResults.length > 0;
    setIsSearching(!hasLocalHits);

    // ── Background remote search (async, debounced 120ms) ──
    // searchPeopleWithPhotos ALSO searches VERIFIED_PEOPLE + Wikipedia,
    // so even if local search failed, remote will fill in verified results.
    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        const remote = await searchPeopleWithPhotos(query);
        if (!alive) return;

        // Merge: verified local results first (most reliable), then remote
        const merged = new Map<string, PersonOption>();
        for (const p of [...verifiedHits, ...remote, ...instantResults]) {
          const k = p.name.trim().toLowerCase();
          if (k && !merged.has(k)) merged.set(k, p);
        }

        setSuggestions(Array.from(merged.values()).slice(0, 8));
      } catch {
        // Remote search failed — keep whatever local results we have
        if (!alive) return;
      } finally {
        if (alive) setIsSearching(false);
      }
    }, 120);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [personQuery]);

  useEffect(() => {
    if (sessionMode !== 'live' || !result?.mentorReplies?.length || isConversationHovered) return;
    const timer = window.setInterval(() => {
      setActiveResultIndex((idx) => (idx + 1) % result.mentorReplies.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [result?.mentorReplies.length, sessionMode, isConversationHovered]);

  useEffect(() => {
    if (sessionMode !== 'live' || !result?.mentorReplies?.length || isConversationHovered) return;
    const timer = window.setTimeout(() => {
      setVisibleReplyCount((count) => Math.min(count + 1, result.mentorReplies.length));
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [sessionMode, result?.mentorReplies.length, visibleReplyCount, isConversationHovered]);

  useEffect(() => {
    if (phase !== 'session' || sessionMode !== 'live') return;
    scrollConversationToBottom();
  }, [phase, sessionMode, visibleReplyCount, noteReplies, conversationTurns, showGroupSolve, showSessionWrap]);

  useEffect(() => {
    if (!expandedReplyId) return;
    const replyList = (result?.mentorReplies || []).slice(0, visibleReplyCount);
    const stillVisible = replyList.some((reply) => reply.mentorId === expandedReplyId);
    if (!stillVisible) {
      setExpandedReplyId('');
    }
  }, [expandedReplyId, result?.mentorReplies, visibleReplyCount]);

  const normalizeMentorKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '_');

  const resolveMentorName = (rawName: string): string => {
    const key = normalizeMentorKey(rawName);
    const fromSelectedPeople = selectedPeople.find((p) => normalizeMentorKey(p.name) === key);
    if (fromSelectedPeople) return fromSelectedPeople.name;
    const fromSelectedMentors = selectedMentors.find(
      (mentor) => normalizeMentorKey(mentor.id) === key || normalizeMentorKey(mentor.displayName) === key
    );
    return fromSelectedMentors?.displayName || rawName;
  };

  const findImage = (rawName: string): string => {
    const resolvedName = resolveMentorName(rawName);
    const key = normalizeMentorKey(rawName);
    const match = selectedPeople.find(
      (p) =>
        normalizeMentorKey(p.name) === key ||
        normalizeMentorKey(p.name) === normalizeMentorKey(resolvedName) ||
        normalizeMentorKey(localizeName(p.name)) === key ||
        normalizeMentorKey(localizeName(p.name)) === normalizeMentorKey(resolvedName)
    );
    return imageSrcFor(resolvedName, match?.imageUrl, match?.candidateImageUrls);
  };

  const addPerson = async (person: PersonOption | string) => {
    const rawName = typeof person === 'string' ? person : person.name;
    const trimmed = rawName.trim();
    if (!trimmed) return;

    // ── Resolve raw text to canonical name + image ──
    // e.g. "lisa" → "Lisa Su" with photo, "steve jobs" → "Steve Jobs" with photo
    let name = typeof person === 'string' ? trimmed : person.name;
    let initialImage = typeof person === 'string' ? undefined : person.imageUrl;
    let initialCandidates = typeof person === 'string' ? undefined : person.candidateImageUrls;

    if (typeof person === 'string') {
      try {
        const verified = findVerifiedPerson(trimmed);
        if (verified) {
          name = verified.canonical;
          initialImage = verified.imageUrl;
          initialCandidates = verified.candidateImageUrls;
        }
      } catch { /* findVerifiedPerson may not be available due to module cache */ }
    }

    setSelectedPeople((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === name.toLowerCase())) return prev;
      if (prev.length >= MAX_PEOPLE) return prev;
      return [...prev, { name, imageUrl: initialImage, candidateImageUrls: initialCandidates }];
    });
    setLastSummonedName(name);
    window.setTimeout(() => setLastSummonedName(''), 1800);
    setPersonQuery('');

    const shouldHydrateProfile = !initialImage || !initialCandidates?.length || isLikelyFallbackAvatar(initialImage);
    if (shouldHydrateProfile) {
      try {
        const [fetchedImage, fetchedCandidates] = await Promise.all([fetchPersonImage(name), fetchPersonImageCandidates(name)]);
        if (fetchedImage || fetchedCandidates) {
          setSelectedPeople((prev) =>
            prev.map((p) =>
              p.name.toLowerCase() === name.toLowerCase()
                ? { ...p, imageUrl: fetchedImage || p.imageUrl, candidateImageUrls: fetchedCandidates || p.candidateImageUrls }
                : p
            )
          );
        }
      } catch { /* remote image fetch failed — keep initial/fallback */ }
    }
  };

  const removePerson = (name: string) => {
    setSelectedPeople((prev) => prev.filter((p) => p.name !== name));
  };

  const shuffleSeating = () => {
    setSelectedPeople((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const finishOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, dontShowOnboardingAgain ? '1' : '0');
    }
  };

  const handleGenerate = async () => {
    if (!problem.trim() || selectedMentors.length === 0) return;
    const language = uiLanguage;

    setIsGenerating(true);
    setPhase('session');
    setSessionMode('booting');
    setVisibleReplyCount(0);
    setShowSessionWrap(false);
    setShowGroupSolve(false);
    setConversationTurns([]);
    setReplyAllDraft('');
    setOpenNoteFor('');
    setNoteDrafts({});
    setNoteReplies({});
    setExpandedReplyId('');
    setExpandedSuggestion(null);
    setOpenDebugMentorId('');
    setHoveredDebugMentorId('');
    setDebugPromptByMentorId({});
    setDebugPromptLoadingByMentorId({});
    setDebugPromptErrorByMentorId({});

    const bootTimer = window.setTimeout(() => {
      setSessionMode('live');
    }, 2600);

    try {
      const aiResult = await generateMentorAdvice({
        problem: problem.trim(),
        language,
        mentors: selectedMentors,
        conversationHistory: buildConversationHistory(problem.trim())
      });
      setResult(aiResult);
      setActiveResultIndex(0);
      setVisibleReplyCount(Math.min(1, aiResult.mentorReplies.length));
    } finally {
      setIsGenerating(false);
      window.clearTimeout(bootTimer);
      setSessionMode('live');
    }
  };

  const seatPoint = (index: number, total: number) => {
    if (total <= 1) return { x: 50, y: 34 };
    const angleStart = 200;
    const angleEnd = 340;
    const angle = angleStart + ((angleEnd - angleStart) * index) / Math.max(total - 1, 1);
    const rad = (angle * Math.PI) / 180;
    const rX = total > 6 ? 42 : 38;
    const rY = total > 6 ? 13 : 11;
    const x = 50 + rX * Math.cos(rad);
    const y = 48 + rY * Math.sin(rad);
    return { x, y };
  };

  const seatStyle = (index: number, total: number) => {
    const { x, y } = seatPoint(index, total);
    return { left: `${x}%`, top: `${y}%` };
  };

  const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const getReplyByMentorName = (name: string) => {
    const key = normalizeMentorKey(name);
    return result?.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorName) === key);
  };

  const truncateWithEllipsis = (text: string, maxChars: number): { text: string; isTruncated: boolean } => {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (compact.length <= maxChars) return { text: compact, isTruncated: false };
    return { text: `${compact.slice(0, maxChars).trimEnd()}...`, isTruncated: true };
  };

  const simplifyLikelyResponse = (text: string) => {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (!compact) return compact;
    if (isZh) {
      return compact
        .replace(/^我(?:会|建议)?先(?:把这个)?拆成可执行步骤(?:先)?[:：]?\s*/u, '')
        .replace(/^我(?:会|建议)(?:先)?[:：]?\s*/u, '')
        .replace(/^可以先[:：]?\s*/u, '')
        .trim();
    }
    return compact
      .replace(/^i\s+(?:would|will|suggest|recommend)\s+break\s+this\s+into\s+executable\s+steps\s+first[:,]?\s*/iu, '')
      .replace(/^i\s+(?:would|will|suggest|recommend)\s+/iu, '')
      .replace(/^let'?s\s+/iu, '')
      .trim();
  };

  const simplifyActionStep = (text: string) => {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (!compact) return compact;
    if (isZh) {
      return compact.replace(/^下一步[:：]\s*/u, '').trim();
    }
    return compact.replace(/^next\s+step(?:\s*\(today\))?[:：]\s*/iu, '').trim();
  };

  const floatingCardPlacement = (mentorIndex: number, totalMentors: number): React.CSSProperties => {
    const safeTotal = Math.max(totalMentors, 1);
    const safeIndex = Math.min(Math.max(mentorIndex, 0), safeTotal - 1);
    const lanePoints = Array.from({ length: safeTotal }, (_, idx) => seatPoint(idx, safeTotal));
    const lane = lanePoints[safeIndex] || { x: 50, y: 34 };
    const prevLane = safeIndex > 0 ? lanePoints[safeIndex - 1] : null;
    const nextLane = safeIndex < safeTotal - 1 ? lanePoints[safeIndex + 1] : null;
    const leftGap = prevLane ? Math.abs(lane.x - prevLane.x) : Number.POSITIVE_INFINITY;
    const rightGap = nextLane ? Math.abs(nextLane.x - lane.x) : Number.POSITIVE_INFINITY;
    const nearestGap = Math.min(leftGap, rightGap);
    const widthPercent = Number.isFinite(nearestGap) ? clampNumber(nearestGap * 0.82, 8.5, 22) : 22;
    const widthCapPx = safeTotal <= 2 ? 250 : safeTotal <= 4 ? 210 : safeTotal <= 6 ? 170 : safeTotal <= 8 ? 150 : 130;
    const safeInset = widthPercent / 2 + 1.25;
    const left = clampNumber(lane.x, safeInset, 100 - safeInset);
    // Keep notes above the mentor name plate zone.
    const top = clampNumber(lane.y - 26.5, 10, 16.5);

    return {
      ['--mentor-card-left' as string]: `${left}%`,
      ['--mentor-card-top' as string]: `${top}%`,
      ['--mentor-card-rotate' as string]: '0deg',
      ['--mentor-card-width' as string]: `${widthPercent}%`,
      ['--mentor-card-max' as string]: `${widthCapPx}px`
    };
  };

  const activeReply = result?.mentorReplies?.[activeResultIndex];
  const activeReplyName = localizeName(resolveMentorName(activeReply?.mentorName || ''));
  const visibleReplies = (result?.mentorReplies || []).slice(0, visibleReplyCount);
  const pendingMentorReplies = (result?.mentorReplies || []).slice(visibleReplyCount);

  const sessionComplete = Boolean(
    result?.mentorReplies?.length && visibleReplyCount >= result.mentorReplies.length && sessionMode === 'live'
  );
  const expandedReply = visibleReplies.find((reply) => reply.mentorId === expandedReplyId) || null;

  const groupSolveText = useMemo(() => {
    if (!result?.mentorReplies?.length) return '';
    const lines = result.mentorReplies.slice(0, 4).map((reply) => {
      const name = localizeName(resolveMentorName(reply.mentorName));
      return `${name}: ${reply.oneActionStep}`;
    });
    return lines.join(' | ');
  }, [result?.mentorReplies, selectedPeople]);

  const openDebugMentor = selectedMentors.find((mentor) => mentor.id === openDebugMentorId) || null;
  const openDebugMentorDisplayName = openDebugMentor ? localizeName(openDebugMentor.displayName) : '';
  const openDebugPromptText = openDebugMentor ? debugPromptByMentorId[openDebugMentor.id] || '' : '';
  const openDebugPromptLoading = openDebugMentor ? Boolean(debugPromptLoadingByMentorId[openDebugMentor.id]) : false;
  const openDebugPromptError = openDebugMentor ? debugPromptErrorByMentorId[openDebugMentor.id] || '' : '';

  useEffect(() => {
    if (!openDebugMentorId && !hoveredDebugMentorId) return;
    const validMentorIds = new Set<string>(selectedMentors.map((mentor) => mentor.id));
    if (openDebugMentorId && !validMentorIds.has(openDebugMentorId)) {
      setOpenDebugMentorId('');
    }
    if (hoveredDebugMentorId && !validMentorIds.has(hoveredDebugMentorId)) {
      setHoveredDebugMentorId('');
    }
  }, [openDebugMentorId, hoveredDebugMentorId, selectedMentors]);

  useEffect(() => {
    if (!openDebugMentorId) return;
    const mentor = selectedMentors.find((item) => item.id === openDebugMentorId);
    if (!mentor) return;
    if (debugPromptByMentorId[mentor.id]) return;
    if (debugPromptLoadingByMentorId[mentor.id]) return;

    let cancelled = false;
    setDebugPromptLoadingByMentorId((prev) => ({ ...prev, [mentor.id]: true }));
    setDebugPromptErrorByMentorId((prev) => ({ ...prev, [mentor.id]: '' }));

    fetchMentorDebugPrompt({
      mentor,
      language: uiLanguage
    })
      .then((prompt) => {
        if (cancelled) return;
        setDebugPromptByMentorId((prev) => ({ ...prev, [mentor.id]: prompt }));
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setDebugPromptErrorByMentorId((prev) => ({ ...prev, [mentor.id]: message }));
      })
      .finally(() => {
        if (cancelled) return;
        setDebugPromptLoadingByMentorId((prev) => ({ ...prev, [mentor.id]: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [openDebugMentorId, selectedMentors, uiLanguage]);

  const saveTakeawayMemory = (goHomeAfterSave = false) => {
    if (!result?.mentorReplies?.length) return;
    const takeaways = result.mentorReplies.slice(0, 3).map((reply) => reply.oneActionStep);
    const memory: MemoryCard = {
      id: `${Date.now()}`,
      title: isZh ? '今晚总结' : 'Tonight\'s takeaway',
      style: scene,
      createdAt: new Date().toLocaleString(),
      takeaways
    };
    setMemories((prev) => [memory, ...prev]);
    setSaveNotice(`${t.savedSuccess} ${t.savedInDrawer}`);
    window.setTimeout(() => setSaveNotice(''), 2600);
    if (goHomeAfterSave) {
      setShowSessionWrap(false);
      setResult(null);
      setPhase('invite');
      setSessionMode('idle');
      setVisibleReplyCount(0);
      setShowGroupSolve(false);
      setConversationTurns([]);
      setReplyAllDraft('');
      setExpandedReplyId('');
      setExpandedSuggestion(null);
      setOpenDebugMentorId('');
      navigate('/');
      return;
    }
    setMemoryDrawerOpen(true);
  };

  const goPrevStyle = () => {
    const next = (sceneIndex - 1 + sceneOptions.length) % sceneOptions.length;
    setScene(sceneOptions[next].id);
  };

  const goNextStyle = () => {
    const next = (sceneIndex + 1) % sceneOptions.length;
    setScene(sceneOptions[next].id);
  };

  const randomStyle = () => {
    const picked = sceneOptions[Math.floor(Math.random() * sceneOptions.length)];
    setScene(picked.id);
  };

  const themeClass = {
    cute: styles.sceneCute,
    nature: styles.sceneNature,
    spooky: styles.sceneSpooky,
    cyber: styles.sceneCyber,
    library: styles.sceneLibrary
  }[scene];

  const phaseTitles: Array<{ id: RitualPhase; label: string }> = [
    { id: 'invite', label: t.summonGuests },
    { id: 'scene', label: t.portalPicker },
    { id: 'wish', label: t.placeArtifact },
    { id: 'session', label: t.openCircle }
  ];

  const localizedOnboardingSlides = isZh
    ? onboardingSlides
    : [
        {
          title: 'What This Feature Does',
          body: 'Choose who to consult, describe your problem, and receive individual advice.'
        },
        {
          title: 'Supported Targets',
          body: 'You can add celebrities, MBTI types (e.g., INTJ), cartoon characters, game characters, and movie characters.'
        },
        {
          title: 'How to Use',
          body: 'Steps: Pick targets → Pick a scene → Enter your problem → Start the session.'
        },
        {
          title: 'Replies and Notes',
          body: 'You can reply to one target or all targets. Save key takeaways in the memory drawer.'
        },
        {
          title: 'Instruction Display Setting',
          body: 'At the end, choose whether this instruction should appear the next time.'
        }
      ];

  const suggestionDeckEntries: SuggestionDeckEntry[] = selectedMentors
    .map<SuggestionDeckEntry | null>((mentor, index) => {
      const person = selectedPeople[index];
      const displayName = localizeName(person?.name || mentor.displayName);
      const reply = getReplyByMentorName(displayName) || getReplyByMentorName(mentor.displayName);
      const visibleReply = reply ? visibleReplies.find((item) => item.mentorId === reply.mentorId) : undefined;

      if (phase !== 'session' && reply) {
        return {
          key: `suggestion-${mentor.id}-${index}`,
          mentorIndex: index,
          displayName,
          likelyResponse: reply.likelyResponse,
          oneActionStep: reply.oneActionStep,
          status: 'ready'
        };
      }

      if (phase === 'session' && sessionMode === 'live' && visibleReply) {
        return {
          key: `preview-${mentor.id}-${index}`,
          mentorIndex: index,
          displayName,
          likelyResponse: visibleReply.likelyResponse,
          oneActionStep: visibleReply.oneActionStep,
          status: 'ready',
          replyId: visibleReply.mentorId
        };
      }

      if (phase === 'session' && sessionMode === 'live' && reply && !sessionComplete) {
        return {
          key: `typing-${mentor.id}-${index}`,
          mentorIndex: index,
          displayName,
          likelyResponse: t.mentorTyping,
          oneActionStep: '',
          status: 'typing'
        };
      }

      return null;
    })
    .filter((item): item is SuggestionDeckEntry => item !== null);

  return (
    <Layout>
      <section className={styles.roomPage}>
        <div className={`${styles.roomScene} ${themeClass} ${sessionMode === 'booting' ? styles.ritualBooting : ''}`}>
          <div className={styles.backLayer} />
          <div className={styles.midLayer} />
          <div className={styles.lightSource} />
          <div className={styles.vignette} />

          <div className={styles.heroBar}>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroSub}</p>
          </div>

          <div className={styles.topBar}>
            <div className={styles.phaseTrack}>
              {phaseTitles.map((p, idx) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    if (p.id !== 'session') {
                      setPhase(p.id);
                      setResult(null);
                      setSessionMode('idle');
                      setExpandedReplyId('');
                      setExpandedSuggestion(null);
                      setOpenDebugMentorId('');
                      setHoveredDebugMentorId('');
                    }
                  }}
                  className={`${styles.phasePill} ${idx <= ritualStep ? styles.phasePillDone : ''}`}
                >
                  {idx + 1}. {p.label}
                </button>
              ))}
            </div>
            <div className={styles.topBarActions}>
              <div className={styles.guestCount}>{isZh ? '人物数' : 'Guests'}: {selectedPeople.length}</div>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  setPhase('invite');
                  setExpandedReplyId('');
                  setExpandedSuggestion(null);
                  setOpenDebugMentorId('');
                  setHoveredDebugMentorId('');
                }}
              >
                {t.edit}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={shuffleSeating}><FontAwesomeIcon icon={faShuffle} /> {t.shuffle}</button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => {
                  setResult(null);
                  setPhase('invite');
                  setSessionMode('idle');
                  setVisibleReplyCount(0);
                  setShowSessionWrap(false);
                  setShowGroupSolve(false);
                  setConversationTurns([]);
                  setReplyAllDraft('');
                  setExpandedReplyId('');
                  setExpandedSuggestion(null);
                  setOpenDebugMentorId('');
                  setHoveredDebugMentorId('');
                }}
              >
                <FontAwesomeIcon icon={faRotate} /> {t.restart}
              </button>
            </div>
          </div>

          <div className={styles.workspace}>
            <aside className={styles.panel}>
              {phase === 'invite' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faUsers} /> {t.summoningRitual}</h2>
                  <div className={styles.searchBox}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                    <input
                      data-testid="mentor-person-input"
                      value={personQuery}
                      onChange={(e) => setPersonQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPerson(personQuery);
                        }
                      }}
                      placeholder={t.invitePlaceholder}
                      className={styles.personInput}
                    />
                    <button type="button" data-testid="mentor-add-person" className={styles.addBtn} onClick={() => addPerson(personQuery)}>
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                    {personQuery.trim() && (
                      <div className={styles.suggestionMenu}>
                        {suggestions.map((s) => {
                          const desc = isZh ? (s.descriptionZh || s.description) : s.description;
                          return (
                            <button type="button" key={s.name} className={styles.suggestionItem} onClick={() => addPerson(s)}>
                              <img
                                src={imageSrcFor(s.name, s.imageUrl, s.candidateImageUrls)}
                                alt={s.name}
                                className={styles.suggestionAvatar}
                                referrerPolicy="no-referrer"
                                onError={() => markImageBroken(s.name, s.imageUrl, s.candidateImageUrls)}
                              />
                              <div className={styles.suggestionText}>
                                <span className={styles.suggestionName}>{localizeName(s.name)}</span>
                                {desc && <span className={styles.suggestionDesc}>{desc}</span>}
                              </div>
                            </button>
                          );
                        })}
                        {isSearching && <div className={styles.searchingRow}>{isZh ? '搜索中...' : 'Searching...'}</div>}
                        {!isSearching && suggestions.length === 0 && (
                          <div className={styles.searchingRow}>{isZh ? '未找到结果，按回车添加自定义名人' : 'No results — press Enter to add as custom mentor'}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.selectedPeopleGrid}>
                    {selectedPeople.map((person, idx) => {
                      const category = getMentorCategory(person.name);
                      const flipped = Boolean(flippedCards[person.name]);
                      const summoned = lastSummonedName.toLowerCase() === person.name.toLowerCase();
                      return (
                        <div
                          key={person.name}
                          className={`${styles.guestCard} ${summoned ? styles.guestCardSummon : ''}`}
                          style={{ animationDelay: `${idx * 70}ms` }}
                        >
                          <div className={`${styles.summonRing} ${styles[`summon${category[0].toUpperCase()}${category.slice(1)}`]}`} />
                          <img
                            src={imageSrcFor(person.name, person.imageUrl, person.candidateImageUrls)}
                            alt={person.name}
                            className={styles.guestAvatar}
                            referrerPolicy="no-referrer"
                            onError={() => markImageBroken(person.name, person.imageUrl, person.candidateImageUrls)}
                          />
                          <div className={styles.guestMeta}>
                            <strong>{localizeName(person.name)}</strong>
                            <span>
                              {flipped
                                ? `${localizedVibeTags[idx % localizedVibeTags.length]} · “${t.keepGoing}”`
                                : localizedVibeTags[idx % localizedVibeTags.length]}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.flipMiniBtn}
                            onClick={() => setFlippedCards((prev) => ({ ...prev, [person.name]: !prev[person.name] }))}
                          >
                            {t.flip}
                          </button>
                          <button type="button" className={styles.removeGuestBtn} onClick={() => removePerson(person.name)}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" data-testid="mentor-continue-scene" className={styles.primaryCta} onClick={() => setPhase('scene')}>
                    {t.continueToPortal}
                  </button>
                </div>
              )}

              {phase === 'scene' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faWandMagicSparkles} /> {t.portalPicker}</h2>
                  <div className={styles.portalPicker}>
                    <button type="button" className={styles.portalNav} onClick={goPrevStyle}><FontAwesomeIcon icon={faChevronLeft} /></button>
                    <div className={styles.portalCenter}>
                      <div className={styles.portalMain}>{localizedSceneText(scene).label}</div>
                      <p>{localizedSceneText(scene).desc}</p>
                      <em>{localizedSceneText(scene).vibeLine}</em>
                    </div>
                    <button type="button" className={styles.portalNav} onClick={goNextStyle}><FontAwesomeIcon icon={faChevronRight} /></button>
                  </div>

                  <div className={styles.portalPeekRow}>
                    <span>{localizedSceneText(sceneOptions[(sceneIndex - 1 + sceneOptions.length) % sceneOptions.length].id).label}</span>
                    <span>{localizedSceneText(sceneOptions[(sceneIndex + 1) % sceneOptions.length].id).label}</span>
                  </div>

                  <button type="button" className={styles.ghostBtn} onClick={randomStyle}>
                    <FontAwesomeIcon icon={faDice} /> {t.randomVibe}
                  </button>

                  <button type="button" data-testid="mentor-lock-world" className={styles.primaryCta} onClick={() => setPhase('wish')}>
                    {t.lockWorld}
                  </button>
                </div>
              )}

              {phase === 'wish' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faBookOpen} /> {t.placeArtifact}</h2>
                  <div className={`${styles.artifactInput} ${styles[`artifact${scene[0].toUpperCase()}${scene.slice(1)}`]}`}>
                    <textarea
                      data-testid="mentor-problem-input"
                      className={styles.problemInput}
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder={t.artifactPlaceholder}
                      rows={7}
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="mentor-begin-session"
                    className={styles.primaryCta}
                    disabled={isGenerating || !problem.trim() || selectedMentors.length === 0}
                    onClick={handleGenerate}
                  >
                    <FontAwesomeIcon icon={faLightbulb} /> {isGenerating ? t.openingPortal : localizedSceneText(scene).cta}
                  </button>
                </div>
              )}

              {phase === 'session' && (
                <div className={styles.sessionSidebarStack}>
                  <div className={styles.disclaimer}>
                    <div className={styles.disclaimerLine}><FontAwesomeIcon icon={faCircleInfo} /> {t.aiDisclaimer}</div>
                    <div className={styles.sourceTag}>{t.source}: {result?.meta.source === 'llm' ? t.llmApi : t.localFallback}</div>
                  </div>

                  <div className={styles.sessionChatHeader}>
                    <span>{t.chatWindow}</span>
                    {expandedReply && (
                      <button
                        type="button"
                        className={styles.chatBackBtn}
                        onClick={() => {
                          setExpandedReplyId('');
                          setExpandedSuggestion(null);
                        }}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} /> {t.backToTable}
                      </button>
                    )}
                  </div>

                  <div
                    ref={conversationPanelRef}
                    data-testid="mentor-conversation-panel"
                    className={styles.conversationPanel}
                    onMouseEnter={() => setIsConversationHovered(true)}
                    onMouseLeave={() => setIsConversationHovered(false)}
                  >
                    <div className={styles.conversationHint}>{t.hoverPause}</div>

                    {sessionMode !== 'live' && (
                      <div className={styles.conversationRowLeft}>
                        <div className={styles.turnGroup}>
                          <div className={styles.conversationRowRight}>
                            <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                              <header>{t.you}</header>
                              <p>{problem.trim() || '...'}</p>
                            </article>
                          </div>
                          {selectedMentors.map((mentor) => (
                            <div key={`booting-${mentor.id}`} className={styles.conversationRowLeft}>
                              <article data-testid={`mentor-typing-${mentor.id}`} className={`${styles.conversationBubble} ${styles.conversationLoading}`}>
                                <header>{localizeName(mentor.displayName)}</header>
                                <p>{t.mentorTyping}</p>
                              </article>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sessionMode === 'live' && (
                      <>
                        <div className={styles.conversationRowRight}>
                          <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                            <header>{t.you}</header>
                            <p>{problem.trim() || '...'}</p>
                          </article>
                        </div>

                        {visibleReplies.map((reply) => {
                          const mentorName = localizeName(resolveMentorName(reply.mentorName));
                          const threadKey = mentorThreadKey(reply.mentorName);
                          return (
                            <div key={`${mentorName}-${reply.mentorId}`} className={styles.conversationRowLeft}>
                              <article className={`${styles.conversationBubble} ${styles.conversationLeftBubble} ${styleClassForCard(scene)}`}>
                                <header>{mentorName}</header>
                                <p>{reply.likelyResponse}</p>
                                <footer>{isZh ? '下一步：' : 'Next move: '} {reply.oneActionStep}</footer>
                                <button
                                  type="button"
                                  className={styles.passNoteBtn}
                                  onClick={() => setOpenNoteFor((prev) => (prev === threadKey ? '' : threadKey))}
                                >
                                  {t.passNoteTo} {mentorName}
                                </button>
                                {openNoteFor === threadKey && (
                                  <div className={styles.inlineNoteBox}>
                                    <textarea
                                      value={noteDrafts[threadKey] || ''}
                                      onChange={(e) =>
                                        setNoteDrafts((prev) => ({ ...prev, [threadKey]: e.target.value }))
                                      }
                                      placeholder={`${t.replyTo} ${mentorName}...`}
                                      rows={2}
                                    />
                                    <div className={styles.inlineNoteActions}>
                                      <button
                                        type="button"
                                        className={styles.ghostBtn}
                                        disabled={isRoundGenerating}
                                        onClick={() => submitNoteToMentor(reply.mentorName)}
                                      >
                                        {isRoundGenerating ? t.typing : t.send}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </article>
                            </div>
                          );
                        })}

                        {!sessionComplete && pendingMentorReplies.map((reply, idx) => {
                          const mentorName = localizeName(resolveMentorName(reply.mentorName));
                          return (
                            <div key={`pending-${reply.mentorId || reply.mentorName}-${idx}`} className={styles.conversationRowLeft}>
                              <article data-testid={`mentor-pending-${reply.mentorId || idx}`} className={`${styles.conversationBubble} ${styles.conversationLoading}`}>
                                <header>{mentorName}</header>
                                <p>{t.mentorTyping}</p>
                              </article>
                            </div>
                          );
                        })}

                        {isRoundGenerating && (
                          <div className={styles.turnGroup}>
                            {selectedMentors.map((mentor) => (
                              <div key={`round-loading-${mentor.id}`} className={styles.conversationRowLeft}>
                                <article data-testid={`mentor-round-typing-${mentor.id}`} className={`${styles.conversationBubble} ${styles.conversationLoading}`}>
                                  <header>{localizeName(mentor.displayName)}</header>
                                  <p>{t.mentorTyping}</p>
                                </article>
                              </div>
                            ))}
                          </div>
                        )}

                        {conversationTurns.map((turn) => (
                          <div key={turn.id} className={styles.turnGroup}>
                            <div className={styles.conversationRowRight}>
                              <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                                <header>{t.you}</header>
                                <p>{turn.user}</p>
                              </article>
                            </div>
                            {turn.replies.map((reply, idx) => (
                              <div key={`${turn.id}-${reply.mentorName}-${idx}`} className={styles.conversationRowLeft}>
                                <article className={`${styles.conversationBubble} ${styles.conversationLeftBubble} ${styleClassForCard(scene)}`}>
                                  <header>{localizeName(reply.mentorName)}</header>
                                  <p>{reply.text}</p>
                                </article>
                              </div>
                            ))}
                          </div>
                        ))}

                        {sessionComplete && (
                          <div className={styles.groupActions}>
                            <button
                              type="button"
                              className={styles.secondaryCta}
                              onClick={() => setShowGroupSolve((v) => !v)}
                            >
                              {showGroupSolve ? t.hideGroup : t.showGroup}
                            </button>
                          </div>
                        )}

                        {sessionComplete && showGroupSolve && (
                          <div className={styles.conversationRowLeft}>
                            <article className={`${styles.conversationBubble} ${styles.groupSolveCard}`}>
                              <header>{t.jointStrategy}</header>
                              <p>{groupSolveText}</p>
                            </article>
                          </div>
                        )}

                        {sessionComplete && !showSessionWrap && (
                          <div className={styles.conversationRowRight}>
                            <button type="button" className={styles.secondaryCta} onClick={() => setShowSessionWrap(true)}>
                              {t.showWrap}
                            </button>
                          </div>
                        )}

                        {sessionComplete && (
                          <div className={styles.conversationRowRight}>
                            <article className={`${styles.conversationBubble} ${styles.conversationRightBubble} ${styles.replyAllDockCard}`}>
                              <header>{t.replyToAllHeader}</header>
                              <textarea
                                value={replyAllDraft}
                                onChange={(e) => setReplyAllDraft(e.target.value)}
                                placeholder={t.replyAllPlaceholder}
                                rows={4}
                              />
                              <div className={styles.inlineNoteActions}>
                                <button
                                  type="button"
                                  className={styles.ghostBtn}
                                  disabled={isRoundGenerating}
                                  onClick={handleReplyAll}
                                >
                                  {isRoundGenerating ? t.typing : t.sendToAll}
                                </button>
                              </div>
                            </article>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {sessionComplete && showSessionWrap && (
                    <div className={styles.sessionWrap}>
                      <h3>{t.sessionComplete}</h3>
                      <p>{t.tonightTakeaway}</p>
                      <ul>
                        {(result?.mentorReplies || []).slice(0, 3).map((reply) => (
                          <li key={reply.mentorName}>{reply.oneActionStep}</li>
                        ))}
                      </ul>
                      <div className={styles.wrapActions}>
                        <button type="button" data-testid="mentor-save-chat" className={styles.secondaryCta} onClick={() => saveTakeawayMemory()}>{t.save}</button>
                        <button
                          type="button"
                          className={styles.secondaryCta}
                          onClick={() => {
                            setResult(null);
                            setPhase('invite');
                            setSessionMode('idle');
                            setConversationTurns([]);
                            setReplyAllDraft('');
                            setExpandedReplyId('');
                            setExpandedSuggestion(null);
                            setOpenDebugMentorId('');
                            setHoveredDebugMentorId('');
                          }}
                        >
                          {t.newTable}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>

            <div className={`${styles.stage} ${sessionMode === 'live' ? styles.stageLive : ''}`}>
              <div
                className={styles.tableArena}
                onClick={(e) => {
                  const target = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - target.left;
                  const y = e.clientY - target.top;
                  setTableRipple({ x, y, key: `${Date.now()}` });
                }}
              >
                {tableRipple && (
                  <span
                    key={tableRipple.key}
                    className={styles.tableRipple}
                    style={{ left: tableRipple.x, top: tableRipple.y }}
                  />
                )}

                <div className={styles.tableTop}>
                  <div className={styles.tableRunner} />
                  <div className={styles.tableInner} />
                  <button
                    type="button"
                    className={styles.candleProp}
                    style={{ ['--flame-scale' as string]: `${0.8 + candleLevel * 0.26}` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCandleLevel((v) => (v % 3) + 1);
                    }}
                  >
                    <span className={styles.candleBody} />
                    <span className={styles.candleFlame} />
                  </button>
                </div>

                <div className={styles.tableLegs}>
                  <div className={`${styles.leg} ${styles.leg1}`} />
                  <div className={`${styles.leg} ${styles.leg2}`} />
                  <div className={`${styles.leg} ${styles.leg3}`} />
                  <div className={`${styles.leg} ${styles.leg4}`} />
                </div>

                <div className={styles.userSeat}>
                  <div className={styles.userAvatar}><FontAwesomeIcon icon={faUser} /></div>
                  <div className={styles.userLabel}>{t.youFrontRow}</div>
                  <p className={styles.userPrompt}>{problem.trim() || t.concernHint}</p>
                </div>

                {selectedMentors.map((mentor: MentorProfile, index: number) => {
                  const person = selectedPeople[index];
                  const displayName = localizeName(person?.name || mentor.displayName);
                  const mentorReply = getReplyByMentorName(displayName) || getReplyByMentorName(mentor.displayName);
                  const mentorWaitingForReply = Boolean(
                    phase === 'session' &&
                    sessionMode === 'live' &&
                    !sessionComplete &&
                    mentorReply &&
                    !visibleReplies.some((reply) => reply.mentorId === mentorReply.mentorId)
                  );
                  const isSpeaker = activeReplyName === displayName && sessionMode === 'live';
                  const flipped = Boolean(flippedCards[displayName]);
                  const marker = scene === 'cute' ? '★' : scene === 'nature' ? '🍃' : scene === 'spooky' ? '✦' : scene === 'cyber' ? '▣' : '✎';
                  const categoryClass = styles[`entrance${getMentorCategory(displayName)[0].toUpperCase()}${getMentorCategory(displayName).slice(1)}`];

                  return (
                    <div
                      key={`${displayName}-${mentor.id}`}
                      className={`${styles.mentorNode} ${isSpeaker ? styles.mentorNodeSpeaker : ''} ${categoryClass}`}
                      style={seatStyle(index, selectedMentors.length)}
                    >
                      {mentorWaitingForReply && (
                        <div className={styles.mentorTypingBadge}>{t.mentorTyping}</div>
                      )}
                      <button
                        type="button"
                        className={`${styles.namePlate} ${isSpeaker ? styles.namePlateActive : ''}`}
                        onClick={() => setFlippedCards((prev) => ({ ...prev, [displayName]: !prev[displayName] }))}
                      >
                        {flipped ? `${displayName} · ${localizedVibeTags[index % localizedVibeTags.length]}` : displayName}
                      </button>
                      <div
                        className={styles.mentorAvatarWrap}
                        onMouseEnter={() => setHoveredDebugMentorId(mentor.id)}
                        onMouseLeave={() => setHoveredDebugMentorId((prev) => (prev === mentor.id ? '' : prev))}
                      >
                        <button
                          type="button"
                          className={`${styles.mentorAvatar} ${isSpeaker ? styles.mentorAvatarActive : ''}`}
                        >
                          <img
                            src={findImage(displayName)}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            onError={() => markImageBroken(resolveMentorName(displayName), selectedPeople[index]?.imageUrl, selectedPeople[index]?.candidateImageUrls)}
                          />
                        </button>
                        {(hoveredDebugMentorId === mentor.id || openDebugMentorId === mentor.id) && (
                          <button
                            type="button"
                            className={styles.debugIconBtn}
                            title={t.inspectPrompt}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDebugMentorId((prev) => (prev === mentor.id ? '' : mentor.id));
                            }}
                          >
                            <FontAwesomeIcon icon={faBug} />
                          </button>
                        )}
                      </div>
                      <div className={styles.seatProp}>{marker}</div>
                    </div>
                  );
                })}

                <div className={styles.suggestionDeck}>
                  {suggestionDeckEntries.map((entry) => {
                    const totalMentorSlots = Math.max(selectedMentors.length, 1);
                    const cardStyle = floatingCardPlacement(entry.mentorIndex, totalMentorSlots);
                    const actionPreview = truncateWithEllipsis(
                      simplifyActionStep(entry.oneActionStep),
                      totalMentorSlots > 6 ? 24 : totalMentorSlots > 3 ? 32 : 44
                    );
                    const reasonPreview = truncateWithEllipsis(
                      simplifyLikelyResponse(entry.likelyResponse),
                      totalMentorSlots > 6 ? 28 : totalMentorSlots > 3 ? 36 : 50
                    );
                    const hasTrimmed = reasonPreview.isTruncated || actionPreview.isTruncated;

                    if (!entry.replyId) {
                      if (entry.status === 'typing') {
                        return (
                          <article
                            key={entry.key}
                            className={`${styles.suggestionCard} ${styles.suggestionCardTyping}`}
                            style={cardStyle}
                          >
                            <h3>{entry.displayName}</h3>
                            <p className={styles.suggestionPrimary}>{t.mentorTyping}</p>
                          </article>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={entry.key}
                          className={styles.suggestionCard}
                          style={cardStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedReplyId('');
                            setExpandedSuggestion({
                              mentorName: entry.displayName,
                              likelyResponse: entry.likelyResponse,
                              oneActionStep: entry.oneActionStep
                            });
                          }}
                        >
                          <h3>{entry.displayName}</h3>
                          <p className={styles.suggestionPrimary}>{actionPreview.text}</p>
                          <p className={styles.suggestionSecondary}>{reasonPreview.text}</p>
                          {hasTrimmed && <span className={styles.replyExpandHint}>{t.clickToExpand}</span>}
                        </button>
                      );
                    }

                    return (
                      <article
                        key={entry.key}
                        className={`${styles.tableReplyCard} ${styles.mentorReplyPreview} ${expandedReplyId === entry.replyId ? styles.tableReplyCardActive : ''}`}
                        style={cardStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSuggestion(null);
                          setExpandedReplyId(entry.replyId || '');
                        }}
                      >
                        <header>{entry.displayName}</header>
                        <p className={styles.suggestionPrimary}>{actionPreview.text}</p>
                        <footer className={styles.suggestionSecondary}>{reasonPreview.text}</footer>
                        {hasTrimmed && <span className={styles.replyExpandHint}>{t.clickToExpand}</span>}
                      </article>
                    );
                  })}
                </div>

                {expandedSuggestion && (
                  <div
                    className={styles.replyExpandOverlay}
                    onClick={() => setExpandedSuggestion(null)}
                  >
                    <button
                      type="button"
                      className={styles.expandBackTopLeft}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSuggestion(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} /> {t.backToTable}
                    </button>
                    <article
                      className={`${styles.replyExpandedCard} ${styles.replyExpandedSticky}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <header>{expandedSuggestion.mentorName}</header>
                      <p>{expandedSuggestion.likelyResponse}</p>
                      <footer>{isZh ? '下一步：' : 'Next move: '} {expandedSuggestion.oneActionStep}</footer>
                    </article>
                  </div>
                )}

                {phase === 'session' && sessionMode === 'live' && expandedReply && (
                  <div
                    className={styles.replyExpandOverlay}
                    onClick={() => {
                      setExpandedReplyId('');
                      setExpandedSuggestion(null);
                    }}
                  >
                    <button
                      type="button"
                      className={styles.expandBackTopLeft}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedReplyId('');
                        setExpandedSuggestion(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} /> {t.backToTable}
                    </button>
                    <article
                      className={`${styles.replyExpandedCard} ${styles.replyExpandedSticky}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const mentorName = localizeName(resolveMentorName(expandedReply.mentorName));
                        const threadKey = mentorThreadKey(expandedReply.mentorName);
                        const notes = noteReplies[threadKey] || [];
                        return (
                          <>
                            <header>{mentorName}</header>
                            <p>{expandedReply.likelyResponse}</p>
                            <footer>{isZh ? '下一步：' : 'Next move: '} {expandedReply.oneActionStep}</footer>
                            <button
                              type="button"
                              className={styles.passNoteBtn}
                              onClick={() => setOpenNoteFor((prev) => (prev === threadKey ? '' : threadKey))}
                            >
                              {t.passNoteTo} {mentorName}
                            </button>
                            {openNoteFor === threadKey && (
                              <div className={styles.inlineNoteBox}>
                                <textarea
                                  value={noteDrafts[threadKey] || ''}
                                  onChange={(e) =>
                                    setNoteDrafts((prev) => ({ ...prev, [threadKey]: e.target.value }))
                                  }
                                  placeholder={`${t.replyTo} ${mentorName}...`}
                                  rows={2}
                                />
                                <div className={styles.inlineNoteActions}>
                                  <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    disabled={isRoundGenerating}
                                    onClick={() => submitNoteToMentor(expandedReply.mentorName)}
                                  >
                                    {isRoundGenerating ? t.typing : t.send}
                                  </button>
                                </div>
                              </div>
                            )}
                            {notes.map((note, idx) => (
                              <div key={`${threadKey}-expanded-note-${idx}`} className={styles.noteThread}>
                                {note.role === 'user' ? `${t.you}: ${note.text}` : `${mentorName}: ${note.text}`}
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </article>
                  </div>
                )}

                {openDebugMentor && (
                  <aside className={styles.debugPromptPanel}>
                    <div className={styles.debugPromptHeader}>
                      <strong>{t.debugPrompt}</strong>
                      <span>{openDebugMentorDisplayName}</span>
                    </div>
                    <pre className={styles.debugPromptBody}>
                      {openDebugPromptLoading ? t.loading : openDebugPromptText || openDebugPromptError || t.debugLoadFailed}
                    </pre>
                    <button type="button" className={styles.debugPromptCloseBtn} onClick={() => setOpenDebugMentorId('')}>
                      {t.closeDebug}
                    </button>
                  </aside>
                )}
              </div>

              {phase === 'session' && (
                <div className={styles.sessionLayer}>
                  {sessionMode === 'booting' && (
                    <div className={styles.bootSequence}>
                      <div className={styles.sessionBell}><FontAwesomeIcon icon={faBell} /></div>
                      <div className={styles.bootLine}>{t.tableListening}</div>
                      <div className={styles.bootSteps}>
                        <span>{t.clothPattern}</span>
                        <span>{t.ambientOn}</span>
                        <span>{t.cardsGlow}</span>
                      </div>
                    </div>
                  )}

                  {sessionMode === 'live' && (
                    <div className={styles.stageLiveHint}>{t.tableListening}</div>
                  )}
                </div>
              )}

              {result?.safety.riskLevel === 'high' && (
                <div className={styles.riskBanner}>
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  <span>{result.safety.emergencyMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="button" data-testid="mentor-memory-fab" className={styles.memoryFab} onClick={() => setMemoryDrawerOpen((v) => !v)}>
          <FontAwesomeIcon icon={faBookOpen} /> {t.memories} ({memories.length})
        </button>

        {saveNotice && <div data-testid="mentor-save-notice" className={styles.saveNotice}>{saveNotice}</div>}

        {memoryDrawerOpen && (
          <div data-testid="mentor-memory-drawer" className={styles.memoryDrawer}>
            <h3>{t.memoryDrawer}</h3>
            <p className={styles.memoryHint}>{t.savedInDrawer}</p>
            {memories.length === 0 && <p className={styles.emptyMemory}>{t.noMemories}</p>}
            {memories.map((memory) => (
              <article key={memory.id} className={styles.memoryCard}>
                <header>{memory.title}</header>
                <small>{memory.createdAt} · {localizedSceneName(memory.style)}</small>
                <ul>
                  {memory.takeaways.slice(0, 3).map((item, idx) => (
                    <li key={`${memory.id}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        {showOnboarding && (
          <div className={styles.onboardingOverlay}>
            <div className={styles.onboardingCard}>
              <h3>{localizedOnboardingSlides[currentSlide].title}</h3>
              <p>{localizedOnboardingSlides[currentSlide].body}</p>
              {currentSlide === localizedOnboardingSlides.length - 1 && (
                <div className={styles.onboardingChoiceBoxes}>
                  <button
                    type="button"
                    className={`${styles.onboardingChoiceBox} ${dontShowOnboardingAgain ? styles.onboardingChoiceBoxActive : ''}`}
                    onClick={() => setDontShowOnboardingAgain(true)}
                  >
                    {t.dontShowAgain}
                  </button>
                  <button
                    type="button"
                    className={`${styles.onboardingChoiceBox} ${!dontShowOnboardingAgain ? styles.onboardingChoiceBoxActive : ''}`}
                    onClick={() => setDontShowOnboardingAgain(false)}
                  >
                    {t.keepShowing}
                  </button>
                </div>
              )}
              <div className={styles.slideDots}>
                {localizedOnboardingSlides.map((_, idx) => (
                  <span key={idx} className={`${styles.slideDot} ${currentSlide === idx ? styles.slideDotActive : ''}`} />
                ))}
              </div>
              <div className={styles.onboardingActions}>
                <button
                  type="button"
                  className={styles.onboardingBtnSecondary}
                  onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
                  disabled={currentSlide === 0}
                >
                  {t.back}
                </button>
                {currentSlide < localizedOnboardingSlides.length - 1 ? (
                  <button
                    type="button"
                    className={styles.onboardingBtnPrimary}
                    onClick={() => setCurrentSlide((s) => Math.min(localizedOnboardingSlides.length - 1, s + 1))}
                  >
                    {t.next}
                  </button>
                ) : (
                  <button type="button" className={styles.onboardingBtnPrimary} onClick={finishOnboarding}>
                    {t.getStarted}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default MentorTablePage;
