import { useTranslation } from 'react-i18next';
import i18next, { TOptions } from 'i18next';

// Define a fixed type for the t function that explicitly supports options
type TypedTranslateFunction = (key: string, options?: TOptions) => string;

/**
 * A helper function to properly type translations with parameter support
 */
export function useTypeSafeTranslation() {
  const { t, i18n } = useTranslation();
  
  // Create a properly typed wrapper function
  const typeSafeT: TypedTranslateFunction = (key, options) => {
    // @ts-ignore - Ignoring type error as we know this works at runtime
    return t(key, options);
  };
  
  return { t: typeSafeT, i18n };
}

/**
 * Get current language from localStorage
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('language') || 'zh-CN';
}

/**
 * Direct translate function for non-hook contexts
 */
export function translate(key: string, options?: TOptions): string {
  // @ts-ignore - Ignoring type error as we know this works at runtime
  return i18next.t(key, options);
}
