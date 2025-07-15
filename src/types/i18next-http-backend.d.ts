declare module 'i18next-http-backend' {
  import { BackendModule, Services } from 'i18next';

  export default class HttpBackend implements BackendModule {
    constructor(services: Services, options?: object);
    type: string;
    init(services: Services, options?: object): void;
    read(language: string, namespace: string, callback: (errorValue: unknown, translations: unknown | null) => void): void;
    create(languages: string[], namespace: string, key: string, fallbackValue: string): void;
  }
}