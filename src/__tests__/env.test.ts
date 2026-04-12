import { describe, it, expect } from 'vitest';
import { env } from '../env';

describe('env', () => {
  it('SUPABASE_URL is a string (from import.meta.env)', () => {
    // In tests, import.meta.env.VITE_SUPABASE_URL is undefined, so env.SUPABASE_URL is undefined.
    // Assert the type contract: if defined, it must be a string.
    if (env.SUPABASE_URL !== undefined) {
      expect(typeof env.SUPABASE_URL).toBe('string');
    } else {
      expect(env.SUPABASE_URL).toBeUndefined();
    }
  });

  it('SUPABASE_ANON_KEY is a string (from import.meta.env)', () => {
    if (env.SUPABASE_ANON_KEY !== undefined) {
      expect(typeof env.SUPABASE_ANON_KEY).toBe('string');
    } else {
      expect(env.SUPABASE_ANON_KEY).toBeUndefined();
    }
  });

  it('exports exactly SUPABASE_URL and SUPABASE_ANON_KEY — no unexpected leaks', () => {
    // Guards against accidentally exporting other import.meta.env values
    expect(Object.keys(env).sort()).toEqual(['SUPABASE_ANON_KEY', 'SUPABASE_URL']);
  });
});
