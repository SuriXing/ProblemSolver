import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the environment module to control env var values
vi.mock('../environment', () => ({
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
}));

import { getSupabaseUrl, getSupabaseAnonKey } from '../supabaseUtils';

describe('supabaseUtils', () => {
  describe('getSupabaseUrl', () => {
    it('throws when env var is empty (fail loud, no hardcoded fallback)', () => {
      expect(() => getSupabaseUrl()).toThrow(/VITE_SUPABASE_URL/);
    });
  });

  describe('getSupabaseAnonKey', () => {
    it('throws when env var is empty (fail loud, no hardcoded fallback)', () => {
      expect(() => getSupabaseAnonKey()).toThrow(/VITE_SUPABASE_ANON_KEY/);
    });
  });
});

describe('supabaseUtils with env vars set', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns primary URL and key when env vars are set', async () => {
    vi.doMock('../environment', () => ({
      SUPABASE_URL: 'https://my-project.supabase.co',
      SUPABASE_ANON_KEY: 'my-anon-key',
    }));
    const mod = await import('../supabaseUtils');
    expect(mod.getSupabaseUrl()).toBe('https://my-project.supabase.co');
    expect(mod.getSupabaseAnonKey()).toBe('my-anon-key');
  });
});
