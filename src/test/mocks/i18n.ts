import { vi } from 'vitest';

// Mock i18next - returns the key as-is for testability
vi.mock('i18next', () => {
  const t = vi.fn((key: string, opts?: any) => {
    if (opts?.defaultValue) return opts.defaultValue;
    return key;
  });
  const getFixedT = vi.fn(() => t);
  const instance = {
    t,
    getFixedT,
    language: 'en',
    changeLanguage: vi.fn().mockResolvedValue(undefined),
    addResourceBundle: vi.fn(),
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockReturnThis(),
    on: vi.fn(),
    off: vi.fn(),
    exists: vi.fn().mockReturnValue(true),
  };
  return { default: instance, ...instance };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      reloadResources: vi.fn().mockResolvedValue(undefined),
      t: (key: string, opts?: any) => opts?.defaultValue || key,
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: any) => children,
}));

// Mock the i18n setup module
vi.mock('../../i18n', () => ({ default: {} }));
