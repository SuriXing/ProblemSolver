#!/usr/bin/env node
/**
 * U-X23 load test — simulate 1,000 users over a compressed 5-minute window.
 *
 * Model (from runbook ship-ready-a-plus.md, 1K-user definition):
 *   - 1,000 unique users over 7 days, peak concurrency ≤ 20
 *   - Per user: 1 confession submit + 3 lookups + maybe 2 replies + 6 reply reads
 *   - Critical paths to measure:
 *     1. POST /rest/v1/posts (createPost)
 *     2. GET /rest/v1/posts?access_code=eq.X (lookup)
 *     3. POST /rest/v1/replies (createReply)
 *
 * Compression: 1,000 users / (5 minutes × 60 seconds) ≈ 3.3 user starts/sec.
 * With each user issuing ~12 requests, that's ~40 req/sec average, with bursts
 * up to ~20 concurrent. This is the realistic load shape.
 *
 * Acceptance criteria:
 *   - p95 latency < 2000ms for all 3 paths
 *   - Error rate < 0.5% over the 5-minute window
 *   - No HTTP 5xx responses
 *
 * Output:
 *   test-results/load/load-test.json — full results
 *   stdout — per-path summary
 *
 * Usage:
 *   node scripts/load-test.mjs [--users N] [--duration-sec S] [--concurrency C]
 *
 * Defaults: --users 1000 --duration-sec 300 --concurrency 20
 *
 * SAFETY: this hits the LIVE Supabase project. It will create real (test)
 * rows. They have a recognizable prefix `LOADTEST-` so they can be deleted
 * later via the admin dashboard or directly in SQL Editor.
 */

import fs from 'node:fs';
import path from 'node:path';
import { argv } from 'node:process';

// ----- config -----
function arg(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
}
const USERS = parseInt(arg('users', '1000'), 10);
const DURATION_SEC = parseInt(arg('duration-sec', '300'), 10);
const CONCURRENCY = parseInt(arg('concurrency', '20'), 10);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bihltxhebindflclsutw.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ochy1eHzpFRMSCOndm3FQg_mLvGhDrL';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// ----- timing helpers -----
const samples = {
  createPost: [],
  lookupPost: [],
  createReply: [],
};
const errors = {
  createPost: 0,
  lookupPost: 0,
  createReply: 0,
};
const status = { '2xx': 0, '4xx': 0, '5xx': 0, network: 0 };

function p(arr, q) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((q / 100) * sorted.length));
  return sorted[idx];
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'LT';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

async function timed(label, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const ms = performance.now() - start;
    samples[label].push(ms);
    if (res.ok) {
      status['2xx']++;
    } else if (res.status >= 500) {
      status['5xx']++;
      errors[label]++;
    } else {
      status['4xx']++;
      errors[label]++;
    }
    return res;
  } catch (err) {
    const ms = performance.now() - start;
    samples[label].push(ms);
    status.network++;
    errors[label]++;
    return null;
  }
}

// ----- one synthetic user journey -----
async function runUser(userIdx) {
  const accessCode = randomCode();
  // 1. Submit a confession
  const postRes = await timed('createPost', () =>
    fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'LOADTEST',
        content: `LOADTEST-${userIdx}-${Date.now()}`,
        is_anonymous: true,
        tags: ['loadtest'],
        status: 'open',
        purpose: 'need_help',
        access_code: accessCode,
        views: 0,
      }),
    })
  );

  let postId = null;
  if (postRes && postRes.ok) {
    try {
      const data = await postRes.json();
      postId = Array.isArray(data) ? data[0]?.id : data?.id;
    } catch {}
  }

  // 2. Look up the post 3 times (matches the user model)
  for (let i = 0; i < 3; i++) {
    await timed('lookupPost', () =>
      fetch(
        `${SUPABASE_URL}/rest/v1/posts?select=*,replies(*)&access_code=eq.${accessCode}`,
        { headers }
      )
    );
  }

  // 3. Maybe submit 2 replies (50% of users)
  if (postId && Math.random() > 0.5) {
    for (let i = 0; i < 2; i++) {
      await timed('createReply', () =>
        fetch(`${SUPABASE_URL}/rest/v1/replies`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            post_id: postId,
            content: `LOADTEST-reply-${userIdx}-${i}`,
            is_anonymous: true,
            is_solution: false,
          }),
        })
      );
    }
  }
}

// ----- the scheduler -----
async function main() {
  console.log('=== U-X23 load test ===');
  console.log(`users=${USERS}  duration=${DURATION_SEC}s  concurrency=${CONCURRENCY}`);
  console.log(`target=${SUPABASE_URL}\n`);

  const startTime = Date.now();
  const interval = (DURATION_SEC * 1000) / USERS; // ms between user starts
  let started = 0;
  let inflight = 0;
  let nextUserIdx = 0;

  return new Promise((resolve) => {
    const tick = setInterval(async () => {
      // Throttle by concurrency
      while (started < USERS && inflight < CONCURRENCY) {
        const idx = nextUserIdx++;
        started++;
        inflight++;
        runUser(idx).finally(() => {
          inflight--;
        });
      }

      // Periodic progress
      const elapsed = (Date.now() - startTime) / 1000;
      if (started % 100 === 0 || started === USERS) {
        process.stdout.write(
          `\r[${elapsed.toFixed(1)}s] users started=${started}/${USERS} inflight=${inflight} `
        );
      }

      if (started >= USERS && inflight === 0) {
        clearInterval(tick);
        process.stdout.write('\n\n');
        resolve();
      }
    }, Math.max(1, interval));
  });
}

await main();

// ----- report -----
const report = {
  config: { users: USERS, durationSec: DURATION_SEC, concurrency: CONCURRENCY },
  status,
  paths: {},
  acceptance: {},
};

for (const path of ['createPost', 'lookupPost', 'createReply']) {
  const arr = samples[path];
  const errs = errors[path];
  report.paths[path] = {
    count: arr.length,
    errors: errs,
    errorRate: arr.length > 0 ? errs / arr.length : 0,
    p50_ms: Math.round(p(arr, 50)),
    p95_ms: Math.round(p(arr, 95)),
    p99_ms: Math.round(p(arr, 99)),
    max_ms: Math.round(arr.length > 0 ? Math.max(...arr) : 0),
  };
}

// Acceptance check (per runbook U-X23)
const totalErrors = Object.values(errors).reduce((a, b) => a + b, 0);
const totalRequests = Object.values(samples).reduce((a, b) => a + b.length, 0);
const overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

report.acceptance = {
  p95UnderTwoSeconds: Object.values(report.paths).every((p) => p.p95_ms < 2000),
  errorRateUnderHalfPercent: overallErrorRate < 0.005,
  noFiveHundreds: status['5xx'] === 0,
  pass:
    Object.values(report.paths).every((p) => p.p95_ms < 2000) &&
    overallErrorRate < 0.005 &&
    status['5xx'] === 0,
  totalErrorRate: overallErrorRate,
};

const outDir = 'test-results/load';
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'load-test.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`\n=== Load test report ===`);
console.log(`Output: ${outPath}\n`);
console.log(`Status:`, status);
console.log(`\nPer-path latency:`);
for (const [name, p] of Object.entries(report.paths)) {
  const flag = p.p95_ms < 2000 ? '✓' : '✗';
  console.log(
    `  ${flag} ${name.padEnd(12)} count=${String(p.count).padStart(5)} ` +
      `p50=${String(p.p50_ms).padStart(4)}ms p95=${String(p.p95_ms).padStart(4)}ms ` +
      `p99=${String(p.p99_ms).padStart(4)}ms errors=${p.errors}`
  );
}
console.log(`\nOverall error rate: ${(overallErrorRate * 100).toFixed(2)}%`);
console.log(`Acceptance: ${report.acceptance.pass ? '✅ PASS' : '❌ FAIL'}`);

if (!report.acceptance.pass) {
  console.log('\nFailures:');
  if (!report.acceptance.p95UnderTwoSeconds) console.log('  - p95 latency exceeds 2000ms on at least one path');
  if (!report.acceptance.errorRateUnderHalfPercent)
    console.log(`  - error rate ${(overallErrorRate * 100).toFixed(2)}% > 0.5%`);
  if (!report.acceptance.noFiveHundreds) console.log(`  - ${status['5xx']} HTTP 5xx responses`);
}

console.log(
  `\n⚠️  Test data created: search for posts with content 'LOADTEST-*'. Clean up via SQL Editor:`
);
console.log(`    DELETE FROM replies WHERE content LIKE 'LOADTEST-reply-%';`);
console.log(`    DELETE FROM posts WHERE content LIKE 'LOADTEST-%';`);

process.exit(report.acceptance.pass ? 0 : 1);
