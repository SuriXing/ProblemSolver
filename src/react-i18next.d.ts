import 'react-i18next';
import { TOptions } from 'i18next';

// Extend the existing module declarations
declare module 'react-i18next' {
  // Extend the t function to allow options
  export interface TFunction {
    (key: string, options?: TOptions): string;
  }

  // Extend the hook response
  export interface UseTranslationResponse {
    t: TFunction;
    i18n: {
      changeLanguage: (lng: string) => Promise<TFunction>;
      language: string;
    };
  }
} 