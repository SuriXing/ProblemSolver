// Take a screenshot of the admin dashboard's posts tab using an authenticated session.
// Logs in as the admin (creds via env), navigates to /admin/dashboard, screenshots.
//
// Usage:
//   ADMIN_EMAIL=surixing@outlook.com ADMIN_PASSWORD='...' node scripts/screenshot-dashboard.mjs
//   (optional --base https://anoncafe.life)

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const args = process.argv.slice(2);
const baseFlag = args.indexOf('--base');
const base = baseFlag >= 0 ? args[baseFlag + 1] : 'http://localhost:3000';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.');
  process.exit(2);
}

const outDir = 'test-results/launch';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

console.log(`Login flow: ${base}`);
await page.goto(`${base}/#/admin/login`, { waitUntil: 'networkidle' });
await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();

await page.waitForURL(/#\/admin\/dashboard/, { timeout: 15000 });
await page.waitForTimeout(1500); // Let stats + posts + replies load

// Switch to posts tab
const postsTab = page.getByRole('tab', { name: /帖子管理/ });
await postsTab.click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/dashboard-posts-new.png`, fullPage: true });
console.log(`Saved: ${outDir}/dashboard-posts-new.png`);

// Switch to comments tab
const commentsTab = page.getByRole('tab', { name: /评论管理/ });
await commentsTab.click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/dashboard-comments.png`, fullPage: true });
console.log(`Saved: ${outDir}/dashboard-comments.png`);

await browser.close();
console.log('Done.');
