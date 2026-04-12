import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionStorageAdapter } from '../sessionStorageAdapter';

describe('SessionStorageAdapter', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('set / get', () => {
    it('stores and retrieves data', () => {
      SessionStorageAdapter.set('key1', { foo: 'bar' });
      expect(SessionStorageAdapter.get('key1')).toEqual({ foo: 'bar' });
    });

    it('stores primitive values', () => {
      SessionStorageAdapter.set('num', 42);
      expect(SessionStorageAdapter.get('num')).toBe(42);
    });

    it('returns null for non-existent key', () => {
      expect(SessionStorageAdapter.get('missing')).toBeNull();
    });
  });

  describe('TTL expiry', () => {
    it('returns data before TTL expires', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      SessionStorageAdapter.set('ttlKey', 'value', 5000);

      // Still within TTL
      vi.spyOn(Date, 'now').mockReturnValue(now + 4999);
      expect(SessionStorageAdapter.get('ttlKey')).toBe('value');
    });

    it('returns null after TTL expires', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      SessionStorageAdapter.set('ttlKey', 'value', 5000);

      // Past TTL
      vi.spyOn(Date, 'now').mockReturnValue(now + 5001);
      expect(SessionStorageAdapter.get('ttlKey')).toBeNull();
    });

    it('removes expired item from sessionStorage', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      SessionStorageAdapter.set('ttlKey', 'value', 1000);

      vi.spyOn(Date, 'now').mockReturnValue(now + 2000);
      SessionStorageAdapter.get('ttlKey');

      // Item should be removed
      expect(sessionStorage.getItem('worry-solver-session-ttlKey')).toBeNull();
    });

    it('does not expire when no TTL is set', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      SessionStorageAdapter.set('noTtl', 'forever');

      vi.spyOn(Date, 'now').mockReturnValue(now + 999999999);
      expect(SessionStorageAdapter.get('noTtl')).toBe('forever');
    });
  });

  describe('remove', () => {
    it('removes an item', () => {
      SessionStorageAdapter.set('toRemove', 'data');
      SessionStorageAdapter.remove('toRemove');
      expect(SessionStorageAdapter.get('toRemove')).toBeNull();
    });

    it('does not throw for non-existent key', () => {
      expect(() => SessionStorageAdapter.remove('nope')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('removes all prefixed items and leaves unprefixed items intact', () => {
      SessionStorageAdapter.set('a', 1);
      SessionStorageAdapter.set('b', 2);
      // Unprefixed item set directly — should survive clearAll
      sessionStorage.setItem('unrelated-key', 'keep-me');

      SessionStorageAdapter.clearAll();

      // Prefixed items are gone
      expect(SessionStorageAdapter.get('a')).toBeNull();
      expect(SessionStorageAdapter.get('b')).toBeNull();
      // Unprefixed item untouched
      expect(sessionStorage.getItem('unrelated-key')).toBe('keep-me');
    });
  });

  describe('storePost / retrievePost', () => {
    it('stores and retrieves a post', () => {
      const post = {
        id: '1',
        content: 'Test post',
        tags: ['test'],
      } as any;

      const key = SessionStorageAdapter.storePost(post);
      expect(key).toMatch(/^post-/);

      const retrieved = SessionStorageAdapter.retrievePost(key);
      expect(retrieved).toEqual(post);
    });

    it('stores post with TTL', () => {
      const now = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const post = { id: '2', content: 'x' } as any;
      const key = SessionStorageAdapter.storePost(post, 3000);

      vi.spyOn(Date, 'now').mockReturnValue(now + 4000);
      expect(SessionStorageAdapter.retrievePost(key)).toBeNull();
    });

    it('returns null for non-existent session key', () => {
      expect(SessionStorageAdapter.retrievePost('post-nonexistent')).toBeNull();
    });
  });
});
