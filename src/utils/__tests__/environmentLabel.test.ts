import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isLocalRuntime, withLocalSuffix } from '../environmentLabel';

describe('environmentLabel', () => {
  const originalLocation = window.location;

  function mockHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname },
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('isLocalRuntime', () => {
    it('returns true for localhost', () => {
      mockHostname('localhost');
      expect(isLocalRuntime()).toBe(true);
    });

    it('returns true for 127.0.0.1', () => {
      mockHostname('127.0.0.1');
      expect(isLocalRuntime()).toBe(true);
    });

    it('returns true for 0.0.0.0', () => {
      mockHostname('0.0.0.0');
      expect(isLocalRuntime()).toBe(true);
    });

    it('returns false for production hostname', () => {
      mockHostname('example.com');
      expect(isLocalRuntime()).toBe(false);
    });

    it('returns false for subdomain of localhost', () => {
      mockHostname('app.localhost');
      expect(isLocalRuntime()).toBe(false);
    });
  });

  describe('withLocalSuffix', () => {
    it('appends " - local" on localhost', () => {
      mockHostname('localhost');
      expect(withLocalSuffix('My App')).toBe('My App - local');
    });

    it('returns label unchanged on production hostname', () => {
      mockHostname('example.com');
      expect(withLocalSuffix('My App')).toBe('My App');
    });

    it('handles empty label on localhost', () => {
      mockHostname('localhost');
      expect(withLocalSuffix('')).toBe(' - local');
    });
  });
});
