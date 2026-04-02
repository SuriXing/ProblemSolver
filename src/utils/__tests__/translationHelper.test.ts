import '../../test/mocks/i18n';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentLanguage, translate, getTranslation, getSiteName } from '../translationHelper';

describe('translationHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getCurrentLanguage', () => {
    it('returns saved language from localStorage', () => {
      localStorage.setItem('language', 'ja');
      expect(getCurrentLanguage()).toBe('ja');
    });

    it('returns zh-CN for Chinese browser language', () => {
      localStorage.removeItem('language');
      Object.defineProperty(navigator, 'language', { value: 'zh-TW', configurable: true });
      expect(getCurrentLanguage()).toBe('zh-CN');
    });

    it('returns en for English browser language', () => {
      localStorage.removeItem('language');
      Object.defineProperty(navigator, 'language', { value: 'en', configurable: true });
      expect(getCurrentLanguage()).toBe('en');
    });

    it('returns ko for Korean browser language', () => {
      localStorage.removeItem('language');
      Object.defineProperty(navigator, 'language', { value: 'ko', configurable: true });
      expect(getCurrentLanguage()).toBe('ko');
    });

    it('returns zh-CN as default for unsupported language', () => {
      localStorage.removeItem('language');
      Object.defineProperty(navigator, 'language', { value: 'fr', configurable: true });
      expect(getCurrentLanguage()).toBe('zh-CN');
    });

    it('ignores invalid language in localStorage', () => {
      localStorage.setItem('language', 'invalid-lang');
      Object.defineProperty(navigator, 'language', { value: 'en', configurable: true });
      expect(getCurrentLanguage()).toBe('en');
    });

    it('returns es for Spanish browser language', () => {
      localStorage.removeItem('language');
      Object.defineProperty(navigator, 'language', { value: 'es', configurable: true });
      expect(getCurrentLanguage()).toBe('es');
    });
  });

  describe('translate', () => {
    it('returns the exact key string when no translation found', () => {
      // Our i18n mock returns the key itself when no defaultValue is set
      expect(translate('someKey')).toBe('someKey');
    });

    it('returns the exact namespaced key string', () => {
      expect(translate('my.nested.key')).toBe('my.nested.key');
    });

    it('does not throw on error paths', () => {
      expect(() => translate('any.key')).not.toThrow();
    });
  });

  describe('getTranslation', () => {
    it('returns fallback when translate returns the key itself', () => {
      // The mock t() returns the key, so translate('myKey') === 'myKey'
      // getTranslation checks translation === key → returns fallback
      const result = getTranslation('myKey', 'My Fallback');
      expect(result).toBe('My Fallback');
    });

    it('returns the key when no fallback provided and no translation', () => {
      // translate returns 'missingKey', which equals key, fallback is ''
      const result = getTranslation('missingKey');
      expect(result).toBe('');
    });
  });

  describe('getSiteName', () => {
    it('returns the site name translation', () => {
      const mockI18n = {
        t: vi.fn((key: string, defaultVal: string) => defaultVal),
      } as any;
      const result = getSiteName(mockI18n);
      expect(result).toBe('Anon cafe');
    });
  });
});
