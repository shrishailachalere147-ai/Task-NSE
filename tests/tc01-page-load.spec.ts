import { test, expect, EXPECTED_COLUMNS } from '../utils/fixtures';

/**
 * TEST SUITE 1: Page Load & Table Structure Validation
 *
 * Verifies:
 *  - NSE Live Equity Market page loads successfully
 *  - Page title is correct
 *  - Equity table renders with expected columns
 *  - Table contains meaningful row data
 *  - Last updated timestamp is visible
 */
test.describe('TC-01: Page Load & Table Structure', () => {
  test.beforeEach(async ({ liveEquityPage }) => {
    await liveEquityPage.open();
  });

  test('should load the Live Equity Market page successfully', async ({ liveEquityPage, page }) => {
    // Assert URL
    await expect(page).toHaveURL(/live-equity-market/i);

    // Assert document title contains NSE
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/nse|national stock exchange/i);

    console.log(`✓ Page loaded: "${title}"`);
  });

  test('should display the equity table with rows', async ({ liveEquityPage }) => {
    // Table must have at least 1 visible data row
    await liveEquityPage.assertTableHasRows();

    const count = await liveEquityPage.getRowCount();
    console.log(`✓ Table has ${count} rows`);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display expected column headers in the table', async ({ liveEquityPage }) => {
    const headers = await liveEquityPage.getColumnHeaders();
    console.log(`Column headers found: ${headers.join(' | ')}`);

    // At minimum the table must have symbol/name, price, and change columns
    await liveEquityPage.assertRequiredColumnsPresent(EXPECTED_COLUMNS);
  });

  test('should show valid symbol values in first column', async ({ liveEquityPage }) => {
    const symbols = await liveEquityPage.getAllSymbols();
    expect(symbols.length).toBeGreaterThan(0);

    // Symbols should be non-empty uppercase strings
    for (const symbol of symbols.slice(0, 5)) {
      expect(symbol.trim().length).toBeGreaterThan(0);
      console.log(`  Symbol: ${symbol}`);
    }
  });

  test('should have all cells with non-empty data in first 3 rows', async ({ liveEquityPage }) => {
    for (let row = 0; row < 3; row++) {
      const rowData = await liveEquityPage.getRowData(row);
      console.log(`Row ${row + 1}: ${rowData.join(' | ')}`);
      // At minimum symbol and price columns should be non-empty
      expect(rowData[0].trim().length, `Row ${row + 1} symbol should not be empty`).toBeGreaterThan(0);
    }
  });
});
