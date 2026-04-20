import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to test the module with different env values, so we use dynamic imports
describe('environment', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports NODE_ENV as a string', async () => {
    const mod = await import('../environment');
    expect(typeof mod.NODE_ENV).toBe('string');
  });

  it('IS_PROD is falsy in test environment', async () => {
    const mod = await import('../environment');
    expect(['boolean', 'string']).toContain(typeof mod.IS_PROD);
    expect(Boolean(mod.IS_PROD)).toBe(false);
  });

  it('IS_DEV is truthy in test/development environment', async () => {
    const mod = await import('../environment');
    expect(['boolean', 'string']).toContain(typeof mod.IS_DEV);
    expect(Boolean(mod.IS_DEV)).toBe(true);
  });

  it('IS_PROD and IS_DEV are not simultaneously truthy', async () => {
    const mod = await import('../environment');
    expect(Boolean(mod.IS_PROD) && Boolean(mod.IS_DEV)).toBe(false);
  });

  it('SUPABASE_URL and SUPABASE_ANON_KEY are strings', async () => {
    const mod = await import('../environment');
    expect(typeof mod.SUPABASE_URL).toBe('string');
    expect(typeof mod.SUPABASE_ANON_KEY).toBe('string');
  });
});
