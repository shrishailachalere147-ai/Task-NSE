import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage - Page Object for NSE India Home Page
 * URL: https://www.nseindia.com/
 */
export class HomePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly searchInput: Locator;
  readonly searchSuggestions: Locator;
  readonly searchSuggestionItems: Locator;
  readonly mainNav: Locator;
  readonly marketDataMenu: Locator;
  readonly liveEquityLink: Locator;
  readonly headerLogo: Locator;
  readonly breadcrumb: Locator;
  readonly nifty50Ticker: Locator;
  readonly sensexTicker: Locator;
  readonly tickerBar: Locator;

  constructor(page: Page) {
    super(page);

    this.searchInput        = page.locator('input#searchBox, input[placeholder*="Search"], input[id*="search"]').first();
    this.searchSuggestions  = page.locator('.search-dropdown, .autocomplete-items, ul[class*="suggest"]');
    this.searchSuggestionItems = page.locator('.search-dropdown li, .autocomplete-items li, ul[class*="suggest"] li');
    this.mainNav            = page.locator('nav, .main-nav, #main-nav');
    this.marketDataMenu     = page.locator('a:has-text("Market Data"), a[href*="market-data"]').first();
    this.liveEquityLink     = page.locator('a:has-text("Live Equity Market"), a[href*="live-equity"]').first();
    this.headerLogo         = page.locator('img[alt*="NSE"], .header-logo, #logo').first();
    this.nifty50Ticker      = page.locator('[class*="nifty"], [data-symbol="NIFTY 50"]').first();
    this.tickerBar          = page.locator('.ticker-wrap, .marquee, [class*="ticker"]').first();
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /**
   * Open the NSE India home page
   */
  async open(): Promise<void> {
    await this.goto('https://www.nseindia.com/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissPopupsIfPresent();
    this.logger.info('NSE Home Page loaded');
  }

  /**
   * Navigate directly to Live Equity Market page
   */
  async navigateToLiveEquityMarket(): Promise<void> {
    await this.goto('https://www.nseindia.com/market-data/live-equity-market');
    await this.page.waitForLoadState('domcontentloaded');
    this.logger.info('Navigated to Live Equity Market');
  }

  // ── Search ───────────────────────────────────────────────────────────────────

  /**
   * Search for a stock symbol or company name
   */
  async searchForStock(query: string): Promise<void> {
    this.logger.info(`Searching for: ${query}`);
    await this.waitForVisible(this.searchInput);
    await this.safeFill(this.searchInput, query);
    // Wait for autocomplete to appear (network-driven, no hardcoded wait)
    await this.searchSuggestionItems.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Get all suggestion texts from the search dropdown
   */
  async getSearchSuggestions(): Promise<string[]> {
    await this.searchSuggestionItems.first().waitFor({ state: 'visible', timeout: 10_000 });
    return this.getAllTexts(this.searchSuggestionItems);
  }

  /**
   * Click the first suggestion in the search dropdown
   */
  async selectFirstSuggestion(): Promise<void> {
    await this.searchSuggestionItems.first().waitFor({ state: 'visible' });
    await this.searchSuggestionItems.first().click();
  }

  /**
   * Select a specific suggestion by its visible text
   */
  async selectSuggestionByText(text: string): Promise<void> {
    const item = this.searchSuggestionItems.filter({ hasText: text }).first();
    await this.waitForVisible(item);
    await item.click();
  }

  /**
   * Assert the page loaded with NSE branding
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/NSE/i);
    this.logger.info('Home page load assertion passed');
  }

  /**
   * Assert ticker bar is present and has content
   */
  async assertTickerPresent(): Promise<void> {
    const tickerItems = this.page.locator('.ticker-wrap span, .marquee span, [class*="ticker"] span');
    await expect(tickerItems.first()).toBeVisible({ timeout: 15_000 });
    this.logger.info('Ticker bar is visible');
  }
}
