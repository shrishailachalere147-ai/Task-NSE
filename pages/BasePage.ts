import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * BasePage - Parent class for all Page Objects
 * Contains shared methods and utilities used across pages
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Navigate to a given URL
   */
  async goto(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(locator: Locator, timeout = 15_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Safe click - waits for element, then clicks
   */
  async safeClick(locator: Locator): Promise<void> {
    await this.waitForVisible(locator);
    await locator.click();
  }

  /**
   * Safe fill - clears and types into input
   */
  async safeFill(locator: Locator, text: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Get trimmed text content of an element
   */
  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    const text = await locator.textContent();
    return (text ?? '').trim();
  }

  /**
   * Get text content of all matching elements
   */
  async getAllTexts(locator: Locator): Promise<string[]> {
    await locator.first().waitFor({ state: 'visible' });
    const texts = await locator.allTextContents();
    return texts.map(t => t.trim()).filter(t => t.length > 0);
  }

  /**
   * Check if an element is visible on the page
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /**
   * Dismiss cookie banners / popups commonly found on NSE
   */
  async dismissPopupsIfPresent(): Promise<void> {
    const popupSelectors = [
      '[class*="cookie"] button[class*="accept"]',
      '[id*="cookie"] button[class*="accept"]',
      '.modal .close',
      '[data-dismiss="modal"]',
      'button:has-text("Accept")',
      'button:has-text("Got it")',
      'button:has-text("OK")',
    ];

    for (const selector of popupSelectors) {
      try {
        const popup = this.page.locator(selector).first();
        if (await popup.isVisible({ timeout: 2_000 })) {
          this.logger.info(`Dismissing popup: ${selector}`);
          await popup.click();
          await this.page.waitForTimeout(500);
        }
      } catch {
        // No popup with this selector, continue
      }
    }
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Take screenshot with a descriptive name
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    this.logger.info(`Taking screenshot: ${name}`);
    return this.page.screenshot({
      path: `reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: false,
    });
  }

  /**
   * Wait for network to be idle (no requests for 500ms)
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get count of elements matching locator
   */
  async getCount(locator: Locator): Promise<number> {
    return locator.count();
  }

  /**
   * Assert page URL contains expected string
   */
  async assertUrlContains(expectedText: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(expectedText));
  }

  /**
   * Assert element text contains expected string
   */
  async assertTextContains(locator: Locator, expectedText: string): Promise<void> {
    await expect(locator).toContainText(expectedText);
  }
}
