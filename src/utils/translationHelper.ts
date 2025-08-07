import { useTranslation } from 'react-i18next';
import i18next, { TFunction, TOptions } from 'i18next';

const FALLBACK_LANGUAGES = ['zh-CN', 'en'] as const;
type SupportedLanguages = 'zh-CN' | 'en' | 'ja' | 'ko' | 'es';

/**
 * A helper function to properly type translations with parameter support
 */
export const useTypeSafeTranslation = () => {
  const { t, i18n } = useTranslation();
  
  const typeSafeT = (key: string, options?: TOptions): string => {
    try {
      // First try with current language
      const translation = t(key, { ...options, defaultValue: '' });
      if (translation && translation !== key) {
        return translation;
      }

      // Try fallback languages in order
      for (const lang of FALLBACK_LANGUAGES) {
        const fallbackT = i18next.getFixedT(lang);
        const fallbackTranslation = fallbackT(key, { ...options, defaultValue: '' });
        if (fallbackTranslation && fallbackTranslation !== key) {
          return fallbackTranslation;
        }
      }

      // If still no translation found, log warning and return key
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation missing for key "${key}" in language "${i18n.language}" and fallbacks`);
      }
      return key;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  };
  
  return { t: typeSafeT, i18n };
};

/**
 * Get current language from localStorage or navigator
 */
export function getCurrentLanguage(): SupportedLanguages {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && isSupportedLanguage(savedLanguage)) {
    return savedLanguage as SupportedLanguages;
  }

  // Try to detect from browser
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // Map browser language codes to our supported languages
  const languageMap: Record<string, SupportedLanguages> = {
    'ja': 'ja',
    'ko': 'ko',
    'es': 'es',
    'en': 'en'
  };

  return languageMap[browserLang] || 'zh-CN';
}

/**
 * Type guard for supported languages
 */
function isSupportedLanguage(lang: string): lang is SupportedLanguages {
  return ['zh-CN', 'en', 'ja', 'ko', 'es'].includes(lang);
}

/**
 * Direct translate function for non-hook contexts
 */
export function translate(key: string, options?: TOptions): string {
  try {
    // First try current language
    const translation = i18next.t(key, { ...options, defaultValue: '' });
    if (translation && translation !== key) {
      return translation;
    }

    // Try fallback languages in order
    for (const lang of FALLBACK_LANGUAGES) {
      const fallbackT = i18next.getFixedT(lang);
      const fallbackTranslation = fallbackT(key, { ...options, defaultValue: '' });
      if (fallbackTranslation && fallbackTranslation !== key) {
        return fallbackTranslation;
      }
    }

    return key;
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return key;
  }
}

/**
 * Get a translation with fallback
 */
export const getTranslation = (key: string, fallback: string = ''): string => {
  try {
    const translation = translate(key);
    return translation === key ? fallback : translation;
  } catch (error) {
    return fallback || key;
  }
};

/**
 * Get a translation for the site name
 */
export const getSiteName = (i18n: typeof i18next) => {
  return i18n.t('siteName', 'Anon cafe');
};
