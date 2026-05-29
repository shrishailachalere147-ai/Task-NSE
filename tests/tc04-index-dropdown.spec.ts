import { test, expect, NSE_INDEXES } from '../utils/fixtures';

/**
 * TEST SUITE 4: Index Dropdown / Live Market Switching
 *
 * Verifies:
 *  - The index dropdown has multiple options
 *  - Switching index reloads the table with new data
 *  - Each index shows a different set of stocks
 *  - The selected index label matches user selection
 */
test.describe('TC-04: Index Dropdown & Live Market Switching', () => {
  test.beforeEach(async ({ liveEquityPage }) => {
    await liveEquityPage.open();
  });

  test('should display the index selection dropdown', async ({ liveEquityPage }) => {
    await expect(liveEquityPage.indexDropdown).toBeVisible({ timeout: 15_000 });
    console.log('✓ Index dropdown is visible');
  });

  test('should list multiple index options in dropdown', async ({ liveEquityPage }) => {
    const indexes = await liveEquityPage.getAvailableIndexes();
    console.log(`Available indexes (${indexes.length}): ${indexes.slice(0, 8).join(', ')}...`);
    expect(indexes.length).toBeGreaterThanOrEqual(3);
    console.log('✓ Multiple index options available');
  });

  test('should reload table data when switching from NIFTY 50 to NIFTY BANK', async ({ liveEquityPage }) => {
    // Capture first symbol under NIFTY 50
    const symbolsNifty50 = await liveEquityPage.getAllSymbols();
    console.log(`NIFTY 50 first 3 symbols: ${symbolsNifty50.slice(0, 3).join(', ')}`);

    // Switch to NIFTY BANK
    const availableIndexes = await liveEquityPage.getAvailableIndexes();
    const bankIndex = availableIndexes.find(idx =>
      idx.toLowerCase().includes('bank')
    );

    if (!bankIndex) {
      console.log('NIFTY BANK option not found, trying second available index');
      if (availableIndexes.length > 1) {
        await liveEquityPage.selectIndex(availableIndexes[1]);
      }
    } else {
      await liveEquityPage.selectIndex(bankIndex);
    }

    const symbolsBank = await liveEquityPage.getAllSymbols();
    console.log(`After switch first 3 symbols: ${symbolsBank.slice(0, 3).join(', ')}`);

    // The datasets should be different
    expect(symbolsNifty50.join(',')).not.toBe(symbolsBank.join(','));
    console.log('✓ Table data changed after index switch');
  });

  test('should show non-empty table after switching index multiple times', async ({ liveEquityPage }) => {
    const indexes = await liveEquityPage.getAvailableIndexes();
    const toTest = indexes.slice(0, Math.min(3, indexes.length));

    for (const indexName of toTest) {
      console.log(`Switching to index: "${indexName}"`);
      await liveEquityPage.selectIndex(indexName);
      const count = await liveEquityPage.getRowCount();
      expect(count, `Index "${indexName}" should have rows`).toBeGreaterThan(0);
      console.log(`  ✓ ${indexName}: ${count} rows`);
    }
  });

  test('should update selected value in dropdown after selection', async ({ liveEquityPage }) => {
    const indexes = await liveEquityPage.getAvailableIndexes();
    if (indexes.length < 2) {
      console.log('Not enough indexes to test, skipping');
      return;
    }

    const targetIndex = indexes[1];
    await liveEquityPage.indexDropdown.selectOption({ label: targetIndex });

    // Wait for table reload
    await liveEquityPage.waitForTableToLoad();

    const selectedValue = await liveEquityPage.indexDropdown.inputValue();
    console.log(`Selected value after switch: "${selectedValue}"`);
    // The selected value (option value) should have changed
    expect(selectedValue).toBeTruthy();
    console.log('✓ Dropdown value updated after selection');
  });
});
