import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getCurrentLanguage } from './utils/translationHelper';
import type { InitOptions, Module } from 'i18next';

import enTranslation from './locales/en/translation.json';
import zhCNTranslation from './locales/zh-CN/translation.json';
import jaTranslation from './locales/ja/translation.json';
import koTranslation from './locales/ko/translation.json';
import esTranslation from './locales/es/translation.json';

const backendOptions = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.missing.json'
};

const detectorOptions = {
  order: ['localStorage', 'navigator'],
  lookupLocalStorage: 'language'
};

// 为模块添加必要的类型定义
const typedHttpBackend = HttpBackend as unknown as Module;
const typedLanguageDetector = LanguageDetector as unknown as Module;

const i18nInstance = i18n
  .use(typedHttpBackend)
  .use(typedLanguageDetector)
  .use(initReactI18next);

const options: InitOptions = {
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
  lng: getCurrentLanguage(),
  fallbackLng: ['zh-CN', 'en'],
  load: 'currentOnly',
  
  interpolation: {
    escapeValue: false
  },

  detection: detectorOptions,

  backend: backendOptions,

  react: {
    useSuspense: false,
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'span']
  },

  debug: process.env.NODE_ENV === 'development'
};

i18nInstance.init(options);

// 监听语言切换事件
i18nInstance.on('languageChanged', (lng: string) => {
  document.documentElement.lang = lng;
  localStorage.setItem('language', lng);
  
  // 更新页面标题和描述
  const siteNameTranslation = i18nInstance.t('siteName');
  document.title = siteNameTranslation;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', i18nInstance.t('siteDescription'));
  }
});

export default i18nInstance;