import 'react-i18next';
import { TOptions } from 'i18next';
import type { TranslationKey } from './types/i18n.types';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Record<TranslationKey, string>;
    };
  }

  // Override the TFunction to ensure it always returns a string
  export interface TFunction {
    // `string & {}` is the documented trick to keep literal-type autocomplete on a union with `string`.
    (key: TranslationKey | (string & {}), options?: TOptions): string;
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