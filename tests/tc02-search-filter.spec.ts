import { test, expect, WELL_KNOWN_STOCKS } from '../utils/fixtures';

/**
 * TEST SUITE 2: Search / Filter Functionality
 *
 * Verifies:
 *  - Typing in the search box filters the table
 *  - Filtered results are relevant to the query
 *  - Clearing the filter restores all rows
 *  - Searching for a non-existent symbol shows no results / empty message
 */
test.describe('TC-02: Table Search & Filter', () => {
  test.beforeEach(async ({ liveEquityPage }) => {
    await liveEquityPage.open();
  });

  test('should filter table rows when searching for a known stock', async ({ liveEquityPage }) => {
    const symbol = WELL_KNOWN_STOCKS[0]; // e.g. RELIANCE
    const initialCount = await liveEquityPage.getRowCount();

    await liveEquityPage.filterTable(symbol);

    const filteredCount = await liveEquityPage.getRowCount();
    console.log(`Initial rows: ${initialCount}, Filtered rows: ${filteredCount}`);

    // Filtered result should have fewer (or equal) rows
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should display matching symbol in filtered results', async ({ liveEquityPage }) => {
    const symbol = WELL_KNOWN_STOCKS[1]; // TCS
    await liveEquityPage.filterTable(symbol);

    const rowCount = await liveEquityPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // First result's symbol cell should contain the search term
    const firstSymbol = await liveEquityPage.getCellText(0, 0);
    console.log(`First result symbol: "${firstSymbol}"`);
    expect(firstSymbol.toUpperCase()).toContain(symbol.toUpperCase());
  });

  test('should restore full table after clearing filter', async ({ liveEquityPage }) => {
    const initialCount = await liveEquityPage.getRowCount();

    // Apply filter
    await liveEquityPage.filterTable(WELL_KNOWN_STOCKS[2]);
    const filteredCount = await liveEquityPage.getRowCount();
    expect(filteredCount).toBeLessThan(initialCount);

    // Clear filter
    await liveEquityPage.clearFilter();
    const restoredCount = await liveEquityPage.getRowCount();
    console.log(`Restored rows: ${restoredCount}, Initial: ${initialCount}`);

    // After clearing, row count should return to the original count
    expect(restoredCount).toBe(initialCount);
  });

  test('should handle partial symbol search', async ({ liveEquityPage }) => {
    // Search partial: 'HDFC' could match HDFCBANK, HDFC, HDFCLIFE etc.
    await liveEquityPage.filterTable('HDFC');
    const count = await liveEquityPage.getRowCount();
    console.log(`Rows matching "HDFC": ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('should show no results for gibberish search term', async ({ liveEquityPage, page }) => {
    await liveEquityPage.filterTable('XYZXYZXYZ_NONEXISTENT');
    const count = await liveEquityPage.getRowCount();
    console.log(`Rows for nonsense query: ${count}`);

    if (count === 0) {
      // DataTables shows an empty-row message — assert it's present
      const emptyMsg = page.locator('td.dataTables_empty, .no-data').first();
      await expect(emptyMsg).toBeVisible({ timeout: 10_000 });
      console.log('✓ No results message shown correctly');
    } else {
      // Some tables collapse to 0 without a message — just assert 0 rows
      expect(count).toBe(0);
    }
  });
});
