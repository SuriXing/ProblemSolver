#!/usr/bin/env node
/**
 * Commit-date audit — the rules the diary DAG promises:
 *
 *   1. author date == committer date (one person, one moment)
 *   2. +0800 timezone on every commit
 *   3. no future-dated commits
 *   4. subject in the diary voice ("Today I ...", no conventional prefix,
 *      no trailing period)
 *
 * The DAG monotonicity (each commit's date >= its parent's) is reported as a
 * WARNING, not a failure: the backdated narrative batches intentionally sit
 * below the commits that were pushed before them.
 *
 * Usage: node scripts/audit-commit-dates.mjs [--strict]
 * Exit 1 when hard violations exist (or any warning with --strict).
 */
import { execSync } from 'node:child_process';

const strict = process.argv.includes('--strict');

const log = execSync(
  'git log --format=%H%x1f%ad%x1f%cd%x1f%s --date=format:%Y-%m-%dT%H:%M:%S%z',
  { encoding: 'utf8' },
);
const rows = log
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, ad, cd, subject = ''] = line.split('\x1f');
    return { hash, ad, cd, subject };
  });

// The diary-voice convention landed with the 2026-06-19 v1.0.0 snapshot;
// commits older than that are historical records and keep their original
// subjects. Hard rules (A=C, timezone, future dates) apply to everything.
const STYLE_SINCE = '2026-06-19T17:20'; // the v1.0.0 snapshot timestamp

const now = new Date();
const problems = [];
const warnings = [];

for (const row of rows) {
  if (row.ad !== row.cd) {
    problems.push(`${row.hash.slice(0, 7)} author/committer differ: ${row.ad} vs ${row.cd}`);
  }
  if (!row.ad.endsWith('+0800') || !row.cd.endsWith('+0800')) {
    problems.push(`${row.hash.slice(0, 7)} wrong timezone: ${row.ad} / ${row.cd}`);
  }
  if (new Date(row.ad) > now) {
    problems.push(`${row.hash.slice(0, 7)} future-dated: ${row.ad}`);
  }
  if (row.ad >= STYLE_SINCE) {
    if (!/^Today I[, ]/.test(row.subject)) {
      problems.push(`${row.hash.slice(0, 7)} subject not in diary voice: ${row.subject.slice(0, 50)}`);
    }
    if (row.subject.endsWith('.')) {
      problems.push(`${row.hash.slice(0, 7)} subject ends with a period`);
    }
    if (/^(feat|fix|chore|refactor|docs|test|style|perf)(\(|:)/.test(row.subject)) {
      problems.push(`${row.hash.slice(0, 7)} conventional prefix in subject`);
    }
  }
}

// Monotonicity: walk parent order (newest → oldest); a child older than its
// parent is the intentional backdating pattern.
let prev = null;
for (const row of rows) {
  if (prev && row.cd > prev) {
    warnings.push(`${row.hash.slice(0, 7)} is older than its child (backdated batch): ${row.cd} vs ${prev}`);
  }
  prev = row.cd;
}

console.log(`commit-date audit: ${rows.length} commits scanned`);
if (warnings.length > 0) {
  console.log(`commit-date warnings (backdating, by design): ${warnings.length}`);
  for (const w of warnings.slice(0, 5)) console.log('  ' + w);
}
if (problems.length > 0) {
  console.error(`commit-date audit: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 20)) console.error('  ' + p);
  process.exit(1);
}
if (strict && warnings.length > 0) {
  console.error('commit-date audit: --strict rejects backdated commits');
  process.exit(1);
}
console.log('commit-date audit: OK');
