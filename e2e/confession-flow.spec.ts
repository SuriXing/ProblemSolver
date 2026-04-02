import { test, expect } from '@playwright/test';

test.describe('Confession Flow', () => {
  test('confession form has required elements', async ({ page }) => {
    await page.goto('/#/confession');

    // Wait for form to load
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // Check form elements exist
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation error for empty submission', async ({ page }) => {
    await page.goto('/#/confession');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });

  test('can type in confession textarea', async ({ page }) => {
    await page.goto('/#/confession');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    await page.fill('textarea', 'This is a test confession for E2E testing');
    await expect(page.locator('textarea')).toHaveValue('This is a test confession for E2E testing');
  });

  test('can select tags', async ({ page }) => {
    await page.goto('/#/confession');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // Click on tag buttons
    const tagButtons = page.locator('.tag-chip');
    const count = await tagButtons.count();
    if (count > 0) {
      await tagButtons.first().click();
      await expect(tagButtons.first()).toHaveClass(/selected/);
    }
  });

  test('return home button navigates back', async ({ page }) => {
    await page.goto('/#/confession');
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // Click return home button
    const homeButton = page.locator('text=/return|home|返回/i').first();
    await homeButton.click();

    await expect(page).toHaveURL(/\/#\/?$/);
  });
});
