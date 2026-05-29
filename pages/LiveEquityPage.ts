import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TableUtils } from '../utils/tableUtils';

/**
 * LiveEquityPage - Page Object for NSE Live Equity Market page
 * URL: https://www.nseindia.com/market-data/live-equity-market
 */
export class LiveEquityPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly pageTitle: Locator;
  readonly indexDropdown: Locator;
  readonly equityTable: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly tableBody: Locator;
  readonly searchFilter: Locator;
  readonly downloadCSVBtn: Locator;
  readonly paginationContainer: Locator;
  readonly nextPageBtn: Locator;
  readonly prevPageBtn: Locator;
  readonly pageNumbers: Locator;
  readonly loadingSpinner: Locator;
  readonly noDataMessage: Locator;
  readonly lastUpdatedTime: Locator;
  readonly columnSortBtns: Locator;

  // Index selector options
  readonly nifty50Option: Locator;
  readonly niftyBankOption: Locator;
  readonly niftyITOption: Locator;
  readonly niftyNextOption: Locator;

  private readonly tableUtils: TableUtils;

  constructor(page: Page) {
    super(page);
    this.tableUtils = new TableUtils(page);

    // Page elements
    this.pageTitle           = page.locator('h1, .page-title, [class*="page-header"] h1').first();
    this.indexDropdown       = page.locator('select#equityStockSelect, select[id*="equity"], select[name*="index"], .index-select select').first();
    this.equityTable         = page.locator('#equityStockTable, table[id*="equity"], .equity-table table, table.dataTable').first();
    this.tableHeaders        = page.locator('#equityStockTable thead th, table[id*="equity"] thead th, .equity-table thead th');
    this.tableBody           = page.locator('#equityStockTable tbody, table[id*="equity"] tbody, .equity-table tbody');
    this.tableRows           = page.locator('#equityStockTable tbody tr, table[id*="equity"] tbody tr, .equity-table tbody tr');
    this.searchFilter        = page.locator('input[type="search"], input[placeholder*="Search"], #equityStockTable_filter input').first();
    this.downloadCSVBtn      = page.locator('button:has-text("Download"), a:has-text("Download"), [class*="download"]').first();
    this.paginationContainer = page.locator('.dataTables_paginate, [class*="pagination"], nav[aria-label*="pagination"]').first();
    this.nextPageBtn         = page.locator('.dataTables_paginate .next, [class*="pagination"] .next, button[aria-label="Next"]').first();
    this.prevPageBtn         = page.locator('.dataTables_paginate .previous, [class*="pagination"] .previous, button[aria-label="Previous"]').first();
    this.pageNumbers         = page.locator('.dataTables_paginate span a, [class*="pagination"] li:not(.next):not(.previous) a');
    this.loadingSpinner      = page.locator('.spinner, .loading, [class*="loader"], [aria-label*="loading"]').first();
    this.noDataMessage       = page.locator('td.dataTables_empty, .no-data, [class*="no-result"]').first();
    this.lastUpdatedTime     = page.locator('[class*="updated"], [class*="timestamp"], small:has-text("Updated")').first();
    this.columnSortBtns      = page.locator('#equityStockTable thead th[class*="sort"], table[id*="equity"] thead th.sorting');

    // Index dropdown options
    this.nifty50Option   = page.locator('option:has-text("NIFTY 50")');
    this.niftyBankOption = page.locator('option:has-text("NIFTY BANK"), option:has-text("BANKNIFTY")');
    this.niftyITOption   = page.locator('option:has-text("NIFTY IT")');
    this.niftyNextOption = page.locator('option:has-text("NIFTY NEXT 50")');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /**
   * Open the Live Equity Market page
   */
  async open(): Promise<void> {
    await this.goto('https://www.nseindia.com/market-data/live-equity-market');
    await this.waitForTableToLoad();
    await this.dismissPopupsIfPresent();
    this.logger.info('Live Equity Market page loaded');
  }

  /**
   * Wait for the equity table to fully load
   */
  async waitForTableToLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for rows to appear - network driven
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 30_000 });
    // Ensure spinner is gone if present
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10_000 });
    } catch {
      // Spinner may not exist on this page
    }
    this.logger.info('Table loaded successfully');
  }

  // ── Table Operations ─────────────────────────────────────────────────────────

  /**
   * Get all column header names
   */
  async getColumnHeaders(): Promise<string[]> {
    await this.waitForVisible(this.tableHeaders.first());
    return this.getAllTexts(this.tableHeaders);
  }

  /**
   * Get count of visible table rows
   */
  async getRowCount(): Promise<number> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 15_000 });
    return this.tableRows.count();
  }

  /**
   * Get cell text by row index and column name
   */
  async getCellText(rowIndex: number, colIndex: number): Promise<string> {
    const cell = this.tableRows.nth(rowIndex).locator('td').nth(colIndex);
    return this.getText(cell);
  }

  /**
   * Get all stock symbols from the table (first column)
   */
  async getAllSymbols(): Promise<string[]> {
    await this.tableRows.first().waitFor({ state: 'visible' });
    return this.getAllTexts(this.tableRows.locator('td:first-child'));
  }

  /**
   * Get full row data as array of strings for a given row index
   */
  async getRowData(rowIndex: number): Promise<string[]> {
    const cells = this.tableRows.nth(rowIndex).locator('td');
    const count = await cells.count();
    const data: string[] = [];
    for (let i = 0; i < count; i++) {
      data.push((await cells.nth(i).textContent() ?? '').trim());
    }
    return data;
  }

  /**
   * Get numeric value from a cell (strips commas, % signs)
   */
  async getCellNumericValue(rowIndex: number, colIndex: number): Promise<number> {
    const text = await this.getCellText(rowIndex, colIndex);
    const cleaned = text.replace(/[,%₹\s]/g, '');
    return parseFloat(cleaned);
  }

  // ── Filtering ────────────────────────────────────────────────────────────────

  /**
   * Filter table using the search input
   */
  async filterTable(query: string): Promise<void> {
    this.logger.info(`Filtering table with: "${query}"`);
    await this.waitForVisible(this.searchFilter);
    await this.safeFill(this.searchFilter, query);
    // Wait for table to re-render after filter
    await this.page.waitForTimeout(1000); // DataTables debounce
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }

  /**
   * Clear the search filter
   */
  async clearFilter(): Promise<void> {
    await this.safeFill(this.searchFilter, '');
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  // ── Sorting ──────────────────────────────────────────────────────────────────

  /**
   * Sort table by clicking a column header by its text
   */
  async sortByColumn(columnName: string): Promise<void> {
    this.logger.info(`Sorting by column: "${columnName}"`);
    const header = this.tableHeaders.filter({ hasText: columnName }).first();
    await this.waitForVisible(header);
    await header.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Get column values as numbers (for sort validation)
   */
  async getColumnNumericValues(colIndex: number): Promise<number[]> {
    const rows = await this.tableRows.count();
    const values: number[] = [];
    for (let i = 0; i < Math.min(rows, 20); i++) {
      try {
        const val = await this.getCellNumericValue(i, colIndex);
        if (!isNaN(val)) values.push(val);
      } catch {
        // Skip unparseable cells
      }
    }
    return values;
  }

  // ── Index Dropdown ───────────────────────────────────────────────────────────

  /**
   * Select a different index from the dropdown
   */
  async selectIndex(indexName: string): Promise<void> {
    this.logger.info(`Selecting index: "${indexName}"`);
    await this.waitForVisible(this.indexDropdown);
    await this.indexDropdown.selectOption({ label: indexName });
    await this.waitForTableToLoad();
  }

  /**
   * Get currently selected index
   */
  async getSelectedIndex(): Promise<string> {
    await this.waitForVisible(this.indexDropdown);
    return this.indexDropdown.inputValue();
  }

  /**
   * Get all available index options
   */
  async getAvailableIndexes(): Promise<string[]> {
    await this.waitForVisible(this.indexDropdown);
    const options = await this.indexDropdown.locator('option').allTextContents();
    return options.map(o => o.trim()).filter(o => o.length > 0);
  }

  // ── Pagination ───────────────────────────────────────────────────────────────

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    this.logger.info('Navigating to next page');
    await this.waitForVisible(this.nextPageBtn);
    await this.nextPageBtn.click();
    await this.waitForTableToLoad();
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    this.logger.info('Navigating to previous page');
    await this.waitForVisible(this.prevPageBtn);
    await this.prevPageBtn.click();
    await this.waitForTableToLoad();
  }

  /**
   * Check if next page button is enabled
   */
  async isNextPageEnabled(): Promise<boolean> {
    const btn = this.nextPageBtn;
    const isDisabled = await btn.getAttribute('class');
    return !isDisabled?.includes('disabled');
  }

  /**
   * Get current page number
   */
  async getCurrentPageNumber(): Promise<number> {
    const activeBtn = this.page.locator('.dataTables_paginate span a.current, .pagination .active a').first();
    const text = await activeBtn.textContent();
    return parseInt(text?.trim() ?? '1');
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  /**
   * Assert table has visible rows
   */
  async assertTableHasRows(): Promise<void> {
    const count = await this.getRowCount();
    expect(count).toBeGreaterThan(0);
    this.logger.info(`Table has ${count} rows`);
  }

  /**
   * Assert table is sorted in ascending order for a numeric column
   */
  async assertColumnSortedAscending(colIndex: number): Promise<void> {
    const values = await this.getColumnNumericValues(colIndex);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
    this.logger.info(`Column ${colIndex} is sorted ascending`);
  }

  /**
   * Assert table is sorted in descending order for a numeric column
   */
  async assertColumnSortedDescending(colIndex: number): Promise<void> {
    const values = await this.getColumnNumericValues(colIndex);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
    this.logger.info(`Column ${colIndex} is sorted descending`);
  }

  /**
   * Assert all visible rows contain the filter text
   */
  async assertFilteredRowsContain(text: string): Promise<void> {
    const rowTexts = await this.getAllTexts(this.tableRows);
    for (const row of rowTexts) {
      expect(row.toLowerCase()).toContain(text.toLowerCase());
    }
    this.logger.info(`All rows contain filter text: "${text}"`);
  }

  /**
   * Assert the table has required columns
   */
  async assertRequiredColumnsPresent(expectedColumns: string[]): Promise<void> {
    const headers = await this.getColumnHeaders();
    const flatHeaders = headers.join(' ').toLowerCase();
    for (const col of expectedColumns) {
      const found = flatHeaders.includes(col.toLowerCase());
      expect(found, `Column "${col}" should be present in table`).toBeTruthy();
    }
    this.logger.info(`All required columns present: ${expectedColumns.join(', ')}`);
  }
}
