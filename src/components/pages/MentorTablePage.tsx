import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  faVolumeXmark,
  faVolumeHigh,
  faChevronLeft,
  faChevronRight,
  faDice,
  faCamera,
  faBell,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
import { MentorProfile, createCustomMentorProfile, getSuggestedPeople } from '../../features/mentorTable/mentorProfiles';
import { MentorSimulationResult } from '../../features/mentorTable/mentorEngine';
import { generateMentorAdvice } from '../../features/mentorTable/mentorApi';
import {
  PersonOption,
  fetchPersonImage,
  getVerifiedPlaceholderImage,
  searchPeopleWithPhotos
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

const MAX_PEOPLE = 10;
const ONBOARDING_KEY = 'mentorTableOnboardingDone';
const DEFAULT_PLACEHOLDER_AVATAR = getVerifiedPlaceholderImage();

const defaultPeople: PersonOption[] = [
  {
    name: 'Bill Gates',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/512px-Bill_Gates_2018.jpg'
  },
  {
    name: 'Oprah Winfrey',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Oprah_Winfrey_2014.jpg/512px-Oprah_Winfrey_2014.jpg'
  },
  {
    name: 'Kobe Bryant',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Kobe_Bryant_2019.jpg/512px-Kobe_Bryant_2019.jpg'
  }
];

const onboardingSlides = [
  {
    title: '欢迎来到 名人桌',
    body: '这里不是普通页面，是一个可互动的“房间舞台”。'
  },
  {
    title: 'Ritual Flow',
    body: 'Summon Guests → Pick Portal → Place Your Note → Open Session。'
  },
  {
    title: 'Collect Memories',
    body: '每次会话结束会生成一张 Memory Card，保存在右下角抽屉。'
  }
];

const sceneOptions: Array<{
  id: SceneStyle;
  label: string;
  desc: string;
  vibeLine: string;
  cta: string;
}> = [
  {
    id: 'cute',
    label: 'Cute & Aesthetic',
    desc: 'pastel sparkles + sticker notes',
    vibeLine: 'Soft, cozy, sparkly.',
    cta: 'Send the Note ✨'
  },
  {
    id: 'nature',
    label: 'Nature',
    desc: 'open air + field notes',
    vibeLine: 'Fresh, grounded, open-air.',
    cta: 'Release the Thought 🍃'
  },
  {
    id: 'spooky',
    label: 'Spooky & Creepy',
    desc: 'candle fog + parchment',
    vibeLine: 'Quiet, eerie, candlelit.',
    cta: 'Whisper to the Table 🕯️'
  },
  {
    id: 'cyber',
    label: 'Cyber Noir',
    desc: 'neon rain + holo panel',
    vibeLine: 'Neon rain, futuristic.',
    cta: 'Transmit Signal ▣'
  },
  {
    id: 'library',
    label: 'Library / Study',
    desc: 'warm lamp + notebook',
    vibeLine: 'Warm study lamp, calm focus.',
    cta: 'Open the Chapter 📚'
  }
];

const vibeTags = ['Builder', 'Storyteller', 'Competitor', 'Strategist', 'Dreamer', 'Rebel'];

function getMentorCategory(name: string): 'tech' | 'sports' | 'artist' | 'leader' {
  const normalized = name.toLowerCase();
  if (normalized.includes('kobe')) return 'sports';
  if (normalized.includes('miyazaki')) return 'artist';
  if (normalized.includes('bill') || normalized.includes('elon')) return 'tech';
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
  const { i18n } = useTranslation();
  const [phase, setPhase] = useState<RitualPhase>('invite');
  const [sessionMode, setSessionMode] = useState<SessionMode>('idle');
  const [problem, setProblem] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<PersonOption[]>(defaultPeople);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [suggestions, setSuggestions] = useState<PersonOption[]>([]);
  const [result, setResult] = useState<MentorSimulationResult | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_KEY) !== '1';
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
  const conversationPanelRef = useRef<HTMLDivElement | null>(null);

  const selectedMentors = useMemo(
    () => selectedPeople.map((person) => createCustomMentorProfile(person.name)),
    [selectedPeople]
  );

  const ritualStep = phase === 'invite' ? 0 : phase === 'scene' ? 1 : phase === 'wish' ? 2 : 3;
  const sceneIndex = sceneOptions.findIndex((s) => s.id === scene);
  const currentScene = sceneOptions[sceneIndex] || sceneOptions[0];

  const generateMentorFollowup = (mentorName: string, userText: string) => {
    const excerpt = userText.slice(0, 56).trim();
    return `收到你的补充（“${excerpt}${userText.length > 56 ? '...' : ''}”）。我会先给你一个最小可执行动作，你做完后我们再迭代下一步。`;
  };

  const scrollConversationToBottom = () => {
    if (!conversationPanelRef.current) return;
    const node = conversationPanelRef.current;
    window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
  };

  useEffect(() => {
    const run = async () => {
      const enriched = await Promise.all(
        defaultPeople.map(async (person) => ({
          ...person,
          imageUrl: (await fetchPersonImage(person.name)) || person.imageUrl
        }))
      );
      setSelectedPeople((prev) => {
        if (prev.length !== defaultPeople.length) return prev;
        const prevNames = prev.map((p) => p.name).join('|');
        const defaultNames = defaultPeople.map((p) => p.name).join('|');
        if (prevNames !== defaultNames) return prev;
        return enriched;
      });
    };
    run();
  }, []);

  useEffect(() => {
    const query = personQuery.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    let alive = true;
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      const [remote, local] = await Promise.all([
        searchPeopleWithPhotos(query),
        Promise.resolve(getSuggestedPeople(query).map((p) => ({ name: p.displayName } as PersonOption)))
      ]);

      if (!alive) return;
      const merged = [...remote, ...local];
      const unique = new Map<string, PersonOption>();
      for (const person of merged) {
        const key = person.name.trim().toLowerCase();
        if (!key) continue;
        if (!unique.has(key)) unique.set(key, person);
      }

      setSuggestions(Array.from(unique.values()).slice(0, 8));
      setIsSearching(false);
    }, 180);

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
      (p) => normalizeMentorKey(p.name) === key || normalizeMentorKey(p.name) === normalizeMentorKey(resolvedName)
    );
    return match?.imageUrl || DEFAULT_PLACEHOLDER_AVATAR;
  };

  const addPerson = async (person: PersonOption | string) => {
    const rawName = typeof person === 'string' ? person : person.name;
    const trimmed = rawName.trim();
    if (!trimmed) return;

    const initialImage = typeof person === 'string' ? undefined : person.imageUrl;
    setSelectedPeople((prev) => {
      if (prev.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      if (prev.length >= MAX_PEOPLE) return prev;
      return [...prev, { name: trimmed, imageUrl: initialImage }];
    });
    setLastSummonedName(trimmed);
    window.setTimeout(() => setLastSummonedName(''), 1800);
    setPersonQuery('');

    if (!initialImage) {
      const fetchedImage = await fetchPersonImage(trimmed);
      if (fetchedImage) {
        setSelectedPeople((prev) =>
          prev.map((p) => (p.name.toLowerCase() === trimmed.toLowerCase() ? { ...p, imageUrl: fetchedImage } : p))
        );
      }
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
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
  };

  const handleGenerate = async () => {
    if (!problem.trim() || selectedMentors.length === 0) return;
    const language = i18n.language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';

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

    const bootTimer = window.setTimeout(() => {
      setSessionMode('live');
    }, 2600);

    try {
      const aiResult = await generateMentorAdvice({
        problem: problem.trim(),
        language,
        mentors: selectedMentors
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

  const takeSnapshotMemory = () => {
    const takeaways = result?.mentorReplies?.slice(0, 3).map((r) => r.oneActionStep) || [problem || 'Session snapshot'];
    const memory: MemoryCard = {
      id: `${Date.now()}`,
      title: 'Polaroid Snapshot',
      style: scene,
      createdAt: new Date().toLocaleString(),
      takeaways
    };
    setMemories((prev) => [memory, ...prev]);
    setMemoryDrawerOpen(true);
  };

  const seatStyle = (index: number, total: number) => {
    if (total <= 1) return { left: '50%', top: '26%' };
    const angleStart = 210;
    const angleEnd = -30;
    const angle = angleStart + ((angleEnd - angleStart) * index) / Math.max(total - 1, 1);
    const rad = (angle * Math.PI) / 180;
    const rX = total > 6 ? 40 : 34;
    const rY = total > 6 ? 24 : 20;
    const x = 50 + rX * Math.cos(rad);
    const y = 56 + rY * Math.sin(rad);
    return { left: `${x}%`, top: `${y}%` };
  };

  const getReplyByMentorName = (name: string) => {
    const key = normalizeMentorKey(name);
    return result?.mentorReplies.find((reply) => normalizeMentorKey(reply.mentorName) === key);
  };

  const activeReply = result?.mentorReplies?.[activeResultIndex];
  const activeReplyName = resolveMentorName(activeReply?.mentorName || '');
  const visibleReplies = (result?.mentorReplies || []).slice(0, visibleReplyCount);
  const pendingReply = result?.mentorReplies?.[visibleReplyCount] || null;
  const pendingMentorName = pendingReply ? resolveMentorName(pendingReply.mentorName) : '';

  const sessionComplete = Boolean(
    result?.mentorReplies?.length && visibleReplyCount >= result.mentorReplies.length && sessionMode === 'live'
  );

  const groupSolveText = useMemo(() => {
    if (!result?.mentorReplies?.length) return '';
    const lines = result.mentorReplies.slice(0, 4).map((reply) => {
      const name = resolveMentorName(reply.mentorName);
      return `${name}: ${reply.oneActionStep}`;
    });
    return lines.join(' | ');
  }, [result?.mentorReplies, selectedPeople]);

  const debugHintText = useMemo(() => {
    const raw = result?.meta.debugMessage || '';
    if (!raw) return '';
    const compact = raw.split('Preview:')[0].trim();
    if (compact.length <= 160) return compact;
    return `${compact.slice(0, 157)}...`;
  }, [result?.meta.debugMessage]);

  const saveTakeawayMemory = () => {
    if (!result?.mentorReplies?.length) return;
    const takeaways = result.mentorReplies.slice(0, 3).map((reply) => reply.oneActionStep);
    const memory: MemoryCard = {
      id: `${Date.now()}`,
      title: 'Tonight\'s takeaway',
      style: scene,
      createdAt: new Date().toLocaleString(),
      takeaways
    };
    setMemories((prev) => [memory, ...prev]);
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
    { id: 'invite', label: 'Summon Guests' },
    { id: 'scene', label: 'Portal Picker' },
    { id: 'wish', label: 'Place Artifact' },
    { id: 'session', label: 'Open Circle' }
  ];

  return (
    <Layout>
      <section className={styles.roomPage}>
        <div className={`${styles.roomScene} ${themeClass} ${sessionMode === 'booting' ? styles.ritualBooting : ''}`}>
          <div className={styles.backLayer} />
          <div className={styles.midLayer} />
          <div className={styles.lightSource} />
          <div className={styles.vignette} />

          <div className={styles.heroBar}>
            <h1>名人桌 · Summoning Room</h1>
            <p>Not a page. A stage.</p>
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
                    }
                  }}
                  className={`${styles.phasePill} ${idx <= ritualStep ? styles.phasePillDone : ''}`}
                >
                  {idx + 1}. {p.label}
                </button>
              ))}
            </div>
            <div className={styles.topBarActions}>
              <div className={styles.guestCount}>Guests: {selectedPeople.length}</div>
              <button type="button" className={styles.ghostBtn} onClick={() => setPhase('invite')}>Edit</button>
              <button type="button" className={styles.ghostBtn} onClick={shuffleSeating}><FontAwesomeIcon icon={faShuffle} /> Shuffle</button>
              <button type="button" className={styles.ghostBtn} onClick={takeSnapshotMemory}><FontAwesomeIcon icon={faCamera} /> Polaroid</button>
              <button type="button" className={styles.ghostBtn} onClick={() => setSoundOn((v) => !v)}>
                <FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} /> {soundOn ? 'Sound On' : 'Sound Off'}
              </button>
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
                }}
              >
                <FontAwesomeIcon icon={faRotate} /> Restart
              </button>
            </div>
          </div>

          <div className={styles.workspace}>
            <aside className={styles.panel}>
              {phase === 'invite' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faUsers} /> Summoning Ritual</h2>
                  <div className={styles.searchBox}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                    <input
                      value={personQuery}
                      onChange={(e) => setPersonQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPerson(personQuery);
                        }
                      }}
                      placeholder="Invite someone you admire"
                      className={styles.personInput}
                    />
                    <button type="button" className={styles.addBtn} onClick={() => addPerson(personQuery)}>
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>

                  {personQuery.trim() && (
                    <div className={styles.suggestionMenu}>
                      {isSearching && <div className={styles.searchingRow}>Searching...</div>}
                      {!isSearching && suggestions.map((s) => (
                        <button type="button" key={s.name} className={styles.suggestionItem} onClick={() => addPerson(s)}>
                          <img src={s.imageUrl || DEFAULT_PLACEHOLDER_AVATAR} alt={s.name} className={styles.suggestionAvatar} />
                          <span>{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

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
                          <img src={person.imageUrl || DEFAULT_PLACEHOLDER_AVATAR} alt={person.name} className={styles.guestAvatar} />
                          <div className={styles.guestMeta}>
                            <strong>{person.name}</strong>
                            <span>{flipped ? `${vibeTags[idx % vibeTags.length]} · “keep going”` : vibeTags[idx % vibeTags.length]}</span>
                          </div>
                          <button
                            type="button"
                            className={styles.flipMiniBtn}
                            onClick={() => setFlippedCards((prev) => ({ ...prev, [person.name]: !prev[person.name] }))}
                          >
                            flip
                          </button>
                          <button type="button" className={styles.removeGuestBtn} onClick={() => removePerson(person.name)}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" className={styles.primaryCta} onClick={() => setPhase('scene')}>
                    Continue to Portal
                  </button>
                </div>
              )}

              {phase === 'scene' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faWandMagicSparkles} /> Portal Picker</h2>
                  <div className={styles.portalPicker}>
                    <button type="button" className={styles.portalNav} onClick={goPrevStyle}><FontAwesomeIcon icon={faChevronLeft} /></button>
                    <div className={styles.portalCenter}>
                      <div className={styles.portalMain}>{currentScene.label}</div>
                      <p>{currentScene.desc}</p>
                      <em>{currentScene.vibeLine}</em>
                    </div>
                    <button type="button" className={styles.portalNav} onClick={goNextStyle}><FontAwesomeIcon icon={faChevronRight} /></button>
                  </div>

                  <div className={styles.portalPeekRow}>
                    <span>{sceneOptions[(sceneIndex - 1 + sceneOptions.length) % sceneOptions.length].label}</span>
                    <span>{sceneOptions[(sceneIndex + 1) % sceneOptions.length].label}</span>
                  </div>

                  <button type="button" className={styles.ghostBtn} onClick={randomStyle}>
                    <FontAwesomeIcon icon={faDice} /> Random vibe
                  </button>

                  <button type="button" className={styles.primaryCta} onClick={() => setPhase('wish')}>
                    Lock this World
                  </button>
                </div>
              )}

              {phase === 'wish' && (
                <div className={styles.block}>
                  <h2><FontAwesomeIcon icon={faBookOpen} /> Place Your Artifact</h2>
                  <div className={`${styles.artifactInput} ${styles[`artifact${scene[0].toUpperCase()}${scene.slice(1)}`]}`}>
                    <textarea
                      className={styles.problemInput}
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="Write what’s weighing on you. The table will listen."
                      rows={7}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.primaryCta}
                    disabled={isGenerating || !problem.trim() || selectedMentors.length === 0}
                    onClick={handleGenerate}
                  >
                    <FontAwesomeIcon icon={faLightbulb} /> {isGenerating ? 'Opening portal...' : currentScene.cta}
                  </button>
                </div>
              )}

              {phase === 'session' && (
                <div className={styles.disclaimer}>
                  <div className={styles.disclaimerLine}><FontAwesomeIcon icon={faCircleInfo} /> {result?.meta.disclaimer || 'Session in progress.'}</div>
                  <div className={styles.sourceTag}>Source: {result?.meta.source === 'llm' ? 'LLM API' : 'Local Fallback'}</div>
                  {debugHintText && <div className={styles.debugHint}>Fallback reason: {debugHintText}</div>}
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
                  <div className={styles.userLabel}>You · Front row</div>
                  <p className={styles.userPrompt}>{problem.trim() || 'Place your concern artifact on the table.'}</p>
                </div>

                {selectedMentors.map((mentor: MentorProfile, index: number) => {
                  const person = selectedPeople[index];
                  const displayName = person?.name || mentor.displayName;
                  const reply = getReplyByMentorName(displayName) || getReplyByMentorName(mentor.displayName);
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
                      <button
                        type="button"
                        className={`${styles.namePlate} ${isSpeaker ? styles.namePlateActive : ''}`}
                        onClick={() => setFlippedCards((prev) => ({ ...prev, [displayName]: !prev[displayName] }))}
                      >
                        {flipped ? `${displayName} · ${vibeTags[index % vibeTags.length]}` : displayName}
                      </button>
                      <button type="button" className={`${styles.mentorAvatar} ${isSpeaker ? styles.mentorAvatarActive : ''}`}>
                        <img src={findImage(displayName)} alt={displayName} />
                      </button>
                      <div className={styles.seatProp}>{marker}</div>
                      {phase !== 'session' && reply && (
                        <div className={`${styles.suggestionCard} ${styleClassForCard(scene)}`}>
                          <h3>{displayName}</h3>
                          <p>{reply.likelyResponse}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {phase === 'session' && (
                <div className={styles.sessionLayer}>
                  {sessionMode === 'booting' && (
                    <div className={styles.bootSequence}>
                      <div className={styles.sessionBell}><FontAwesomeIcon icon={faBell} /></div>
                      <div className={styles.bootLine}>The table is listening.</div>
                      <div className={styles.bootSteps}>
                        <span>cloth pattern appears</span>
                        <span>ambient particles activate</span>
                        <span>guest cards glow</span>
                      </div>
                    </div>
                  )}

                  {sessionMode === 'live' && (
                    <div
                      ref={conversationPanelRef}
                      className={styles.conversationPanel}
                      onMouseEnter={() => setIsConversationHovered(true)}
                      onMouseLeave={() => setIsConversationHovered(false)}
                    >
                      <div className={styles.conversationHint}>Hover to pause and read carefully.</div>
                      <div className={styles.conversationRowRight}>
                        <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                          <header>You</header>
                          <p>{problem.trim() || '...'}</p>
                        </article>
                      </div>

                      {visibleReplies.map((reply) => {
                        const mentorName = resolveMentorName(reply.mentorName);
                        const notes = noteReplies[mentorName] || [];
                        return (
                          <div key={`${mentorName}-${reply.mentorId}`} className={styles.conversationRowLeft}>
                            <article className={`${styles.conversationBubble} ${styles.conversationLeftBubble} ${styleClassForCard(scene)}`}>
                              <header>{mentorName}</header>
                              <p>{reply.likelyResponse}</p>
                              <footer>Next move: {reply.oneActionStep}</footer>
                              <button
                                type="button"
                                className={styles.passNoteBtn}
                                onClick={() => setOpenNoteFor((prev) => (prev === mentorName ? '' : mentorName))}
                              >
                                Pass a note to {mentorName}
                              </button>
                              {openNoteFor === mentorName && (
                                <div className={styles.inlineNoteBox}>
                                  <textarea
                                    value={noteDrafts[mentorName] || ''}
                                    onChange={(e) =>
                                      setNoteDrafts((prev) => ({ ...prev, [mentorName]: e.target.value }))
                                    }
                                    placeholder={`Reply to ${mentorName}...`}
                                    rows={2}
                                  />
                                  <div className={styles.inlineNoteActions}>
                                    <button
                                      type="button"
                                      className={styles.ghostBtn}
                                      onClick={() => {
                                        const text = (noteDrafts[mentorName] || '').trim();
                                        if (!text) return;
                                        const mentorReply = generateMentorFollowup(mentorName, text);
                                        setNoteReplies((prev) => ({
                                          ...prev,
                                          [mentorName]: [
                                            ...(prev[mentorName] || []),
                                            { role: 'user', text },
                                            { role: 'mentor', text: mentorReply }
                                          ]
                                        }));
                                        setNoteDrafts((prev) => ({ ...prev, [mentorName]: '' }));
                                        scrollConversationToBottom();
                                      }}
                                    >
                                      Send
                                    </button>
                                  </div>
                                </div>
                              )}
                              {notes.map((note, idx) => (
                                <div key={`${mentorName}-note-${idx}`} className={styles.noteThread}>
                                  {note.role === 'user' ? `You: ${note.text}` : `${mentorName}: ${note.text}`}
                                </div>
                              ))}
                            </article>
                          </div>
                        );
                      })}

                      {!sessionComplete && pendingMentorName && (
                        <div className={styles.conversationRowLeft}>
                          <article className={`${styles.conversationBubble} ${styles.conversationLoading}`}>
                            <header>{pendingMentorName}</header>
                            <p>typing...</p>
                          </article>
                        </div>
                      )}

                      {sessionComplete && (
                        <div className={styles.groupActions}>
                          <button
                            type="button"
                            className={styles.secondaryCta}
                            onClick={() => setShowGroupSolve((v) => !v)}
                          >
                            {showGroupSolve ? 'Hide group solve' : 'Group solve together'}
                          </button>
                        </div>
                      )}

                      {sessionComplete && showGroupSolve && (
                        <div className={styles.conversationRowLeft}>
                          <article className={`${styles.conversationBubble} ${styles.groupSolveCard}`}>
                            <header>All mentors · Joint strategy</header>
                            <p>{groupSolveText}</p>
                          </article>
                        </div>
                      )}

                      {sessionComplete && (
                        <div className={styles.conversationRowRight}>
                          <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                            <header>You · Reply to all mentors</header>
                            <textarea
                              value={replyAllDraft}
                              onChange={(e) => setReplyAllDraft(e.target.value)}
                              placeholder="Reply to all..."
                              rows={2}
                            />
                            <div className={styles.inlineNoteActions}>
                              <button
                                type="button"
                                className={styles.ghostBtn}
                                onClick={() => {
                                  const text = replyAllDraft.trim();
                                  if (!text) return;
                                  const replies = selectedMentors.map((mentor) => ({
                                    mentorName: mentor.displayName,
                                    text: generateMentorFollowup(mentor.displayName, text)
                                  }));
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
                                }}
                              >
                                Send to all
                              </button>
                            </div>
                          </article>
                        </div>
                      )}

                      {conversationTurns.map((turn) => (
                        <div key={turn.id} className={styles.turnGroup}>
                          <div className={styles.conversationRowRight}>
                            <article className={`${styles.conversationBubble} ${styles.conversationRightBubble}`}>
                              <header>You</header>
                              <p>{turn.user}</p>
                            </article>
                          </div>
                          {turn.replies.map((reply, idx) => (
                            <div key={`${turn.id}-${reply.mentorName}-${idx}`} className={styles.conversationRowLeft}>
                              <article className={`${styles.conversationBubble} ${styles.conversationLeftBubble} ${styleClassForCard(scene)}`}>
                                <header>{reply.mentorName}</header>
                                <p>{reply.text}</p>
                              </article>
                            </div>
                          ))}
                        </div>
                      ))}

                      {sessionComplete && !showSessionWrap && (
                        <div className={styles.conversationRowRight}>
                          <button type="button" className={styles.secondaryCta} onClick={() => setShowSessionWrap(true)}>
                            Show session wrap
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {sessionComplete && showSessionWrap && (
                    <div className={styles.sessionWrap}>
                      <h3>Session complete.</h3>
                      <p>Tonight’s takeaway</p>
                      <ul>
                        {(result?.mentorReplies || []).slice(0, 3).map((reply) => (
                          <li key={reply.mentorName}>{reply.oneActionStep}</li>
                        ))}
                      </ul>
                      <div className={styles.wrapActions}>
                        <button type="button" className={styles.secondaryCta} onClick={saveTakeawayMemory}>Save</button>
                        <button
                          type="button"
                          className={styles.secondaryCta}
                          onClick={() => {
                            setResult(null);
                            setPhase('invite');
                            setSessionMode('idle');
                            setConversationTurns([]);
                            setReplyAllDraft('');
                          }}
                        >
                          Start a new table
                        </button>
                      </div>
                    </div>
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

        <button type="button" className={styles.memoryFab} onClick={() => setMemoryDrawerOpen((v) => !v)}>
          <FontAwesomeIcon icon={faCamera} /> Memories ({memories.length})
        </button>

        {memoryDrawerOpen && (
          <div className={styles.memoryDrawer}>
            <h3>Memory Drawer</h3>
            {memories.length === 0 && <p className={styles.emptyMemory}>No saved memories yet.</p>}
            {memories.map((memory) => (
              <article key={memory.id} className={styles.memoryCard}>
                <header>{memory.title}</header>
                <small>{memory.createdAt} · {memory.style}</small>
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
              <h3>{onboardingSlides[currentSlide].title}</h3>
              <p>{onboardingSlides[currentSlide].body}</p>
              <div className={styles.slideDots}>
                {onboardingSlides.map((_, idx) => (
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
                  Back
                </button>
                {currentSlide < onboardingSlides.length - 1 ? (
                  <button
                    type="button"
                    className={styles.onboardingBtnPrimary}
                    onClick={() => setCurrentSlide((s) => Math.min(onboardingSlides.length - 1, s + 1))}
                  >
                    Next
                  </button>
                ) : (
                  <button type="button" className={styles.onboardingBtnPrimary} onClick={finishOnboarding}>
                    Get Started
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
