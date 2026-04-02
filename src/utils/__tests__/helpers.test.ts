import '../../test/mocks/i18n';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTimeAgo, formatDate, truncateString } from '../helpers';

describe('helpers', () => {
  describe('getTimeAgo', () => {
    it('returns justNow for timestamps less than 60 seconds ago', () => {
      const now = Date.now();
      expect(getTimeAgo(now - 30_000)).toBe('justNow');
    });

    it('returns minutesAgo for timestamps 1-59 minutes ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 5 * 60_000);
      expect(result).toBe('minutesAgo');
    });

    it('returns hoursAgo for timestamps 1-23 hours ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 3 * 3600_000);
      expect(result).toBe('hoursAgo');
    });

    it('returns daysAgo for timestamps 1-6 days ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 3 * 86400_000);
      expect(result).toBe('daysAgo');
    });

    it('returns weeksAgo for timestamps 1-3 weeks ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 14 * 86400_000);
      expect(result).toBe('weeksAgo');
    });

    it('returns monthsAgo for timestamps 1-11 months ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 60 * 86400_000);
      expect(result).toBe('monthsAgo');
    });

    it('returns yearsAgo for timestamps over a year ago', () => {
      const now = Date.now();
      const result = getTimeAgo(now - 400 * 86400_000);
      expect(result).toBe('yearsAgo');
    });

    it('returns justNow for timestamp equal to now', () => {
      expect(getTimeAgo(Date.now())).toBe('justNow');
    });
  });

  describe('formatDate', () => {
    it('formats a date including year, month name, and day', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      const result = formatDate(date);
      // toLocaleDateString with month:'long' produces "January 15, 2024" (en-US)
      // or similar depending on system locale — assert all three components
      expect(result).toContain('2024');
      expect(result).toContain('15');
      // Month name should be present (not just number) — check for letters
      expect(result).toMatch(/[A-Za-z]{3,}/);
    });

    it('includes the month name (not numeric month)', () => {
      // March 7, 2023 — should include "March" or locale equivalent, NOT just "03"
      const date = new Date(2023, 2, 7);
      const result = formatDate(date);
      expect(result).not.toMatch(/^\d/); // Should not start with a digit
      expect(result).toContain('2023');
    });
  });

  describe('truncateString', () => {
    it('returns the original string if shorter than maxLength', () => {
      expect(truncateString('hello', 10)).toBe('hello');
    });

    it('returns the original string if exactly maxLength', () => {
      expect(truncateString('hello', 5)).toBe('hello');
    });

    it('truncates and adds ellipsis when string exceeds maxLength', () => {
      expect(truncateString('hello world', 8)).toBe('hello...');
    });

    it('handles maxLength of 3 (minimum for ellipsis)', () => {
      expect(truncateString('hello', 3)).toBe('...');
    });

    it('handles empty string', () => {
      expect(truncateString('', 5)).toBe('');
    });
  });
});
