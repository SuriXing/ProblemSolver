import '../../test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabaseMock, createQueryBuilder } from '../../test/mocks/supabase';
import { migrateDataToSupabase } from '../migrateData';

describe('migrateData', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('migrates posts from localStorage to supabase', async () => {
    const posts = {
      'CODE-1': {
        accessCode: 'CODE-1',
        userId: 'u1',
        confessionText: 'test',
        selectedTags: ['a'],
        privacyOption: 'public',
        emailNotification: false,
        email: '',
        timestamp: '2024-01-01',
        replies: [],
        views: 0,
      },
    };
    localStorage.setItem('problemSolver_userData', JSON.stringify(posts));

    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await migrateDataToSupabase();
    expect(result).toBe(true);
    expect(supabaseMock.from).toHaveBeenCalledWith('problems');
  });

  it('returns true with empty localStorage', async () => {
    localStorage.setItem('problemSolver_userData', JSON.stringify({}));
    const result = await migrateDataToSupabase();
    expect(result).toBe(true);
  });

  it('handles upsert errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const posts = {
      'CODE-1': { accessCode: 'CODE-1', userId: 'u1' },
    };
    localStorage.setItem('problemSolver_userData', JSON.stringify(posts));

    supabaseMock.from.mockReturnValue(
      createQueryBuilder({ data: null, error: { message: 'upsert fail' } })
    );

    const result = await migrateDataToSupabase();
    // Still returns true because the outer try succeeds
    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Error migrating post:', expect.anything());
    consoleSpy.mockRestore();
  });

  it('returns false when localStorage parse fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('problemSolver_userData', 'INVALID JSON{{{');
    const result = await migrateDataToSupabase();
    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it('migrates multiple posts', async () => {
    const posts = {
      'CODE-1': { accessCode: 'CODE-1', userId: 'u1' },
      'CODE-2': { accessCode: 'CODE-2', userId: 'u2' },
    };
    localStorage.setItem('problemSolver_userData', JSON.stringify(posts));

    supabaseMock.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    const result = await migrateDataToSupabase();
    expect(result).toBe(true);
    // from('problems') called for each post
    expect(supabaseMock.from).toHaveBeenCalledTimes(2);
  });
});
