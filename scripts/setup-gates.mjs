#!/usr/bin/env node
/**
 * One-command gate bootstrap: verify the husky hooks are installed and the
 * commands each hook depends on exist. New machines clone, run `npm install`
 * (which runs `prepare: husky`), then `npm run setup:gates` to see everything
 * green in one pass — instead of reading half a README and hitting a silent
 * miss later. Safe to re-run; never edits your working tree, only reports.
 */

import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const OK = '✓';
const X = '✖';

const problems = [];

function checkE(ok, label, hint) {
  if (ok) {
    console.log(`${OK} ${label}`);
  } else {
    problems.push(label);
    console.log(`${X} ${label}`);
    if (hint) console.log(`      ${hint}`);
  }
}

console.log('Checking git gates...\n');

// 1. Husky installs hooks into .git/hooks. The .husky/_ dir marks an active
//    scaffold; the pre-commit file is the Runtime UI we actually rely on.
checkE(
  existsSync(join(root, '.husky')) && existsSync(join(root, '.husky', 'pre-commit')),
  'husky dir + pre-commit hook exist',
  'run: npx husky install',
);

// 2. pre-commit must call lint-staged and type-check.
const preCommit = existsSync(join(root, '.husky', 'pre-commit'))
  ? readFileSync(join(root, '.husky', 'pre-commit'), 'utf8')
  : '';
checkE(
  preCommit.includes('lint-staged') && preCommit.includes('type-check'),
  'pre-commit runs lint-staged + type-check',
  'edit .husky/pre-commit to: npx lint-staged && npm run type-check',
);

// 3. pre-push hook exists (the push-time gate).
checkE(
  existsSync(join(root, '.husky', 'pre-push')),
  'pre-push hook exists',
  'add .husky/pre-push — runs lint + coverage + build before a push lands',
);

// 4. The npm scripts each hook calls exist.
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const name of ['lint', 'type-check', 'test', 'coverage', 'build', 'test:e2e']) {
  checkE(
    typeof pkg.scripts?.[name] === 'string',
    `npm run ${name} exists`,
    'add it to package.json scripts',
  );
}

console.log(`\n${problems.length === 0 ? 'All gates green.' : `${problems.length} problem(s) to fix:`}`);
for (const p of problems) console.log(`  - ${p}`);

process.exit(problems.length === 0 ? 0 : 1);