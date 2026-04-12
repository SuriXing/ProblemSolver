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

  test('past questions shows error placeholder for bogus access code', async ({ page }) => {
    // Intercept Supabase /rest/v1/posts GET — return 406 which supabase treats as error
    await page.route(/\/rest\/v1\/posts(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 406,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'PGRST116',
            details: 'The result contains 0 rows',
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned',
          }),
        });
        return;
      }
      // Let other methods pass (shouldn't happen but safe)
      await route.continue();
    });

    await page.goto('/#/past-questions');
    await expect(page.locator('#access-code-input')).toBeVisible({ timeout: 10000 });

    // Enter a bogus access code and submit
    await page.fill('#access-code-input', 'BOGUS123');
    await page.click('button[type="submit"]');

    // After the API response processes, the error placeholder SVG should appear
    // (alt="error" is set on the <img> in the error state)
    await expect(page.locator('img[alt="error"]')).toBeVisible({ timeout: 10000 });

    // And the fetched post card should NOT be shown
    await expect(page.locator('.ant-card')).not.toBeVisible();
  });

  test('past questions uppercases access code input automatically', async ({ page }) => {
    await page.goto('/#/past-questions');
    await expect(page.locator('#access-code-input')).toBeVisible({ timeout: 10000 });

    // Type lowercase
    await page.fill('#access-code-input', 'abc123');

    // Component has onChange that uppercases — value should be uppercase
    const value = await page.locator('#access-code-input').inputValue();
    expect(value).toBe('ABC123');
  });
});
