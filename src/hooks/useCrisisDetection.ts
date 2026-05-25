import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CRISIS_KEYWORDS: Record<string, string[]> = {
  en: ['hopeless', 'suicide', 'kill myself', 'want to die', 'end it all', 'worthless', 'no reason to live'],
  'zh-CN': ['想死', '自杀', '不想活', '活不下去', '结束生命', '没有希望'],
  ja: ['死にたい', '自殺', '生きたくない', '希望がない'],
  ko: ['죽고싶', '자살', '살고싶지않', '희망이없'],
  es: ['suicidio', 'quiero morir', 'sin esperanza', 'no vale la pena'],
};

function detectCrisisKeywords(text: string, lang: string): boolean {
  const lower = text.toLowerCase();
  const langsToCheck = lang === 'en' ? ['en'] : [lang, 'en'];
  for (const l of langsToCheck) {
    const keywords = CRISIS_KEYWORDS[l];
    if (keywords?.some((kw) => lower.includes(kw.toLowerCase()))) return true;
  }
  return false;
}

export function useCrisisDetection() {
  const { i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const triggeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkText = useCallback(
    (text: string) => {
      if (triggeredRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!triggeredRef.current && detectCrisisKeywords(text, i18n.language)) {
          triggeredRef.current = true;
          setShowModal(true);
        }
      }, 500);
    },
    [i18n.language],
  );

  const dismiss = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { showModal, dismiss, checkText };
}
