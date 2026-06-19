#!/usr/bin/env node
/**
 * Apply a Supabase migration through the Management API and verify it landed.
 *
 * Why this file exists: the email opt-in scaffold (post_notifications table +
 * opt_in_email_notification RPC) can't be applied to the live Supabase project
 * (AnonCafe-v2) while the project is paused. Once it's woken up, run this one
 * command instead of pasting SQL into the dashboard:
 *
 *   node scripts/apply-migration.mjs supabase/migrations/2026_06_19_post_notifications_table.sql
 *
 * It reads SUPABASE_ACCESS_TOKEN from ~/.env (quote-safe), probes the target
 * project first so "paused / not reachable" is reported clearly, applies the
 * whole migration as one request, then re-checks that the objects actually
 * exist before returning 0.
 *
 * Safety / notes:
 *   * Idempotent — re-running is harmless (migration uses CREATE ... IF NOT
 *     EXISTS / CREATE OR REPLACE). Safe to run repeatedly.
 *   * Target project defaults to AnonCafe-v2 (the one the live Vite app points
 *     at). Override with --project=<ref>.
 *   * The Management query endpoint allows DDL here; if a project's plan/role
 *     ever rejects DDL we fail loudly instead of pretending it worked.
 *   * Defaults to DRY-RUN (prints the SQL, does nothing). Pass --apply to run.
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Project ref for the live Supabase (AnonCafe-v2) the frontend connects to.
const DEFAULT_PROJECT = 'bihltxhebindflclsutw';
const API = 'https://api.supabase.com/v1';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const migrateFile = args.find((a) => !a.startsWith('--')) ||
  'supabase/migrations/2026_06_19_post_notifications_table.sql';
const project =
  (args.find((a) => a.startsWith('--project=')) || '').split('=')[1] || DEFAULT_PROJECT;

// ---------------------------------------------------------------------------
// Token: quoted-safe load from ~/.env
// ---------------------------------------------------------------------------
function loadToken() {
  const envFile = join(homedir(), '.env');
  if (!existsSync(envFile)) {
    console.error(`✖ ~/.env not found (${envFile})`);
    process.exit(1);
  }
  for (const raw of readFileSync(envFile, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('SUPABASE_ACCESS_TOKEN=')) {
      return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  console.error('✖ SUPABASE_ACCESS_TOKEN not found in ~/.env');
  process.exit(1);
}

async function supabase(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': BROWSER_UA, // Cloudflare blocks curl/node default UA
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function query(sql) {
  const { status, text } = await supabase(`/projects/${project}/database/query`, { query: sql });
  if (status >= 200 && status < 300) return { ok: true, text };
  return { ok: false, status, text };
}

const token = loadToken();

// ---------------------------------------------------------------------------
// 1. Probe — distinguish "paused" from "migration rejected".
// ---------------------------------------------------------------------------
console.log(`Target project: ${project}`);
const probe = await query('select 1;');
if (!probe.ok) {
  console.error(
    `✖ Project is not reachable right now (HTTP ${probe.status}).\n` +
      `  ${probe.text.slice(0, 160)}\n\n` +
      `  AnonCafe-v2 tends to be PAUSED after idle days. Wake it up in the Supabase\n` +
      `  dashboard, wait for status = ACTIVE, then re-run this.`
  );
  process.exit(1);
}
console.log('   database reachable (select 1 OK)');

if (!existsSync(migrateFile)) {
  console.error(`✖ Migration file not found: ${migrateFile}`);
  process.exit(1);
}
const sql = readFileSync(migrateFile, 'utf8');

if (!apply) {
  console.log(`\n(dry run -- add --apply to actually run)\nMigration file: ${migrateFile}`);
  console.log(sql.slice(0, 600) + (sql.length > 600 ? '\n  ...' : ''));
  console.log('\nDry run finished. Re-run with --apply to execute against Supabase.');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Apply (one request; migration is idempotent).
// ---------------------------------------------------------------------------
console.log(`Applying ${migrateFile} ...`);
const run = await query(sql);
if (!run.ok) {
  console.error(`✖ Migration failed (HTTP ${run.status}):\n${run.text}`);
  process.exit(1);
}
console.log('   migration applied (HTTP 201/200)');

// ---------------------------------------------------------------------------
// 3. Verify the objects actually landed.
// ---------------------------------------------------------------------------
const verify = await query(
  `select
     to_regclass('public.post_notifications') as tbl,
     to_regprocedure('public.opt_in_email_notification(text, text)') as fn;`
);
if (verify.ok) {
  const row = JSON.parse(verify.text || '[]')[0] || {};
  const tbl = row.tbl ? 'post_notifications' : null;
  const fn = row.fn ? 'opt_in_email_notification(text,text)' : null;
  if (tbl && fn) {
    console.log(`   ✓ verified: ${tbl} and ${fn} exist`);
    process.exit(0);
  } else {
    console.error(`   ✖ applied but not found: tbl=${tbl} fn=${fn}`);
    process.exit(1);
  }
} else {
  console.error(`✖ could not verify (HTTP ${verify.status}): ${verify.text}`);
  process.exit(1);
}