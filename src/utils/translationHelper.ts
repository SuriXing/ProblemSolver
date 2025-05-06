import { useTranslation } from 'react-i18next';
import i18next, { TFunction, TOptions } from 'i18next';

/**
 * A helper function to properly type translations with parameter support
 */
export const useTypeSafeTranslation = () => {
  const { t, i18n } = useTranslation();
  
  const typeSafeT = (key: string, options?: TOptions): string => {
    try {
      // First try the current language
      const translation = t(key, { ...options, defaultValue: '' });
      if (translation && translation !== key) {
        return translation;
      }

      // If no translation found, try fallback languages
      const fallbackLanguages = ['zh-CN', 'en'];
      for (const lang of fallbackLanguages) {
        const fallbackT = i18next.getFixedT(lang);
        const fallbackTranslation = fallbackT(key, { ...options, defaultValue: '' });
        if (fallbackTranslation && fallbackTranslation !== key) {
          return fallbackTranslation;
        }
      }

      // If still no translation found, return the key and log a warning
      console.warn(`Translation key missing: ${key}, in language: ${i18n.language}`);
      return key;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  };
  
  return { t: typeSafeT, i18n };
};

/**
 * Get current language from localStorage or default to zh-CN
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('language') || 'zh-CN';
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

    // If no translation found, try fallback languages
    const fallbackLanguages = ['zh-CN', 'en'];
    for (const lang of fallbackLanguages) {
      const fallbackT = i18next.getFixedT(lang);
      const fallbackTranslation = fallbackT(key, { ...options, defaultValue: '' });
      if (fallbackTranslation && fallbackTranslation !== key) {
        return fallbackTranslation;
      }
    }

    // If still no translation found, return the key
    return key;
  } catch (e) {
    console.error(`Translation error for key: ${key}`, e);
    return key;
  }
}

// A simpler method to just get a translation
export const getTranslation = (key: string, fallback: string = ''): string => {
  try {
    // First try current language
    const translation = i18next.t(key, { defaultValue: '' });
    if (translation && translation !== key) {
      return translation;
    }

    // If no translation found, try fallback languages
    const fallbackLanguages = ['zh-CN', 'en'];
    for (const lang of fallbackLanguages) {
      const fallbackT = i18next.getFixedT(lang);
      const fallbackTranslation = fallbackT(key, { defaultValue: '' });
      if (fallbackTranslation && fallbackTranslation !== key) {
        return fallbackTranslation;
      }
    }

    // If still no translation found, return the fallback
    return fallback || key;
  } catch (e) {
    return fallback || key;
  }
};
