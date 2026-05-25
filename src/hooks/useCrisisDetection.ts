import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CRISIS_KEYWORDS: Record<string, string[]> = {
  en: [
    'hopeless', 'suicide', 'kill myself', 'want to die', 'end it all',
    'worthless', 'no reason to live', 'self harm', 'cut myself', 'hurt myself',
    "don't want to be here", "can't go on", 'ending it', 'no point in living',
    'end my life', 'overdose', 'goodbye forever', 'no point', "i'm a burden",
    'nobody cares',
  ],
  'zh-CN': [
    '想死', '自杀', '不想活', '活不下去', '结束生命', '没有希望',
    '自残', '割腕', '跳楼', '不想活了', '活着没意思', '好累想死',
    '我是累赘',
  ],
  ja: [
    '死にたい', '自殺', '生きたくない', '希望がない',
    '自傷', 'リストカット', '消えたい', 'つらい死にたい', '生きる意味がない',
    'もう無理', '助けて',
  ],
  ko: [
    '죽고싶', '자살', '살고싶지않', '희망이없',
    '자해', '살기싫다', '죽을래', '힘들어죽겠', '사라지고싶',
  ],
  es: [
    'suicidio', 'quiero morir', 'sin esperanza', 'no vale la pena',
    'autolesión', 'cortarme', 'no quiero vivir', 'acabar con todo',
    'me quiero morir', 'no puedo más',
  ],
};

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Scan ALL language keyword lists regardless of current locale.
 * A Chinese user on an English UI typing "想死" must still trigger.
 */
function detectCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keywords of Object.values(CRISIS_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return true;
  }
  return false;
}

export function useCrisisDetection() {
  const { i18n: _i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const lastTriggeredRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkText = useCallback(
    (text: string) => {
      const now = Date.now();
      // Cooldown: allow re-trigger after 10 minutes
      if (lastTriggeredRef.current > 0 && now - lastTriggeredRef.current < COOLDOWN_MS) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const nowInner = Date.now();
        if (lastTriggeredRef.current > 0 && nowInner - lastTriggeredRef.current < COOLDOWN_MS) return;
        if (detectCrisisKeywords(text)) {
          lastTriggeredRef.current = nowInner;
          setShowModal(true);
        }
      }, 500);
    },
    [],
  );

  const dismiss = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { showModal, dismiss, checkText };
}
