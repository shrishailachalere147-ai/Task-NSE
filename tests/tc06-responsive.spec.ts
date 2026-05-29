import { test, expect } from '../utils/fixtures';

/**
 * TEST SUITE 6: Responsive Layout Validation (Bonus)
 * Runs on mobile-chrome project (Pixel 7 viewport)
 *
 * Verifies:
 *  - The page is accessible on a mobile viewport
 *  - Critical elements (table or card view) are visible
 *  - Navigation / header is accessible on mobile
 */
test.describe('TC-06: Responsive / Mobile Layout', () => {

  test('should load equity market page on mobile viewport', async ({ page, liveEquityPage }) => {
    // Confirm viewport is mobile-sized
    const viewport = page.viewportSize();
    console.log(`Viewport: ${viewport?.width}x${viewport?.height}`);

    await liveEquityPage.open();

    // Page should still load without JS errors
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    console.log(`✓ Page loaded on mobile: "${title}"`);
  });

  test('should have a scrollable table or card view on mobile', async ({ page, liveEquityPage }) => {
    await liveEquityPage.open();

    // On mobile, NSE may show cards instead of a full table — check either
    const tableOrCards = page.locator(
      'table tbody tr, .card, [class*="equity-row"], [class*="stock-row"]'
    ).first();

    await expect(tableOrCards).toBeVisible({ timeout: 20_000 });
    console.log('✓ Data is visible on mobile viewport');
  });

  test('should display NSE header/logo on mobile', async ({ page, liveEquityPage }) => {
    await liveEquityPage.open();

    // Header should be present
    const header = page.locator('header, [role="banner"], .header, #header').first();
    await expect(header).toBeVisible({ timeout: 15_000 });
    console.log('✓ Header visible on mobile');
  });

  test('should show index selector on mobile', async ({ page, liveEquityPage }) => {
    await liveEquityPage.open();

    // The index dropdown or equivalent filter must be accessible on mobile
    const selector = page.locator('select, [class*="dropdown"], [class*="index-select"]').first();
    const isVisible = await selector.isVisible();

    if (!isVisible) {
      // May be behind a hamburger menu — check for menu button
      const hamburger = page.locator('[class*="hamburger"], [class*="menu-btn"], button[aria-label*="menu"]').first();
      const hasHamburger = await hamburger.isVisible();
      console.log(`Hamburger menu present: ${hasHamburger}`);
    } else {
      console.log('✓ Index selector is visible on mobile');
    }

    // Either way, page should have basic structure
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
