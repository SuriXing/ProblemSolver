import '../../test/mocks/i18n';

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { TranslationProvider, useTranslationContext } from '../TranslationContext';

// Mock environmentLabel utility
vi.mock('../../utils/environmentLabel', () => ({
  withLocalSuffix: vi.fn((label: string) => label),
}));

beforeEach(() => {
  localStorage.clear();
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider>{children}</TranslationProvider>
);

describe('TranslationProvider', () => {
  it('renders children', () => {
    render(
      <TranslationProvider>
        <div data-testid="child">Hello</div>
      </TranslationProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('reads language from localStorage on mount', () => {
    localStorage.setItem('language', 'ja');
    const { result } = renderHook(() => useTranslationContext(), { wrapper });
    // The provider should have attempted to change language
    expect(result.current.getCurrentLanguage()).toBe('ja');
  });

  it('ignores invalid language in localStorage on mount', () => {
    localStorage.setItem('language', 'invalid-lang');
    const { result } = renderHook(() => useTranslationContext(), { wrapper });
    expect(result.current.getCurrentLanguage()).toBe('zh-CN');
  });
});

describe('useTranslationContext', () => {
  it('throws when used outside TranslationProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTranslationContext())).toThrow(
      'useTranslationContext must be used within a TranslationProvider'
    );
    spy.mockRestore();
  });

  describe('getCurrentLanguage', () => {
    it('returns zh-CN when localStorage is empty', () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper });
      expect(result.current.getCurrentLanguage()).toBe('zh-CN');
    });

    it('returns stored language when valid', () => {
      localStorage.setItem('language', 'en');
      const { result } = renderHook(() => useTranslationContext(), { wrapper });
      expect(result.current.getCurrentLanguage()).toBe('en');
    });

    it('returns zh-CN for unsupported language', () => {
      localStorage.setItem('language', 'fr');
      const { result } = renderHook(() => useTranslationContext(), { wrapper });
      expect(result.current.getCurrentLanguage()).toBe('zh-CN');
    });

    it.each(['zh-CN', 'en', 'ja', 'ko', 'es'] as const)(
      'recognizes %s as a supported language',
      (lang) => {
        localStorage.setItem('language', lang);
        const { result } = renderHook(() => useTranslationContext(), { wrapper });
        expect(result.current.getCurrentLanguage()).toBe(lang);
      }
    );
  });

  describe('changeLanguage', () => {
    it('saves language to localStorage', async () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper });

      await act(async () => {
        await result.current.changeLanguage('ko');
      });

      expect(localStorage.getItem('language')).toBe('ko');
    });

    it('sets document.documentElement.lang', async () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper });

      await act(async () => {
        await result.current.changeLanguage('ja');
      });

      expect(document.documentElement.lang).toBe('ja');
    });

    it('updates document title', async () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper });

      await act(async () => {
        await result.current.changeLanguage('en');
      });

      // Title should be set (withLocalSuffix is mocked to return input as-is)
      // i18n.t('siteName') returns 'siteName' from mock
      expect(document.title).toBe('siteName');
    });

    it('updates meta description when element exists', async () => {
      // Add meta description element
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      meta.setAttribute('content', 'old');
      document.head.appendChild(meta);

      const { result } = renderHook(() => useTranslationContext(), { wrapper });

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(meta.getAttribute('content')).toBe('siteDescription');

      // Cleanup
      document.head.removeChild(meta);
    });
  });

  describe('currentLanguage', () => {
    it('exposes i18n.language', () => {
      const { result } = renderHook(() => useTranslationContext(), { wrapper });
      // From mock, i18n.language is 'en'
      expect(result.current.currentLanguage).toBe('en');
    });
  });
});
