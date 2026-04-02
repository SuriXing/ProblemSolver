import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
const page = await ctx.newPage();

const pages = [
  { name: 'home', url: 'http://localhost:3000/#/' },
  { name: 'confession', url: 'http://localhost:3000/#/confession' },
  { name: 'help', url: 'http://localhost:3000/#/help' },
  { name: 'past-questions', url: 'http://localhost:3000/#/past-questions' },
  { name: 'admin-login', url: 'http://localhost:3000/#/admin/login' },
];

const dir = 'test-results/u-x2-after';
const fs = await import('node:fs');
fs.mkdirSync(dir, { recursive: true });

const results = [];
for (const p of pages) {
  await page.goto(p.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dir}/${p.name}-375x667.png`, fullPage: true });

  // Measure horizontal scroll
  const metrics = await page.evaluate(() => ({
    docWidth: document.documentElement.scrollWidth,
    viewWidth: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  results.push({ page: p.name, ...metrics });
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
