import { test, expect } from '@playwright/test';

test.describe('Success Pages', () => {
  test('success page shows access code section', async ({ page }) => {
    // Navigate to success page with state (simulated via localStorage)
    await page.goto('/#/');
    await page.evaluate(() => {
      localStorage.setItem('accessCode', 'TEST1234');
    });
    await page.goto('/#/success');

    // Should show the access code
    await expect(page.locator('text=TEST1234')).toBeVisible({ timeout: 10000 });
  });

  test('success page copy button copies access code to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/');
    await page.evaluate(() => {
      localStorage.setItem('accessCode', 'CLIP2345');
    });
    await page.goto('/#/success');

    // Wait for the access code to render in the #access-code span
    await expect(page.locator('#access-code')).toHaveText('CLIP2345', { timeout: 10000 });

    // The copy button is the button immediately adjacent to #access-code
    const copyBtn = page.locator('#access-code + button');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify the real browser clipboard now contains the access code
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('CLIP2345');
  });

  test('help success page shows stats', async ({ page }) => {
    await page.goto('/#/help-success');

    // Should show helper stats
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=42').first()).toBeVisible({ timeout: 10000 });
  });

  test('help success page has continue helping link', async ({ page }) => {
    await page.goto('/#/help-success');

    // Should have link to continue helping
    await expect(page.locator('a[href*="help"]').first()).toBeVisible({ timeout: 10000 });
  });
});
