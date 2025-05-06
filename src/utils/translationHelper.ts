import { useTranslation } from 'react-i18next';
import i18next, { TOptions } from 'i18next';

/**
 * A helper function to properly type translations with parameter support
 */
export const useTypeSafeTranslation = () => {
  const { t, i18n } = useTranslation();
  
  // Define a fallback handler for missing translations
  const handleMissingKey = (key: string, ns: string) => {
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key itself as fallback
  };
  
  // Create a safer version of t that handles errors and provides fallbacks
  const typeSafeT = (key: string, options?: any) => {
    try {
      const translation = t(key, options);
      if (translation === key) {
        handleMissingKey(key, '');
      }
      return translation;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key; // Return the key itself as fallback
    }
  };
  
  return { t: typeSafeT, i18n };
};

/**
 * Get current language from localStorage
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('language') || 'zh-CN';
}

/**
 * Direct translate function for non-hook contexts
 */
export function translate(key: string, options?: any): string {
  // Use any for options to bypass TypeScript's strict checking
  const translation = i18next.t(key, options as any);
  return String(translation);
}

// A simpler method to just get a translation
export const getTranslation = (key: string, fallback: string = ''): string => {
  try {
    const translation = i18next.t(key);
    return translation === key ? fallback : translation;
  } catch (e) {
    return fallback;
  }
};
