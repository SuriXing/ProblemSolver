import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Entry-point smoke guard (#loss / S-app): the real entry is main.tsx (index.html
// only loads it). The old CRA entry (src/index.tsx) used to own reset.css,
// global.css, and the body.loaded listener — if a future refactor drops them,
// production ships with body opacity 0 (global.css sets body { opacity: 0 } and
// only body.loaded restores it). This deliberately freezes that contract so a
// dead-entry regression turns red instead of silently shipping a blank site.
describe('app entry smoke', () => {
  const entry = readFileSync(resolve(__dirname, '../main.tsx'), 'utf8');
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

  it('index.html boots main.tsx, not the old dead entry', () => {
    expect(html).toContain('./src/main.tsx');
    expect(html).not.toContain('./src/index.tsx');
  });

  it('main.tsx still imports reset, global, and the app css', () => {
    expect(entry).toContain("import './styles/reset.css'");
    expect(entry).toContain("import './index.css'");
    expect(entry).toContain("import './assets/css/global.css'");
    expect(entry).toContain("import './assets/css/index.css'");
  });

  it('still adds the body.loaded class so the entrance transition fires', () => {
    expect(entry).toMatch(/classList\.add\('loaded'\)/);
    expect(entry).toMatch(/DOMContentLoaded/);
  });
});