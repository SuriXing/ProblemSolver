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

  test('invalid topic shows topicNotFound state with return home link', async ({ page }) => {
    await page.goto('/#/topics/999');

    // After the 800ms simulated loading, the not-found state should appear.
    // TopicDetailPage checks hardcoded topicDetails[topicId] — topic 999 doesn't exist.
    // The component shows a returnHome link in the not-found state.
    await page.waitForTimeout(1500);

    // Verify the valid-topic content is NOT present
    await expect(page.locator('text=/工作压力/')).not.toBeVisible();
    await expect(page.locator('text=/社交恐惧/')).not.toBeVisible();

    // Verify the returnHome link IS present (only renders in not-found state)
    const returnHomeLink = page.locator('a[href="/"]').or(page.locator('text=/returnHome|返回首页/i'));
    await expect(returnHomeLink.first()).toBeVisible({ timeout: 3000 });
  });

  test('topic 2 loads with different content', async ({ page }) => {
    await page.goto('/#/topics/2');

    await expect(page.locator('text=/社交恐惧/').first()).toBeVisible({ timeout: 5000 });
  });
});
