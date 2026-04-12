import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('storageAdapter', () => {
  let storageAdapter: any;

  const mockStorageSystem = {
    init: vi.fn(),
    storeData: vi.fn(),
    retrieveData: vi.fn(),
    checkAccessCode: vi.fn(),
    generateAccessCode: vi.fn(),
    clearAllData: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetModules();
    // Reset all mock implementations to defaults
    mockStorageSystem.init.mockReset();
    mockStorageSystem.storeData.mockReset();
    mockStorageSystem.retrieveData.mockReset();
    mockStorageSystem.checkAccessCode.mockReset();
    mockStorageSystem.generateAccessCode.mockReset();
    mockStorageSystem.clearAllData.mockReset();
    (window as any).storageSystem = mockStorageSystem;
    const mod = await import('../storageAdapter');
    storageAdapter = mod.storageAdapter;
  });

  afterEach(() => {
    delete (window as any).storageSystem;
  });

  describe('init', () => {
    it('calls window.storageSystem.init()', () => {
      storageAdapter.init();
      expect(mockStorageSystem.init).toHaveBeenCalled();
    });

    it('logs error when storageSystem is not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      storageAdapter.init();
      expect(consoleSpy).toHaveBeenCalledWith('Legacy storage system not available');
      consoleSpy.mockRestore();
    });
  });

  describe('storePost', () => {
    it('stores post data and returns true', () => {
      const post = {
        content: 'test content',
        tags: ['tag1'],
        title: 'Test',
        replies: [],
      };
      const result = storageAdapter.storePost('CODE-123', post);
      expect(result).toBe(true);
      expect(mockStorageSystem.storeData).toHaveBeenCalledWith(
        'CODE-123',
        expect.objectContaining({ confessionText: 'test content', title: 'Test' })
      );
    });

    it('returns false when storageSystem is not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = storageAdapter.storePost('CODE-123', { content: 'x' });
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });

    it('returns false when storeData throws', () => {
      mockStorageSystem.storeData.mockImplementation(() => { throw new Error('fail'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = storageAdapter.storePost('CODE-123', { content: 'x' });
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('getPost', () => {
    it('returns mapped post data when found', () => {
      mockStorageSystem.retrieveData.mockReturnValue({
        confessionText: 'hello',
        selectedTags: ['a'],
        title: 'Title',
        replies: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isResolved: false,
      });
      const post = storageAdapter.getPost('CODE-123');
      expect(post).toEqual({
        id: 'CODE-123',
        accessCode: 'CODE-123',
        title: 'Title',
        content: 'hello',
        tags: ['a'],
        replies: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        isResolved: false,
      });
    });

    it('returns null when not found', () => {
      mockStorageSystem.retrieveData.mockReturnValue(null);
      expect(storageAdapter.getPost('NOPE')).toBeNull();
    });

    it('returns null when storageSystem is not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(storageAdapter.getPost('X')).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('checkAccessCode', () => {
    it('delegates to storageSystem.checkAccessCode', () => {
      mockStorageSystem.checkAccessCode.mockReturnValue(true);
      expect(storageAdapter.checkAccessCode('CODE')).toBe(true);
    });

    it('returns false when storageSystem not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(storageAdapter.checkAccessCode('CODE')).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('generateAccessCode', () => {
    it('delegates to storageSystem.generateAccessCode', () => {
      mockStorageSystem.generateAccessCode.mockReturnValue('ABCD-EFGH-IJKL');
      expect(storageAdapter.generateAccessCode()).toBe('ABCD-EFGH-IJKL');
    });

    it('generates fallback code when storageSystem not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const code = storageAdapter.generateAccessCode();
      // Fallback format: XXXX-XXXX-XXXX
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      consoleSpy.mockRestore();
    });
  });

  describe('addReply', () => {
    it('adds reply to existing post and returns true', () => {
      const existingData = {
        replies: [] as any[],
        updatedAt: '2024-01-01',
      };
      mockStorageSystem.retrieveData.mockReturnValue(existingData);
      const result = storageAdapter.addReply('CODE', {
        author: 'User',
        content: 'Reply text',
        createdAt: 12345,
      });
      expect(result).toBe(true);
      expect(mockStorageSystem.storeData).toHaveBeenCalledWith(
        'CODE',
        expect.objectContaining({
          replies: [expect.objectContaining({ author: 'User', content: 'Reply text' })],
        })
      );
    });

    it('returns false when post not found', () => {
      mockStorageSystem.retrieveData.mockReturnValue(null);
      expect(storageAdapter.addReply('CODE', { author: 'U', content: 'R' })).toBe(false);
    });

    it('returns false when storageSystem not available', () => {
      delete (window as any).storageSystem;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(storageAdapter.addReply('CODE', { author: 'U', content: 'R' })).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllData', () => {
    it('delegates to storageSystem.clearAllData', () => {
      storageAdapter.clearAllData();
      expect(mockStorageSystem.clearAllData).toHaveBeenCalled();
    });

    it('does nothing when storageSystem not available', () => {
      delete (window as any).storageSystem;
      // Should not throw
      expect(() => storageAdapter.clearAllData()).not.toThrow();
    });
  });
});
