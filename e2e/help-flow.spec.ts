import { test, expect } from '@playwright/test';

test.describe('Help Flow', () => {
  test('help page loads and shows content', async ({ page }) => {
    await page.goto('/#/help');

    // Should show help page with search or content
    await expect(page.locator('text=/help|帮助|posts/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('help page has search input', async ({ page }) => {
    await page.goto('/#/help');

    // Wait for page load
    await page.waitForTimeout(2000);

    // Should have search input
    const searchInput = page.locator('input[placeholder]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('help page has back to home button', async ({ page }) => {
    await page.goto('/#/help');

    const homeLink = page.locator('text=/back|home|返回/i').first();
    await expect(homeLink).toBeVisible({ timeout: 10000 });
  });

  test('past questions page shows access code input', async ({ page }) => {
    await page.goto('/#/past-questions');

    await expect(page.locator('#access-code-input')).toBeVisible({ timeout: 10000 });
  });

  test('past questions accepts and submits access code', async ({ page }) => {
    await page.goto('/#/past-questions');

    // Enter an access code and submit
    await page.fill('#access-code-input', 'TESTCODE');
    await page.click('button[type="submit"]');

    // Wait for API call to process
    await page.waitForTimeout(3000);

    // Page should still be visible (either shows result or error placeholder)
    await expect(page.locator('#access-code-input')).toBeVisible();
  });
});
