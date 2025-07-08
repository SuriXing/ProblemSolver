declare module 'i18next-http-backend' {
  import { BackendModule, Services, ReadCallback } from 'i18next';
  
  export default class Backend implements BackendModule {
    constructor(services?: Services, options?: any);
    type: string;
    init(services: Services, options?: any): void;
    read(language: string, namespace: string, callback: ReadCallback): void;
    create(languages: string[], namespace: string, key: string, fallbackValue: string): void;
  }
} 