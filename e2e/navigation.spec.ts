import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads and shows hero content', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('.hero-title')).toBeVisible({ timeout: 10000 });
  });

  test('navigates to confession page', async ({ page }) => {
    await page.goto('/#/');
    await page.click('.option-card:first-child');
    await expect(page).toHaveURL(/confession/);
  });

  test('navigates to help page', async ({ page }) => {
    await page.goto('/#/');
    await page.click('.option-card:nth-child(2)');
    await expect(page).toHaveURL(/help/);
  });

  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/#/nonexistent-page');
    await expect(page.locator('text=404')).toBeVisible({ timeout: 10000 });
  });

  test('past questions page loads', async ({ page }) => {
    await page.goto('/#/past-questions');
    // The page has an access code input
    await expect(page.locator('#access-code-input')).toBeVisible({ timeout: 10000 });
  });

  test('admin login page loads', async ({ page }) => {
    await page.goto('/#/admin/login');
    await expect(page.locator('text=/登录|login/i')).toBeVisible({ timeout: 10000 });
  });
});
