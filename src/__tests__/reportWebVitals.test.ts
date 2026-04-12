import { describe, it, expect, vi } from 'vitest';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn(),
}));

import reportWebVitals from '../reportWebVitals';

describe('reportWebVitals', () => {
  it('does nothing when no callback provided', () => {
    expect(() => reportWebVitals()).not.toThrow();
  });

  it('does nothing when callback is not a function', () => {
    expect(() => reportWebVitals(null as any)).not.toThrow();
    expect(() => reportWebVitals(undefined as any)).not.toThrow();
  });

  it('calls web-vitals functions when valid callback provided', async () => {
    const callback = vi.fn();
    reportWebVitals(callback);

    // The import is async, so we need to wait
    await vi.dynamicImportSettled();

    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
    expect(getCLS).toHaveBeenCalledWith(callback);
    expect(getFID).toHaveBeenCalledWith(callback);
    expect(getFCP).toHaveBeenCalledWith(callback);
    expect(getLCP).toHaveBeenCalledWith(callback);
    expect(getTTFB).toHaveBeenCalledWith(callback);
  });
});
