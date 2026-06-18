#!/usr/bin/env node
/**
 * Push-time gate. Reproduces the GitHub Actions `test` job in `ci.yml` with the
 * same order, same commands and the same stub env, so a push that passes this
 * gate cannot then make the CI test job go red. If any step fails, we block the
 * push rather than let it land and fail on the runner.
 *
 * e2e is a SEPARATE CI job and depends on a browser install, so locally we only
 * run the offline specs when a drivable browser exists (official Playwright
 * cache OR system Chrome); otherwise we warn and continue — never block a valid
 * push on a missing local browser.
 *
 * Exit 0 = push is safe for CI; non-zero = stop the push.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Exact same stub env CI uses so module-load checks behave identically.
const STUB_ENV = {
  VITE_SUPABASE_URL: 'https://stub.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'stub-anon-key-for-ci',
};

function run(label, command, extraEnv = {}) {
  process.stdout.write(`pre-push: ${label} ... `);
  const res = spawnSync(command, {
    stdio: 'inherit',
    env: { ...process.env, ...STUB_ENV, ...extraEnv },
    shell: true,
  });
  if (res.status === 0) {
    console.log(`${GREEN}✓${RESET} ${label} passed`);
    return true;
  }
  console.log(`\n${RED}✖ ${label} FAILED (exit ${res.status ?? res.error?.message})${RESET}`);
  return false;
}

function hasDrivableBrowser() {
  const pwCache = ['~/Library/Caches/ms-playwright', process.env.PLAYWRIGHT_BROWSERS_PATH]
    .filter(Boolean)
    .map((p) => p.replace('~', homedir()));
  if (pwCache.some(existsSync)) return true;
  return existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
}

// Mirrors the exact order and commands of the ci.yml "test" job.
const STEPS = [
  ['audit production deps (fail on high)', 'npm audit --omit=dev --audit-level=high'],
  ['lint (zero warnings)', 'npm run lint -- --max-warnings 0'],
  ['type-check', 'npm run type-check'],
  ['test with coverage', 'npm run coverage'],
  ['build', 'npm run build'],
];

let failed = false;
for (const [label, cmd] of STEPS) {
  if (!run(label, cmd)) {
    failed = true;
    break;
  }
}

if (!failed) {
  if (hasDrivableBrowser()) {
    const e2e = run(
      'playwright offline e2e specs',
      'npx playwright test e2e/navigation.spec.ts e2e/help-flow.spec.ts e2e/journey-confession-to-lookup.spec.ts e2e/session-verification.spec.ts --reporter=line',
      { PLAYWRIGHT_CHANNEL: 'chrome' },
    );
    if (!e2e) failed = true;
  } else {
    console.log(
      `${YELLOW}! pre-push: no drivable Playwright/Chrome browser found — skipping local e2e. CI still runs e2e in its own job.${RESET}`
    );
  }
}

if (failed) {
  console.error(`${RED}pre-push gate failed — not pushing; CI would fail the same way.${RESET}`);
  process.exit(1);
}
console.log(`${GREEN}pre-push gate OK — CI test job is expected to be green.${RESET}`);
process.exit(0);