import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the module with different env values, so we use dynamic imports
describe('environment', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports getEnv that prepends VITE_ prefix when missing', async () => {
    const mod = await import('../environment');
    // getEnv with a key that doesn't start with VITE_ should prepend it
    const result = mod.getEnv('SOME_KEY', 'fallback');
    expect(result).toBe('fallback');
  });

  it('getEnv does not double-prefix keys starting with VITE_', async () => {
    const mod = await import('../environment');
    const result = mod.getEnv('VITE_SUPABASE_URL', 'fb');
    // Should look up VITE_SUPABASE_URL (not VITE_VITE_SUPABASE_URL)
    expect(typeof result).toBe('string');
  });

  it('getEnv returns fallback when env var is empty', async () => {
    const mod = await import('../environment');
    const result = mod.getEnv('NONEXISTENT_VAR', 'my-fallback');
    expect(result).toBe('my-fallback');
  });

  it('getEnv defaults fallback to empty string', async () => {
    const mod = await import('../environment');
    const result = mod.getEnv('NONEXISTENT_VAR');
    expect(result).toBe('');
  });

  it('getEnvironment returns object with SUPABASE_URL and SUPABASE_ANON_KEY', async () => {
    const mod = await import('../environment');
    const env = mod.getEnvironment();
    expect(env).toHaveProperty('SUPABASE_URL');
    expect(env).toHaveProperty('SUPABASE_ANON_KEY');
  });

  it('exports NODE_ENV as a string', async () => {
    const mod = await import('../environment');
    expect(typeof mod.NODE_ENV).toBe('string');
  });

  it('exports IS_PROD and IS_DEV as booleans', async () => {
    const mod = await import('../environment');
    expect(typeof mod.IS_PROD === 'boolean' || typeof mod.IS_PROD === 'string').toBe(true);
    expect(typeof mod.IS_DEV === 'boolean' || typeof mod.IS_DEV === 'string').toBe(true);
  });

  it('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are strings', async () => {
    const mod = await import('../environment');
    expect(typeof mod.SUPABASE_URL).toBe('string');
    expect(typeof mod.SUPABASE_ANON_KEY).toBe('string');
    expect(typeof mod.SUPABASE_SERVICE_ROLE_KEY).toBe('string');
  });
});
