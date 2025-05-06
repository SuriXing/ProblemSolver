import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

import enTranslation from './locales/en/translation.json';
import zhCNTranslation from './locales/zh-CN/translation.json';
import jaTranslation from './locales/ja/translation.json';
import koTranslation from './locales/ko/translation.json';
import esTranslation from './locales/es/translation.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
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
    fallbackLng: 'en',
    debug: true, // Temporarily enable debug to see what's happening
    interpolation: {
      escapeValue: false
    },
    parseMissingKeyHandler: (key) => {
      console.warn(`Missing translation key: ${key}`);
      return key;
    },
    react: {
      useSuspense: false
    }
  });

// Force reload resources
Object.entries({
  en: enTranslation,
  'zh-CN': zhCNTranslation,
  ja: jaTranslation,
  ko: koTranslation,
  es: esTranslation
}).forEach(([lang, translation]) => {
  i18n.addResourceBundle(lang, 'translation', translation, true, true);
});

export default i18n;