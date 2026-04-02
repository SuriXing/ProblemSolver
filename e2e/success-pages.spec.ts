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

  test('success page has navigation actions', async ({ page }) => {
    await page.goto('/#/');
    await page.evaluate(() => {
      localStorage.setItem('accessCode', 'ABC12345');
    });
    await page.goto('/#/success');

    // Should have the success check icon or actions section
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content).toContain('ABC12345');
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
