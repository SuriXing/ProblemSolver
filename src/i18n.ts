import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import zhCNTranslation from './locales/zh-CN/translation.json';
import jaTranslation from './locales/ja/translation.json';
import koTranslation from './locales/ko/translation.json';
import esTranslation from './locales/es/translation.json';

// Function to safely get the saved language or default to zh-CN
const getSavedLanguage = (): string => {
  try {
    const storedLanguage = localStorage.getItem('language');
    return storedLanguage || 'zh-CN';
  } catch (error) {
    console.error('Error getting language from localStorage:', error);
    return 'zh-CN';
  }
};

i18n
  .use(Backend as any)
  .use(LanguageDetector as any)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      'zh-CN': {
        translation: zhCNTranslation
      },
      ja: {
        translation: jaTranslation
      },
      ko: {
        translation: koTranslation
      },
      es: {
        translation: esTranslation
      }
    },
    fallbackLng: 'zh-CN',
    debug: true,
    load: 'all',
    preload: ['en', 'zh-CN', 'ja', 'ko', 'es'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: (key) => {
      console.warn(`Missing translation key: ${key}`);
      return key;
    }
  });

// Add legacy compatibility for old code
if (typeof window !== 'undefined') {
  window.currentLanguage = getSavedLanguage();
  window.i18n = {
    init: () => {
      console.log('Legacy i18n initialized');
    },
    changeLanguage: (lang: string) => {
      i18n.changeLanguage(lang);
      localStorage.setItem('language', lang);
      window.currentLanguage = lang;
    },
    translatePage: () => {
      console.log('Legacy translatePage called, no action needed in React implementation');
    },
    t: (key: string) => {
      return i18n.t(key);
    },
    currentLanguage: getSavedLanguage()
  };
}

declare global {
  interface Window {
    currentLanguage: string;
    i18n: {
      init: () => void;
      changeLanguage: (lang: string) => void;
      translatePage: () => void;
      t: (key: string) => string;
      currentLanguage: string;
    };
  }
}

export default i18n;