import '../../test/mocks/i18n';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the locale JSON files
vi.mock('../../locales/en/translation.json', () => ({ default: { hello: 'Hello' } }));
vi.mock('../../locales/zh-CN/translation.json', () => ({ default: { hello: '你好' } }));

import { reloadTranslations } from '../i18nReload';
import i18n from 'i18next';

describe('i18nReload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reloadTranslations', () => {
    it('calls addResourceBundle for en and zh-CN', () => {
      reloadTranslations();
      expect(i18n.addResourceBundle).toHaveBeenCalledTimes(2);
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'en', 'translation', expect.anything(), true, true
      );
      expect(i18n.addResourceBundle).toHaveBeenCalledWith(
        'zh-CN', 'translation', expect.anything(), true, true
      );
    });

    it('calls changeLanguage with the current language', () => {
      reloadTranslations();
      expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('logs reload messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      reloadTranslations();
      expect(consoleSpy).toHaveBeenCalledWith('Reloading translations...');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Translation reload complete, current language:', 'en'
      );
      consoleSpy.mockRestore();
    });
  });
});
