import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the environment module to control env var values
vi.mock('../environment', () => ({
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
}));

import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey } from '../supabaseUtils';

describe('supabaseUtils', () => {
  describe('getSupabaseUrl', () => {
    it('returns fallback URL when env var is empty', () => {
      const url = getSupabaseUrl();
      expect(url).toBe('https://bihltxhebindflclsutw.supabase.co');
    });
  });

  describe('getSupabaseAnonKey', () => {
    it('returns fallback key when env var is empty', () => {
      const key = getSupabaseAnonKey();
      expect(key).toBe('sb_publishable_ochy1eHzpFRMSCOndm3FQg_mLvGhDrL');
    });
  });

  describe('getSupabaseServiceRoleKey', () => {
    it('returns empty string and logs error when env var is empty', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const key = getSupabaseServiceRoleKey();
      expect(key).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Supabase Service Role Key not found in environment variables');
      consoleSpy.mockRestore();
    });
  });
});

describe('supabaseUtils with env vars set', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns primary URL when env var is set', async () => {
    vi.doMock('../environment', () => ({
      SUPABASE_URL: 'https://my-project.supabase.co',
      SUPABASE_ANON_KEY: 'my-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'my-service-key',
    }));
    const mod = await import('../supabaseUtils');
    expect(mod.getSupabaseUrl()).toBe('https://my-project.supabase.co');
    expect(mod.getSupabaseAnonKey()).toBe('my-anon-key');
    expect(mod.getSupabaseServiceRoleKey()).toBe('my-service-key');
  });
});
