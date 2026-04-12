import { describe, it, expect } from 'vitest';
import { env } from '../env';

describe('env', () => {
  it('exports SUPABASE_URL', () => {
    expect(env).toHaveProperty('SUPABASE_URL');
  });

  it('exports SUPABASE_ANON_KEY', () => {
    expect(env).toHaveProperty('SUPABASE_ANON_KEY');
  });

  it('env object has exactly two keys', () => {
    expect(Object.keys(env)).toEqual(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
  });
});
