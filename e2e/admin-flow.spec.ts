import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('admin login page renders form', async ({ page }) => {
    await page.goto('/#/admin/login');

    // Should show login form
    await expect(page.locator('input[placeholder*="用户名"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('admin login with correct credentials', async ({ page }) => {
    await page.goto('/#/admin/login');

    // Fill in credentials
    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');

    // Submit
    await page.click('button[type="submit"]');

    // Should navigate to dashboard
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 10000 });
  });

  test('admin login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/#/admin/login');

    await page.fill('input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error alert
    await expect(page.locator('.ant-alert-error')).toBeVisible({ timeout: 5000 });
  });

  test('admin dashboard is protected', async ({ page }) => {
    // Clear any existing session
    await page.goto('/#/');
    await page.evaluate(() => localStorage.clear());

    // Try to access dashboard directly
    await page.goto('/#/admin/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/admin\/login/, { timeout: 10000 });
  });

  test('return home from login page', async ({ page }) => {
    await page.goto('/#/admin/login');

    // Click return home link
    const homeLink = page.locator('text=/返回首页|home/i');
    await homeLink.click();

    await expect(page).toHaveURL(/\/#\/?$/, { timeout: 5000 });
  });
});
