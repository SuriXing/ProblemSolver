#!/usr/bin/env node
/**
 * Generate a self-contained HTML verification report.
 *
 * Collects:
 *   - CLI check results (runs tsc, vitest, playwright, vite build)
 *   - Session verification screenshots from test-results/verification/
 * Embeds screenshots as base64 data URLs so the report is a single HTML file
 * with no external dependencies.
 *
 * Usage:
 *   node scripts/generate-verification-report.mjs
 *
 * Output: test-results/verification-report.html
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const shotDir = path.join(root, 'test-results', 'verification');
const outPath = path.join(root, 'test-results', 'verification-report.html');

function run(cmd, { silent = false } = {}) {
  const start = Date.now();
  try {
    const out = execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf8' });
    return { ok: true, out, ms: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      out: (err.stdout || '') + (err.stderr || ''),
      ms: Date.now() - start,
    };
  }
}

function extractCount(out, pattern, group = 1) {
  const m = out.match(pattern);
  return m ? m[group] : null;
}

function toDataUrl(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

console.log('→ Running CLI checks...');

// 1. Type check
console.log('  tsc --noEmit');
const tsc = run('npx tsc --noEmit', { silent: true });

// 2. Unit tests (vitest)
console.log('  vitest run');
const vitest = run('npx vitest run --reporter=default', { silent: true });
const vitestPassed = extractCount(vitest.out, /Tests\s+(\d+)\s+passed/);
const vitestFiles = extractCount(vitest.out, /Test Files\s+(\d+)\s+passed/);

// 3. Playwright
console.log('  playwright test');
const playwright = run('npx playwright test --reporter=line', { silent: true });
const playwrightPassed = extractCount(playwright.out, /(\d+)\s+passed/);

// 4. Build
console.log('  vite build');
const build = run('npm run build', { silent: true });
const buildOk = build.ok && build.out.includes('built in');

console.log('→ Collecting screenshots...');
const screenshots = fs.existsSync(shotDir)
  ? fs
      .readdirSync(shotDir)
      .filter((f) => f.endsWith('.png'))
      .sort()
      .map((f) => ({
        name: f,
        label: f.replace(/^F\d+[a-z]?-/, '').replace(/\.png$/, '').replace(/-/g, ' '),
        dataUrl: toDataUrl(path.join(shotDir, f)),
      }))
  : [];

// Git info
let gitInfo = {};
try {
  gitInfo.commit = execSync('git rev-parse --short HEAD').toString().trim();
  gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  gitInfo.message = execSync('git log -1 --pretty=%B').toString().trim();
} catch {
  gitInfo = { commit: '?', branch: '?', message: '' };
}

const checks = [
  {
    id: 'tsc',
    label: 'Type check (tsc --noEmit)',
    ok: tsc.ok,
    detail: tsc.ok ? '0 errors' : tsc.out.slice(0, 2000),
    ms: tsc.ms,
  },
  {
    id: 'vitest',
    label: 'Unit tests (vitest)',
    ok: vitest.ok,
    detail: vitest.ok
      ? `${vitestPassed || '?'} tests across ${vitestFiles || '?'} files passing`
      : vitest.out.slice(-2000),
    ms: vitest.ms,
  },
  {
    id: 'playwright',
    label: 'E2E tests (playwright)',
    ok: playwright.ok,
    detail: playwright.ok
      ? `${playwrightPassed || '?'} tests passing`
      : playwright.out.slice(-2000),
    ms: playwright.ms,
  },
  {
    id: 'build',
    label: 'Production build (vite build)',
    ok: buildOk,
    detail: buildOk
      ? build.out.split('\n').filter((l) => l.includes('dist/') || l.includes('built in')).join('\n')
      : build.out.slice(-2000),
    ms: build.ms,
  },
];

const allPassed = checks.every((c) => c.ok);
const totalMs = checks.reduce((a, c) => a + c.ms, 0);

const fixes = [
  { id: 'F1', title: 'Notebook inputs stay within panel boundaries', file: 'F1-notebook-boundaries.png' },
  { id: 'F3', title: 'Mentor Table link is external (localhost:9999)', file: 'F3-mentor-table-link.png' },
  { id: 'F4', title: 'Replies fallback — post.replies from join used when /replies RLS blocks reads', file: 'F4-replies-fallback.png' },
  { id: 'F5', title: 'Shareable URL auto-populates access code and fetches post', file: 'F5-shareable-url.png' },
  { id: 'F6', title: 'Notebook per-entry actions (Copy code, Open, Mark solved)', file: 'F6-notebook-actions.png' },
  { id: 'F8a', title: 'Journey step 1 — confession form with email opt-in', file: 'F8a-confession-form.png' },
  { id: 'F8b', title: 'Journey step 2 — success page with access code', file: 'F8b-success-page.png' },
  { id: 'F8c', title: 'Journey step 3 — lookup returns original content AND reply', file: 'F8c-lookup-with-reply.png' },
];

function shotFor(fileName) {
  return screenshots.find((s) => s.name === fileName);
}

const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verification Report — ProblemSolver</title>
<style>
  :root {
    --bg: #0b0f1a;
    --panel: #141a2b;
    --border: #24314f;
    --text: #e8ebf5;
    --muted: #8892b0;
    --ok: #52c41a;
    --fail: #ff4d4f;
    --accent: #5b7bfa;
    --code-bg: #0a0e1a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
  }
  .container { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
  header { margin-bottom: 40px; }
  h1 { font-size: 32px; margin: 0 0 8px; color: var(--text); }
  h2 { font-size: 22px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .subtitle { color: var(--muted); font-size: 14px; }
  .banner {
    padding: 20px 24px;
    background: ${allPassed ? 'linear-gradient(135deg, #0f3a12, #175d1b)' : 'linear-gradient(135deg, #3a0f14, #5d1c22)'};
    border: 1px solid ${allPassed ? 'rgba(82, 196, 26, 0.4)' : 'rgba(255, 77, 79, 0.4)'};
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    margin: 24px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .status-icon { font-size: 24px; }
  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin: 16px 0;
  }
  .meta-item {
    background: var(--panel);
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .meta-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .meta-value { font-size: 14px; color: var(--text); font-family: 'SF Mono', Monaco, monospace; word-break: break-all; }
  .check {
    background: var(--panel);
    padding: 16px 20px;
    border-radius: 8px;
    border-left: 4px solid var(--border);
    margin: 12px 0;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .check.ok { border-left-color: var(--ok); }
  .check.fail { border-left-color: var(--fail); }
  .check-icon { font-size: 22px; flex-shrink: 0; }
  .check-body { flex: 1; min-width: 0; }
  .check-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
  .check-detail {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 12px;
    color: var(--muted);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
    background: var(--code-bg);
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 8px;
  }
  .check-time { font-size: 11px; color: var(--muted); white-space: nowrap; }
  .fixes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 16px;
  }
  .fix {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  .fix-header { padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .fix-id {
    display: inline-block;
    background: rgba(91, 123, 250, 0.15);
    color: var(--accent);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    font-weight: 600;
    margin-right: 8px;
  }
  .fix-title { font-size: 13px; font-weight: 500; }
  .fix img {
    width: 100%;
    display: block;
    background: #000;
  }
  .footer { text-align: center; color: var(--muted); font-size: 12px; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border); }
  code { background: var(--code-bg); padding: 2px 6px; border-radius: 3px; font-size: 12px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Verification Report</h1>
    <div class="subtitle">ProblemSolver · end-to-end verification · generated ${now}</div>
  </header>

  <div class="banner">
    <span class="status-icon">${allPassed ? '✓' : '✗'}</span>
    <span>${allPassed ? `All checks passed in ${(totalMs / 1000).toFixed(1)}s` : 'One or more checks failed'}</span>
  </div>

  <div class="meta">
    <div class="meta-item"><div class="meta-label">Branch</div><div class="meta-value">${gitInfo.branch}</div></div>
    <div class="meta-item"><div class="meta-label">Commit</div><div class="meta-value">${gitInfo.commit}</div></div>
    <div class="meta-item"><div class="meta-label">Unit tests</div><div class="meta-value">${vitestPassed || '?'} / ${vitestFiles || '?'} files</div></div>
    <div class="meta-item"><div class="meta-label">E2E tests</div><div class="meta-value">${playwrightPassed || '?'} passing</div></div>
  </div>

  <h2>CLI verification</h2>
  ${checks
    .map(
      (c) => `
    <div class="check ${c.ok ? 'ok' : 'fail'}">
      <div class="check-icon">${c.ok ? '✓' : '✗'}</div>
      <div class="check-body">
        <div class="check-title">${c.label}</div>
        <div class="check-detail">${escapeHtml(c.detail || '')}</div>
      </div>
      <div class="check-time">${(c.ms / 1000).toFixed(1)}s</div>
    </div>
  `
    )
    .join('')}

  <h2>UI verification (Playwright screenshots)</h2>
  <div class="fixes">
    ${fixes
      .map((f) => {
        const shot = shotFor(f.file);
        return `
      <div class="fix">
        <div class="fix-header">
          <span class="fix-id">${f.id}</span>
          <span class="fix-title">${escapeHtml(f.title)}</span>
        </div>
        ${shot ? `<img src="${shot.dataUrl}" alt="${escapeHtml(f.title)}" />` : `<div style="padding: 40px; text-align: center; color: var(--muted);">Screenshot not found: ${f.file}</div>`}
      </div>
    `;
      })
      .join('')}
  </div>

  <div class="footer">
    Report generated by <code>scripts/generate-verification-report.mjs</code><br />
    To regenerate: <code>node scripts/generate-verification-report.mjs</code>
  </div>
</div>
</body>
</html>`;

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

fs.writeFileSync(outPath, html);
console.log(`\n→ Report written: ${outPath}`);
console.log(`  size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
console.log(`  status: ${allPassed ? 'PASS' : 'FAIL'}`);
process.exit(allPassed ? 0 : 1);
