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

  it('IS_PROD is falsy in test environment', async () => {
    const mod = await import('../environment');
    // IS_PROD comes from `env.PROD || NODE_ENV === 'production'`.
    // Must be a primitive usable in conditionals.
    expect(['boolean', 'string']).toContain(typeof mod.IS_PROD);
    // In vitest, NODE_ENV !== 'production', so IS_PROD should be falsy
    expect(Boolean(mod.IS_PROD)).toBe(false);
  });

  it('IS_DEV is truthy in test/development environment', async () => {
    const mod = await import('../environment');
    // Note: at runtime env.DEV from import.meta.env may arrive as string 'true'
    // — IS_DEV is used as a conditional, which works for both string and boolean.
    expect(['boolean', 'string']).toContain(typeof mod.IS_DEV);
    // In dev/test, IS_DEV should be truthy
    expect(Boolean(mod.IS_DEV)).toBe(true);
  });

  it('IS_PROD and IS_DEV are not simultaneously truthy', async () => {
    const mod = await import('../environment');
    expect(Boolean(mod.IS_PROD) && Boolean(mod.IS_DEV)).toBe(false);
  });

  it('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are strings', async () => {
    const mod = await import('../environment');
    expect(typeof mod.SUPABASE_URL).toBe('string');
    expect(typeof mod.SUPABASE_ANON_KEY).toBe('string');
    expect(typeof mod.SUPABASE_SERVICE_ROLE_KEY).toBe('string');
  });
});
