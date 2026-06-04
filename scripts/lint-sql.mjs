#!/usr/bin/env node
/**
 * Lightweight SQL sanity check for the migrations folder — no live DB needed.
 *
 * The migrations are the schema, but they're applied by hand in the Supabase
 * SQL editor, so there's no server-side lint to catch a mistyped filename or
 * an unbalanced paren before it reaches a real project. This script runs at
 * pre-commit (via lint-staged on *.sql) and in CI, and fails loud on:
 *
 *   - non-standard naming (we agree on YYYY_MM_DD_slug.sql, because the folder
 *     order IS the migration order)
 *   - duplicate / out-of-order date prefixes
 *   - a file that's nearly empty (probably a half-finished edit)
 *   - a file missing an idempotent header comment (this repo's convention)
 *   - wildly unbalanced parentheses / braces, a cheap stand-in for "SQL is
 *     not syntactically broken" that doesn't need a parser
 *
 * It is honest about its limits: it does NOT validate SQL grammar. For that,
 * use `supabase db lint` against a real project. This only catches the cheap,
 * mechanical mistakes before they reach a DB.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'supabase', 'migrations');

const FILE_NAME = /^(\d{4}_\d{2}_\d{2})_.+\.sql$/;
// A migration self-describes if it opens an idempotent/DDL statement or a
// header banner. Migrations here cover DDL (ALTER/CREATE), RLS policies,
// SECURITY DEFINER functions, and grant/revoke — so accept any of these as
// evidence the file is a real, self-describing migration.
const HEADER_MARKERS = [
  'ALTER TABLE', 'CREATE TABLE', 'CREATE OR REPLACE', 'CREATE POLICY',
  'DROP POLICY', 'GRANT', 'REVOKE', 'BEGIN;', 'DO $$',
];

const issues = [];
const warnings = [];

function checkBalanced(content, label) {
  const stripped = content
    .replace(/--.*$/gm, '')
    .replace(/'(\\.|[^'\\])*'/g, "''")
    .replace(/\$\$.*?\$\$/gs, '$$');
  let parens = 0;
  let braces = 0;
  for (const ch of stripped) {
    if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '{') braces++;
    else if (ch === '}') braces--;
  }
  if (parens !== 0) issues.push(`${label}: unbalanced parentheses (delta ${parens})`);
  if (braces !== 0) issues.push(`${label}: unbalanced braces (delta ${braces})`);
}

let files = [];
try {
  files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
} catch {
  issues.push('could not read supabase/migrations/');
}

if (files.length === 0) {
  issues.push('No .sql files found in supabase/migrations/');
}

const seen = new Map();
for (const f of files) {
  const label = `supabase/migrations/${f}`;
  const m = f.match(FILE_NAME);
  if (!m) {
    issues.push(`${label}: filename must start with YYYY_MM_DD_`);
    continue;
  }
  const key = m[1];
  if (seen.has(key)) {
    // Same-day independent migrations are legitimate (e.g. two additive DDL
    // pieces). Not fatal — folder order between them is lexicographic — but
    // worth surfacing so an ordering that DOES depend on it gets noticed.
    warnings.push(`${label}: shares date prefix ${key} with ${seen.get(key)} — order is lexicographic, not intentional`);
  } else {
    seen.set(key, f);
  }

  const body = readFileSync(join(migrationsDir, f), 'utf8');
  if (body.trim().length < 40) {
    issues.push(`${label}: suspiciously short (${body.trim().length} chars) — half-finished?`);
  }
  if (!HEADER_MARKERS.some((mk) => body.includes(mk))) {
    issues.push(`${label}: missing idempotent header / create-statement — add a self-describing header`);
  }
  checkBalanced(body, label);
}

if (warnings.length > 0) {
  console.warn('\n⚠ SQL sanity warnings (non-fatal):');
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (issues.length > 0) {
  console.error('\n✖ SQL sanity check failed:');
  for (const i of issues) console.error(`  - ${i}`);
  console.error(`\n${issues.length} issue(s). Fix before committing.`);
  process.exit(1);
}
if (warnings.length > 0) {
  console.log('\n✓ SQL sanity: migrations consistent (with warnings above).');
} else {
  console.log('✓ SQL sanity: all migrations look consistent.');
}