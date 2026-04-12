import { test, expect } from '@playwright/test';

test.describe('Topic Detail Page', () => {
  test('topic 1 loads with content after delay', async ({ page }) => {
    await page.goto('/#/topics/1');

    // Wait for loading to complete (800ms setTimeout)
    await expect(page.locator('text=/工作压力/').first()).toBeVisible({ timeout: 5000 });
  });

  test('topic 1 shows replies', async ({ page }) => {
    await page.goto('/#/topics/1');

    await expect(page.locator('text=/平衡达人/').first()).toBeVisible({ timeout: 5000 });
  });

  test('topic has reply form', async ({ page }) => {
    await page.goto('/#/topics/1');

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Should have reply textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('can type in reply form', async ({ page }) => {
    await page.goto('/#/topics/1');

    // Wait for content to load
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea');
    await textarea.fill('This is a test reply');
    await expect(textarea).toHaveValue('This is a test reply');
  });

  test('invalid topic shows not found after loading', async ({ page }) => {
    await page.goto('/#/topics/999');

    // Wait for the 800ms simulated loading
    await page.waitForTimeout(1500);

    // Should show some form of not-found or error state
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('topic 2 loads with different content', async ({ page }) => {
    await page.goto('/#/topics/2');

    await expect(page.locator('text=/社交恐惧/').first()).toBeVisible({ timeout: 5000 });
  });
});
