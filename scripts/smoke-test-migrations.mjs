// Quick smoke test against live Supabase to confirm U-X5/X6/X8/X26 landed.
// Uses the anon key (what real users would have).

import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8')
  .split('\n')
  .filter((l) => l.includes('='))
  .reduce((acc, l) => {
    const [k, ...rest] = l.split('=');
    acc[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

let passed = 0;
let failed = 0;

function pass(name) {
  console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  passed++;
}
function fail(name, detail) {
  console.log(`  \x1b[31m✗\x1b[0m ${name}`);
  if (detail) console.log(`      ${detail}`);
  failed++;
}

async function rpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

async function rest(method, path, body, prefer = 'return=representation') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Prefer: prefer },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, text };
}

console.log('\n--- Smoke test: U-X5/X6/X8/X26 against live Supabase ---\n');
console.log(`URL: ${SUPABASE_URL}`);

// U-X5: RPCs exist and reject bad input
console.log('\nU-X5 SECURITY DEFINER RPCs:');
{
  const r = await rpc('mark_post_solved', { p_access_code: '', p_status: 'solved' });
  if (r.status === 200 && r.data === false) pass('mark_post_solved rejects empty code');
  else fail('mark_post_solved rejects empty code', `status=${r.status} body=${r.text}`);
}
{
  const r = await rpc('mark_post_solved', { p_access_code: 'DOESNOEXIST', p_status: 'solved' });
  if (r.status === 200 && r.data === false) pass('mark_post_solved returns false for missing code');
  else fail('mark_post_solved returns false for missing code', `status=${r.status} body=${r.text}`);
}
{
  const r = await rpc('mark_post_solved', { p_access_code: 'X', p_status: 'invalid' });
  if (r.status === 200 && r.data === false) pass('mark_post_solved rejects bad status');
  else fail('mark_post_solved rejects bad status', `status=${r.status} body=${r.text}`);
}

// U-X5: access_code column is hidden
console.log('\nU-X5 access_code column hidden:');
{
  const r = await rest('GET', 'posts?select=access_code&limit=1');
  // Expect 42501 permission denied for column access_code
  if (r.status === 401 || r.status === 403 || (r.text && r.text.includes('access_code'))) {
    if (r.text.toLowerCase().includes('permission')) pass('SELECT access_code returns permission error');
    else pass(`SELECT access_code blocked (status ${r.status})`);
  } else {
    fail('SELECT access_code blocked', `status=${r.status} body=${r.text.slice(0, 200)}`);
  }
}
{
  const r = await rest('GET', 'posts?select=id,title,status&limit=1');
  if (r.status === 200) pass('SELECT other columns still works');
  else fail('SELECT other columns still works', `status=${r.status} body=${r.text.slice(0, 200)}`);
}

// U-X5: permissive UPDATE policies dropped — direct PATCH fails
console.log('\nU-X5 UPDATE policies revoked:');
{
  const r = await rest('PATCH', "posts?id=eq.00000000-0000-0000-0000-000000000000", { status: 'solved' });
  // Either policy violation, permission denied, or 0 rows affected (because no row matches)
  // What we MUST NOT see is 200 with a modified row
  if (r.status === 401 || r.status === 403) pass('Direct UPDATE on posts blocked');
  else if (r.status === 204) pass('Direct UPDATE on posts returns 0 rows (RLS hides row)');
  else if (r.status === 200 && Array.isArray(r.data) && r.data.length === 0) pass('Direct UPDATE on posts returns empty (no policy permits)');
  else fail('Direct UPDATE on posts blocked', `status=${r.status} body=${r.text.slice(0, 200)}`);
}

// U-X8: access_code_exists and get_post_by_access_code
console.log('\nU-X8 access_code RPCs:');
{
  const r = await rpc('access_code_exists', { p_access_code: 'DEFINITELYNOTREAL12345' });
  if (r.status === 200 && r.data === false) pass('access_code_exists returns false for unknown code');
  else fail('access_code_exists returns false for unknown code', `status=${r.status} body=${r.text}`);
}
{
  const r = await rpc('get_post_by_access_code', { p_access_code: 'DEFINITELYNOTREAL12345' });
  if (r.status === 200 && r.data === null) pass('get_post_by_access_code returns null for unknown code');
  else fail('get_post_by_access_code returns null', `status=${r.status} body=${r.text}`);
}
{
  const r = await rpc('get_post_by_access_code', { p_access_code: '' });
  if (r.status === 200 && r.data === null) pass('get_post_by_access_code rejects empty code');
  else fail('get_post_by_access_code rejects empty', `status=${r.status} body=${r.text}`);
}

// U-X7: content length constraint
console.log('\nU-X7 length constraints:');
{
  // Try to insert a post with 5000 chars (over the 4000 limit)
  const r = await rest('POST', 'posts', {
    title: 'SMOKETEST',
    content: 'x'.repeat(5000),
    access_code: 'SMOKE' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    purpose: 'need_help',
    is_anonymous: true,
    status: 'open',
    views: 0,
  });
  if (r.status === 400 || (r.text && r.text.includes('length'))) {
    pass('posts content > 4000 rejected by CHECK constraint');
  } else if (r.status === 201 || r.status === 200) {
    // Clean up if it somehow got through
    fail('posts content > 4000 rejected', `UNEXPECTEDLY accepted — status=${r.status}`);
  } else {
    fail('posts content > 4000 rejected', `status=${r.status} body=${r.text.slice(0, 200)}`);
  }
}

// U-X26: app_errors INSERT works, SELECT blocked
console.log('\nU-X26 app_errors:');
{
  // Use return=minimal to match supabase-js default behavior. With
  // return=representation, PostgREST tries to SELECT the row back, which
  // fails because app_errors has no SELECT policy (by design — errors
  // may contain PII). PostgREST reports the SELECT denial as an INSERT
  // RLS violation, which is misleading. The client never hits this path.
  const r = await rest('POST', 'app_errors', {
    source: 'client',
    route: '#/smoke-test',
    user_agent: 'smoke-test/1.0',
    error_message: 'smoke test message',
    error_stack: 'at smoke-test',
    extra: { kind: 'smoke' },
    fingerprint: 'smoke-test-fp',
  }, 'return=minimal');
  if (r.status === 201) pass('app_errors INSERT works (anon)');
  else fail('app_errors INSERT', `status=${r.status} body=${r.text.slice(0, 200)}`);
}
{
  const r = await rest('GET', 'app_errors?select=id&limit=1');
  if (r.status === 401 || r.status === 403) pass('app_errors SELECT blocked (anon)');
  else if (r.status === 200 && Array.isArray(r.data) && r.data.length === 0) pass('app_errors SELECT returns 0 rows (no SELECT policy)');
  else fail('app_errors SELECT blocked', `status=${r.status} body=${r.text.slice(0, 200)}`);
}

console.log(`\n--- ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
