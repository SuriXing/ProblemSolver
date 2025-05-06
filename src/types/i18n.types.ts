export type SupportedLanguages = 'zh-CN' | 'en' | 'ja' | 'ko' | 'es';

export interface I18nResources {
  translation: {
    [key: string]: string | I18nResources;
  };
}

export interface TranslationOptions {
  lng?: SupportedLanguages;
  ns?: string;
  fallbackLng?: SupportedLanguages[];
  debug?: boolean;
  interpolation?: {
    escapeValue: boolean;
  };
  react?: {
    useSuspense: boolean;
  };
}

export interface TranslationContext {
  changeLanguage: (lang: SupportedLanguages) => Promise<void>;
  getCurrentLanguage: () => SupportedLanguages;
  currentLanguage: string;
}

// 定义翻译键的类型，用于类型安全的翻译
export type TranslationKey =
  | 'siteName'
  | 'siteDescription'
  | 'homeTitle'
  | 'homeSubtitle'
  | 'debug'
  | 'debugMenu'
  | 'systemSettings'
  | 'translationSettings'
  | 'environmentOptions'
  | 'showSupabaseTest'
  | 'useDirectClient'
  | 'accessCodeTesting'
  | 'enterAccessCode'
  | 'test'
  | 'generate'
  | 'showEnvDebug'
  | 'showEnvironmentVariables'
  | 'showTranslationDebug'
  | 'currentLanguage'
  | 'translationKeys'
  | 'hideAccessCodeTest'
  | 'showAccessCodeTest'
  | 'foundPost'
  | 'postFoundSuccess'
  | 'errorTestingAccessCode'
  | 'newAccessCodeGenerated'
  | 'errorGeneratingAccessCode'
  | 'pleaseEnterAccessCode'
  | 'id'
  | 'type'
  | 'accessCode'
  | string; // 允许其他未列出的翻译键