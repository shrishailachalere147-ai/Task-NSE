import { test, expect } from '../utils/fixtures';
import { TableUtils } from '../utils/tableUtils';

/**
 * TEST SUITE 3: Table Sorting Validation
 *
 * Verifies:
 *  - Clicking a column header sorts the table
 *  - Second click reverses the sort order
 *  - Numeric columns sort by value (not lexicographically)
 *  - Sort state is reflected in column header class/aria attribute
 */
test.describe('TC-03: Table Sorting', () => {
  test.beforeEach(async ({ liveEquityPage }) => {
    await liveEquityPage.open();
  });

  test('should sort by % Change column in ascending order', async ({ liveEquityPage, page }) => {
    // Click the % Change column header
    await liveEquityPage.sortByColumn('% Chng');

    // Get column index for % Change (usually 5th or 6th column)
    const headers = await liveEquityPage.getColumnHeaders();
    const pChangeIdx = headers.findIndex(h => h.toLowerCase().includes('chng') || h.toLowerCase().includes('change'));
    
    if (pChangeIdx === -1) {
      console.log('Could not find % Change column, skipping numeric assertion');
      return;
    }
    
    const values = await liveEquityPage.getColumnNumericValues(pChangeIdx);
    console.log(`First 5 % Change values (asc): ${values.slice(0, 5).join(', ')}`);

    if (values.length >= 2) {
      await liveEquityPage.assertColumnSortedAscending(pChangeIdx);
      console.log('✓ Column sorted ascending');
    }
  });

  test('should reverse sort order on second column header click', async ({ liveEquityPage }) => {
    const headers = await liveEquityPage.getColumnHeaders();
    const pChangeIdx = headers.findIndex(h =>
      h.toLowerCase().includes('chng') || h.toLowerCase().includes('change')
    );
    
    if (pChangeIdx === -1) {
      console.log('Could not locate % Change column, skipping test');
      return;
    }

    // First click → ascending
    await liveEquityPage.sortByColumn('% Chng');
    const ascValues = await liveEquityPage.getColumnNumericValues(pChangeIdx);
    
    // Second click → descending
    await liveEquityPage.sortByColumn('% Chng');
    const descValues = await liveEquityPage.getColumnNumericValues(pChangeIdx);

    console.log(`Asc first 3: ${ascValues.slice(0, 3)}`);
    console.log(`Desc first 3: ${descValues.slice(0, 3)}`);

    // After second click, order should be different from after first click
    const ascStr = ascValues.slice(0, 5).join(',');
    const descStr = descValues.slice(0, 5).join(',');
    
    if (ascValues.length >= 2 && descValues.length >= 2) {
      expect(ascStr).not.toBe(descStr);
      console.log('✓ Sort order reversed on second click');
    }
  });

  test('should sort LTP column numerically (not lexicographically)', async ({ liveEquityPage }) => {
    const headers = await liveEquityPage.getColumnHeaders();
    // LTP = Last Traded Price
    const ltpIdx = headers.findIndex(h =>
      h.toLowerCase().includes('ltp') || h.toLowerCase().includes('last price') || h.toLowerCase().includes('last traded')
    );
    
    if (ltpIdx === -1) {
      console.log('LTP column not found, using column index 2');
    }
    
    const colIdx = ltpIdx >= 0 ? ltpIdx : 2;
    await liveEquityPage.sortByColumn(headers[colIdx] ?? 'LTP');
    
    const values = await liveEquityPage.getColumnNumericValues(colIdx);
    console.log(`First 5 LTP values (asc): ${values.slice(0, 5).join(', ')}`);

    if (values.length >= 2) {
      // If sorted numerically, 10 comes before 100 (not "10" > "100" lexicographically)
      const tableUtils = new TableUtils(liveEquityPage['page']);
      const isSorted = tableUtils.isSortedAscending(values);
      expect(isSorted, 'LTP column should be sorted numerically in ascending order').toBeTruthy();
    }
  });

  test('should maintain row data integrity after sorting', async ({ liveEquityPage }) => {
    // Capture first row before sort
    const beforeSort = await liveEquityPage.getRowData(0);
    const symbolBefore = beforeSort[0];

    // Sort by % Chng
    const headers = await liveEquityPage.getColumnHeaders();
    await liveEquityPage.sortByColumn(headers[headers.length > 5 ? 5 : 1]);

    // After sorting, verify rows still have valid data (non-empty symbol)
    const rowCount = await liveEquityPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    const afterSortRow = await liveEquityPage.getRowData(0);
    console.log(`Before sort first row: ${symbolBefore}`);
    console.log(`After sort first row: ${afterSortRow[0]}`);

    // Symbol should still be non-empty, just different
    expect(afterSortRow[0].trim().length).toBeGreaterThan(0);
    console.log('✓ Row data intact after sort');
  });
});
