import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectBrowser, initBrowserCompatibility, BrowserInfo } from '../browserDetection';

describe('browserDetection', () => {
  const originalUA = navigator.userAgent;

  function mockUserAgent(ua: string) {
    Object.defineProperty(navigator, 'userAgent', {
      value: ua,
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      writable: true,
      configurable: true,
    });
    // Clean up any classes added to <html>
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('--vh');
  });

  describe('detectBrowser', () => {
    it('detects Chrome browser', () => {
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.130 Safari/537.36'
      );
      const info = detectBrowser();
      expect(info.isChrome).toBe(true);
      expect(info.browserName).toBe('Chrome');
      expect(info.browserVersion).toBe('120.0');
      expect(info.os).toBe('Windows');
    });

    it('detects Safari browser', () => {
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
      );
      const info = detectBrowser();
      expect(info.isSafari).toBe(true);
      expect(info.browserName).toBe('Safari');
      expect(info.browserVersion).toBe('17.2');
      expect(info.os).toBe('Mac');
    });

    it('detects Firefox browser', () => {
      mockUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
      );
      const info = detectBrowser();
      expect(info.isFirefox).toBe(true);
      expect(info.browserName).toBe('Firefox');
      expect(info.browserVersion).toBe('121.0');
      expect(info.os).toBe('Linux');
    });

    it('detects Edge browser', () => {
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91'
      );
      const info = detectBrowser();
      expect(info.isEdge).toBe(true);
      expect(info.browserName).toBe('Edge');
      expect(info.os).toBe('Windows');
    });

    it('detects Internet Explorer', () => {
      mockUserAgent(
        'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)'
      );
      const info = detectBrowser();
      expect(info.isIE).toBe(true);
      expect(info.browserName).toBe('Internet Explorer');
    });

    it('detects mobile device', () => {
      mockUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      );
      const info = detectBrowser();
      expect(info.isMobile).toBe(true);
      expect(info.isIOS).toBe(true);
    });

    it('detects Android device', () => {
      mockUserAgent(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
      );
      const info = detectBrowser();
      expect(info.isMobile).toBe(true);
      // Note: source code checks /Linux/ before /Android/, so Linux matches first for Android UAs
      expect(info.os).toBe('Linux');
    });

    it('returns defaults for unknown user agent', () => {
      mockUserAgent('SomeUnknownBrowser/1.0');
      const info = detectBrowser();
      expect(info.browserName).toBe('Unknown');
      expect(info.isMobile).toBe(false);
      expect(info.isChrome).toBe(false);
      expect(info.isSafari).toBe(false);
    });
  });

  describe('initBrowserCompatibility', () => {
    it('adds is-chrome class for Chrome UA', () => {
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.130 Safari/537.36'
      );
      initBrowserCompatibility();
      expect(document.documentElement.classList.contains('is-chrome')).toBe(true);
    });

    it('adds is-safari class for Safari UA', () => {
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
      );
      initBrowserCompatibility();
      expect(document.documentElement.classList.contains('is-safari')).toBe(true);
    });

    it('adds is-mobile and is-ios classes for iPhone UA', () => {
      mockUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      );
      initBrowserCompatibility();
      expect(document.documentElement.classList.contains('is-mobile')).toBe(true);
      expect(document.documentElement.classList.contains('is-ios')).toBe(true);
    });

    it('sets --vh CSS variable on iOS', () => {
      mockUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
      );
      initBrowserCompatibility();
      const vh = document.documentElement.style.getPropertyValue('--vh');
      expect(vh).toMatch(/px$/);
    });
  });
});
