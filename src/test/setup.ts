import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env for all tests
vi.stubGlobal('import', { meta: { env: { MODE: 'test', DEV: true, PROD: false, SSR: false } } });

// Create a Storage-like mock that behaves as real Web Storage:
// - reserved methods/properties work as expected
// - Object.keys() returns the actual stored keys (enumerable)
function createStorageMock() {
  const store: Record<string, string> = {};
  const api = {
    getItem: vi.fn((key: string) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => { store[key] = String(value); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
  const reserved = new Set(Object.keys(api));
  // Proxy: keys on the proxy reflect the store; method access bypasses to api
  return new Proxy(api as any, {
    get(target, prop: string) {
      if (typeof prop === 'string' && !reserved.has(prop) && Object.prototype.hasOwnProperty.call(store, prop)) {
        return store[prop];
      }
      return (target as any)[prop];
    },
    ownKeys() {
      return Object.keys(store);
    },
    getOwnPropertyDescriptor(_, prop: string) {
      if (Object.prototype.hasOwnProperty.call(store, prop)) {
        return { enumerable: true, configurable: true, writable: true, value: store[prop] };
      }
      return undefined;
    },
    has(_, prop: string) {
      return Object.prototype.hasOwnProperty.call(store, prop) || reserved.has(prop);
    },
  });
}

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});
