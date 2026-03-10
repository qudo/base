/**
 * GoMining API Map Capture
 *
 * Opens https://app.gomining.com in a headless Chromium browser,
 * intercepts all XHR/fetch network requests, and writes the full
 * log (URL, method, headers, response body) to gomining_api_map.json.
 *
 * Usage:
 *   npm install playwright
 *   npx playwright install chromium
 *   node capture.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://app.gomining.com';
const OUTPUT_FILE = path.join(__dirname, 'gomining_api_map.json');

// Extra seconds to wait after page load / scroll for background requests
const POST_LOAD_WAIT_MS = 8000;
const POST_SCROLL_WAIT_MS = 4000;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
    // Provide empty credentials so Playwright doesn't throw on HTTP-auth challenges
    httpCredentials: { username: '', password: '' },
  });

  const page = await context.newPage();

  // Dismiss any native auth / alert dialogs
  page.on('dialog', async (dialog) => {
    await dialog.dismiss().catch(() => {});
  });

  const requests = [];

  // ── Capture outgoing XHR / fetch requests ────────────────────────────────
  page.on('request', (req) => {
    if (!['xhr', 'fetch'].includes(req.resourceType())) return;

    requests.push({
      id: requests.length,
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      requestHeaders: req.headers(),
      postData: req.postData() ?? null,
      responseStatus: null,
      responseHeaders: null,
      responseBody: null,
      error: null,
    });
  });

  // ── Capture responses ─────────────────────────────────────────────────────
  page.on('response', async (res) => {
    if (!['xhr', 'fetch'].includes(res.request().resourceType())) return;

    // Match by URL + method + not yet filled
    const entry = requests.find(
      (r) =>
        r.url === res.url() &&
        r.method === res.request().method() &&
        r.responseStatus === null &&
        r.error === null
    );
    if (!entry) return;

    entry.responseStatus = res.status();
    entry.responseHeaders = res.headers();

    try {
      const buf = await res.body();
      const text = buf.toString('utf-8');
      try {
        entry.responseBody = JSON.parse(text);
      } catch {
        entry.responseBody = text;
      }
    } catch (err) {
      entry.error = `body read error: ${err.message}`;
    }
  });

  // ── Navigate ──────────────────────────────────────────────────────────────
  console.log(`Navigating to ${TARGET_URL} …`);
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 90_000 });
  } catch (err) {
    console.warn('Navigation warning:', err.message);
  }

  // Wait for background / deferred API calls
  console.log(`Waiting ${POST_LOAD_WAIT_MS / 1000}s for background requests …`);
  await page.waitForTimeout(POST_LOAD_WAIT_MS);

  // Scroll to bottom to trigger lazy-loaded sections
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(POST_SCROLL_WAIT_MS);

  await browser.close();

  const filled = requests.filter((r) => r.responseStatus !== null || r.error !== null);
  console.log(
    `Captured ${requests.length} XHR/fetch requests (${filled.length} with responses).`
  );

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  console.log(`Saved → ${OUTPUT_FILE}`);
})();
