import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initStorage,
  storePostData,
  retrievePostData,
  checkAccessCode,
  generateAccessCode,
  clearAllData,
} from '../storage-system';

describe('storage-system', () => {
  beforeEach(() => {
    // Set up window global functions
    (window as any).initStorageSystem = vi.fn();
    (window as any).storeData = vi.fn();
    (window as any).retrieveData = vi.fn();
    (window as any).checkAccessCode = vi.fn();
    (window as any).generateAccessCode = vi.fn();
    (window as any).clearAllData = vi.fn();
  });

  afterEach(() => {
    delete (window as any).initStorageSystem;
    delete (window as any).storeData;
    delete (window as any).retrieveData;
    delete (window as any).checkAccessCode;
    delete (window as any).generateAccessCode;
    delete (window as any).clearAllData;
  });

  describe('initStorage', () => {
    it('calls window.initStorageSystem and returns true', () => {
      expect(initStorage()).toBe(true);
      expect((window as any).initStorageSystem).toHaveBeenCalled();
    });

    it('returns false when initStorageSystem is not available', () => {
      delete (window as any).initStorageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(initStorage()).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false when initStorageSystem throws', () => {
      (window as any).initStorageSystem = vi.fn(() => { throw new Error('boom'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(initStorage()).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('storePostData', () => {
    it('calls window.storeData and returns true', () => {
      const post = { id: '1', content: 'test' } as any;
      expect(storePostData('CODE', post)).toBe(true);
      expect((window as any).storeData).toHaveBeenCalledWith('CODE', post);
    });

    it('returns false when storeData is not available', () => {
      delete (window as any).storeData;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(storePostData('CODE', {} as any)).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false when storeData throws', () => {
      (window as any).storeData = vi.fn(() => { throw new Error('fail'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(storePostData('CODE', {} as any)).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('retrievePostData', () => {
    it('calls window.retrieveData and returns data', () => {
      const mockData = { id: '1', content: 'test' };
      (window as any).retrieveData = vi.fn().mockReturnValue(mockData);
      expect(retrievePostData('CODE')).toEqual(mockData);
    });

    it('returns null when retrieveData is not available', () => {
      delete (window as any).retrieveData;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(retrievePostData('CODE')).toBeNull();
      consoleSpy.mockRestore();
    });

    it('returns null when retrieveData throws', () => {
      (window as any).retrieveData = vi.fn(() => { throw new Error('fail'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(retrievePostData('CODE')).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('checkAccessCode', () => {
    it('returns true when window.checkAccessCode returns true', () => {
      (window as any).checkAccessCode = vi.fn().mockReturnValue(true);
      expect(checkAccessCode('CODE')).toBe(true);
    });

    it('returns false when window.checkAccessCode returns false', () => {
      (window as any).checkAccessCode = vi.fn().mockReturnValue(false);
      expect(checkAccessCode('CODE')).toBe(false);
    });

    it('returns false when not available', () => {
      delete (window as any).checkAccessCode;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(checkAccessCode('CODE')).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('generateAccessCode', () => {
    it('returns code from window.generateAccessCode', () => {
      (window as any).generateAccessCode = vi.fn().mockReturnValue('NEW-CODE');
      expect(generateAccessCode()).toBe('NEW-CODE');
    });

    it('returns null when not available', () => {
      delete (window as any).generateAccessCode;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(generateAccessCode()).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllData', () => {
    it('calls window.clearAllData and returns true', () => {
      expect(clearAllData()).toBe(true);
      expect((window as any).clearAllData).toHaveBeenCalled();
    });

    it('returns false when not available', () => {
      delete (window as any).clearAllData;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(clearAllData()).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
