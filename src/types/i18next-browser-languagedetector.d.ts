declare module 'i18next-browser-languagedetector' {
  import { BackendModule, Services } from 'i18next';
  
  export default class LanguageDetector implements BackendModule {
    constructor(services?: Services, options?: any);
    type: string;
    init(services: Services, options?: any): void;
    detect(): string;
    cacheUserLanguage(lng: string): void;
  }
} 