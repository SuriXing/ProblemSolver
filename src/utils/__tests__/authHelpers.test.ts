import '../../test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseMock } from '../../test/mocks/supabase';
import { getCurrentUserId } from '../authHelpers';

describe('authHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUserId', () => {
    it('returns user id when user is authenticated', async () => {
      supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      const userId = await getCurrentUserId();
      expect(userId).toBe('user-123');
    });

    it('returns undefined when user is not authenticated', async () => {
      supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      const userId = await getCurrentUserId();
      expect(userId).toBeUndefined();
    });

    it('returns undefined when getUser throws an error', async () => {
      supabaseMock.auth.getUser.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const userId = await getCurrentUserId();
      expect(userId).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error getting current user:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
