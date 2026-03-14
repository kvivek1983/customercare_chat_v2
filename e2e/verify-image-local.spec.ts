import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';
const USERNAME = 'gaurav.tiwari.care';
const PASSWORD = 'ZII2K6B3DAVQ47IYPN';

test('Verify new WhatsApp image message in 9511556843 chat', async ({ page }) => {
  test.setTimeout(120000);

  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  // Intercept getDcoDetails to prevent forced logout (unrelated to media)
  await page.route('**/getDcoDetails', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 0, message: 'Mocked for test' }),
    });
  });

  // Login
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="text"]').first().fill(USERNAME);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);

  // Go to Partner chat
  await page.evaluate(() => { window.location.hash = '#/base/dcoChat'; });
  await page.waitForTimeout(5000);

  // Search for 9511556843
  const mobileInput = page.locator('input[formControlName="mobileNumber"], input[maxlength="10"]').first();
  await mobileInput.fill('9511556843');
  await page.locator('button:has-text("Search")').first().click();
  await page.waitForTimeout(5000);

  // Check search_chat response
  const searchLogs = consoleLogs.filter(l => l.includes('search_chat response'));
  console.log('\n=== search_chat response ===');
  searchLogs.forEach(l => console.log(l.substring(0, 1000)));

  // Click chat item
  const chatItem = page.locator('.chat-item').first();
  if (await chatItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    await chatItem.click();
    await page.waitForTimeout(10000);

    // Verify we're still on chat page (not redirected to login)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).not.toContain('login');

    // Get fetchChatsByUser logs
    const fetchLogs = consoleLogs.filter(l =>
      l.includes('fetchChatsByUser') || l.includes('fetch_chats_by_user')
    );
    console.log('\n=== fetchChatsByUser logs ===');
    fetchLogs.forEach(l => console.log(l.substring(0, 2000)));

    // Parse messages
    let allMessages: any[] = [];
    let mediaMessages: any[] = [];
    for (const log of fetchLogs) {
      if (!log.includes('response')) continue;
      const jsonMatch = log.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          if (data.messages) {
            allMessages = data.messages;
            mediaMessages = data.messages.filter((m: any) =>
              m.media_type || m.media || m.mediaUrl || m.media_url
            );
          }
        } catch (e) { /* */ }
      }
    }

    console.log(`\nTotal messages: ${allMessages.length}`);
    console.log(`Media messages: ${mediaMessages.length}`);
    if (allMessages.length > 0) {
      console.log('Most recent message:', JSON.stringify(allMessages[0]).substring(0, 500));
    }

    // DOM verification
    const mediaContainers = await page.locator('.media-container').count();
    const mediaErrors = await page.locator('.media-error').count();
    const visibleImgs = await page.locator('.media-container img:visible').count();
    const brokenImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.media-container img'))
        .filter(img => {
          const el = img as HTMLImageElement;
          return !el.hidden && (!el.complete || el.naturalHeight === 0);
        }).length
    );

    console.log(`\n=== DOM ===`);
    console.log(`Media containers: ${mediaContainers}`);
    console.log(`Visible images: ${visibleImgs}`);
    console.log(`Graceful errors: ${mediaErrors}`);
    console.log(`Broken images: ${brokenImgs}`);

    // No unhandled broken images
    expect(brokenImgs).toBe(0);
    // No debug logs
    expect(consoleLogs.filter(l => l.includes('[Media Message]')).length).toBe(0);

    // If media messages exist, verify rendering
    if (mediaMessages.length > 0) {
      expect(mediaContainers).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/verify-image-local.png', fullPage: true });
  } else {
    console.log('No chat found for 9511556843');
  }
});
