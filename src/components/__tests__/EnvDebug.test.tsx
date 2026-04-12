import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvDebug from '../EnvDebug';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('EnvDebug', () => {
  it('renders Vite Environment Variables heading', () => {
    render(<EnvDebug />);
    expect(screen.getByText('Vite Environment Variables')).toBeInTheDocument();
  });

  it('renders Process Environment Variables heading', () => {
    render(<EnvDebug />);
    expect(screen.getByText('Process Environment Variables')).toBeInTheDocument();
  });

  it('renders two pre tags containing valid JSON', () => {
    const { container } = render(<EnvDebug />);
    const pres = container.querySelectorAll('pre');
    expect(pres.length).toBe(2);
    // Both pre tags should contain valid JSON (empty objects are valid)
    expect(() => JSON.parse(pres[0].textContent || '{}')).not.toThrow();
    expect(() => JSON.parse(pres[1].textContent || '{}')).not.toThrow();
  });

  it('vite env pre tag contains an object (not an array or primitive)', () => {
    const { container } = render(<EnvDebug />);
    const pres = container.querySelectorAll('pre');
    const viteJson = JSON.parse(pres[0].textContent || '{}');
    expect(typeof viteJson).toBe('object');
    expect(Array.isArray(viteJson)).toBe(false);
  });

  it('truncates VITE_*_KEY values to 10 chars + "..."', () => {
    vi.stubEnv('VITE_TEST_SECRET_KEY', 'abcdefghijklmnopqrstuvwxyz1234567890');

    const { container } = render(<EnvDebug />);
    const vitePre = container.querySelectorAll('pre')[0];
    const viteJson = JSON.parse(vitePre.textContent || '{}');

    // The masked value should contain only the first 10 chars + "..."
    expect(viteJson.VITE_TEST_SECRET_KEY).toBe('abcdefghij...');
    // And must NOT contain the rest of the secret
    expect(viteJson.VITE_TEST_SECRET_KEY).not.toContain('xyz');
  });

  it('renders "not set" for empty KEY fields', () => {
    vi.stubEnv('VITE_EMPTY_KEY', '');

    const { container } = render(<EnvDebug />);
    const vitePre = container.querySelectorAll('pre')[0];
    const viteJson = JSON.parse(vitePre.textContent || '{}');
    expect(viteJson.VITE_EMPTY_KEY).toBe('not set');
  });
});
