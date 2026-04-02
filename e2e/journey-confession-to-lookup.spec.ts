import { test, expect, Route } from '@playwright/test';

/**
 * REAL end-to-end user journey:
 *   1. User writes a confession on /confession
 *   2. Submits the form
 *   3. Gets redirected to /success with the access code displayed
 *   4. Navigates to /past-questions
 *   5. Enters the access code
 *   6. Sees their ORIGINAL confession content rendered back
 *
 * This test uses Playwright network interception to mock Supabase responses.
 * The mock maintains a simulated database that persists across requests within
 * the test, so the "lookup after submit" step returns the same content submitted.
 */
test.describe('Journey: confession submit → access code → lookup', () => {
  test('user submits confession, receives code, looks it up, sees original content', async ({ page }) => {
    // ---------- Simulated Supabase DB ----------
    const fakePosts: Record<string, any> = {};
    const FIXED_ACCESS_CODE = 'E2EJRNY1';

    // Shared route handler for all Supabase /rest/v1/posts requests
    await page.route(/\/rest\/v1\/posts(\?.*)?$/, async (route: Route) => {
      const request = route.request();
      const method = request.method();
      const url = request.url();

      if (method === 'HEAD') {
        // Connection test: supabase.from('posts').select('count', { head: true })
        await route.fulfill({
          status: 200,
          headers: { 'content-range': '0-0/0' },
          body: '',
        });
        return;
      }

      if (method === 'POST') {
        // createPost insert: body is JSON array with one post object
        const body = request.postDataJSON();
        const incoming = Array.isArray(body) ? body[0] : body;
        const savedPost = {
          id: 'fake-post-id-' + Date.now(),
          ...incoming,
          access_code: FIXED_ACCESS_CODE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          replies: [],
        };
        fakePosts[FIXED_ACCESS_CODE] = savedPost;

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(savedPost),
        });
        return;
      }

      if (method === 'GET') {
        // Parse access_code from query: ?access_code=eq.XXX
        const accessCodeMatch = url.match(/access_code=eq\.([A-Z0-9]+)/);
        if (accessCodeMatch) {
          const code = accessCodeMatch[1];
          // uniqueness check during generateAccessCode returns null (unique)
          // OR the getPostByAccessCode returns the saved post
          if (fakePosts[code]) {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(fakePosts[code]),
            });
            return;
          }
          // Not found — return PGRST116 shape as supabase would
          await route.fulfill({
            status: 406,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PGRST116',
              message: 'No rows',
              details: null,
              hint: null,
            }),
          });
          return;
        }

        // Generic select (e.g., purpose filter) — return empty array
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      // Fallback
      await route.continue();
    });

    // Also handle /rest/v1/replies for the details page
    await page.route(/\/rest\/v1\/replies(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // ---------- STEP 1: Submit a confession ----------
    const confessionText = 'E2E JOURNEY: I am anxious about my upcoming exam and need advice';

    await page.goto('/#/confession');
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 10000 });

    // Fill the confession
    await page.fill('.confession-textarea', confessionText);
    expect(await page.locator('.confession-textarea').inputValue()).toBe(confessionText);

    // Take screenshot as evidence: form filled
    await page.screenshot({ path: 'test-results/journey-01-form-filled.png' });

    // Submit the form — click the submit button
    await page.locator('button[type="submit"]').click();

    // ---------- STEP 2: Verify redirect to /success with access code ----------
    await page.waitForURL(/\/#\/success/, { timeout: 10000 });
    expect(page.url()).toContain('/success');

    // Access code should be displayed
    await expect(page.locator('#access-code')).toHaveText(FIXED_ACCESS_CODE, { timeout: 10000 });

    // Screenshot: success page with code
    await page.screenshot({ path: 'test-results/journey-02-success-page.png' });

    // ---------- STEP 3: Navigate to past-questions and look up by code ----------
    await page.goto('/#/past-questions');
    await expect(page.locator('#access-code-input')).toBeVisible({ timeout: 10000 });

    await page.fill('#access-code-input', FIXED_ACCESS_CODE);
    await page.locator('button[type="submit"]').click();

    // ---------- STEP 4: Verify the ORIGINAL confession content is displayed ----------
    // The PastQuestionsPage should render an Ant Card with the post content
    await expect(page.locator('.ant-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${confessionText}`)).toBeVisible({ timeout: 5000 });

    // Screenshot: lookup result showing original content
    await page.screenshot({ path: 'test-results/journey-03-lookup-result.png' });

    // ---------- STEP 5: Verify round-trip integrity ----------
    // The content shown on /past-questions must EXACTLY match what was submitted
    const renderedContent = await page.locator('.ant-card').first().textContent();
    expect(renderedContent).toContain(confessionText);
  });
});
