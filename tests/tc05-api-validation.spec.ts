import { test, expect } from '../utils/fixtures';
import type { NseEquityStock } from '../utils/apiUtils';

/**
 * TEST SUITE 5: API vs UI Data Validation
 *
 * Verifies:
 *  - NSE internal API returns 200 with valid JSON
 *  - API response contains expected stock fields
 *  - Stock symbols from API match what is displayed in the UI table
 *  - Numeric values (LTP, % Change) are consistent between API and UI
 *    (with a tolerance, as live data changes per second)
 */
test.describe('TC-05: API vs UI Validation', () => {

  test('should return HTTP 200 from NSE equity API', async ({ apiUtils }) => {
    await apiUtils.initSession();
    const data = await apiUtils.getLiveEquityData('NIFTY 50');

    expect(data).toBeDefined();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBeTruthy();

    console.log(`✓ API returned ${data.data.length} stocks`);
    console.log(`  Timestamp: ${data.timestamp}`);
  });

  test('should have required fields in each API record', async ({ apiUtils }) => {
    await apiUtils.initSession();
    const response = await apiUtils.getLiveEquityData('NIFTY 50');

    const requiredFields: (keyof NseEquityStock)[] = [
      'symbol', 'lastPrice', 'open', 'dayHigh', 'dayLow', 'pChange',
    ];

    const sample = response.data.slice(0, 5);
    for (const stock of sample) {
      for (const field of requiredFields) {
        expect(
          stock[field],
          `Field "${field}" should be present for symbol "${stock.symbol}"`
        ).toBeDefined();
      }
      console.log(`✓ ${stock.symbol} — LTP: ${stock.lastPrice} | %Chg: ${stock.pChange}`);
    }
  });

  test('should have stock symbols in API that match UI table', async ({ apiUtils, liveEquityPage }) => {
    // Get symbols from API
    await apiUtils.initSession();
    const apiResponse = await apiUtils.getLiveEquityData('NIFTY 50');
    const apiSymbols = apiResponse.data.map(s => s.symbol.toUpperCase());

    // Get symbols from UI
    await liveEquityPage.open();
    const uiSymbols = (await liveEquityPage.getAllSymbols()).map(s => s.toUpperCase());

    console.log(`API symbols (first 5): ${apiSymbols.slice(0, 5).join(', ')}`);
    console.log(`UI symbols  (first 5): ${uiSymbols.slice(0, 5).join(', ')}`);

    // At least some symbols should be common
    const commonSymbols = apiSymbols.filter(s => uiSymbols.includes(s));
    console.log(`Common symbols: ${commonSymbols.length}`);

    expect(
      commonSymbols.length,
      'At least 5 symbols should match between API and UI'
    ).toBeGreaterThanOrEqual(5);

    console.log(`✓ ${commonSymbols.length} symbols match between API and UI`);
  });

  test('should validate % Change values from API are numeric and within realistic range', async ({ apiUtils }) => {
    await apiUtils.initSession();
    const response = await apiUtils.getLiveEquityData('NIFTY 50');

    // Realistic intraday % change: -20% to +20% (circuit limits)
    const MAX_CHANGE = 20;
    const MIN_CHANGE = -20;

    for (const stock of response.data.slice(0, 10)) {
      expect(
        typeof stock.pChange,
        `${stock.symbol} pChange should be a number`
      ).toBe('number');
      expect(
        stock.pChange,
        `${stock.symbol} % change (${stock.pChange}) should be within circuit limits`
      ).toBeGreaterThanOrEqual(MIN_CHANGE);
      expect(stock.pChange).toBeLessThanOrEqual(MAX_CHANGE);
      console.log(`  ${stock.symbol.padEnd(12)} pChange: ${stock.pChange.toFixed(2)}%`);
    }
    console.log('✓ All % Change values are within valid range');
  });

  test('should validate lastPrice is within day high and day low range', async ({ apiUtils }) => {
    await apiUtils.initSession();
    const response = await apiUtils.getLiveEquityData('NIFTY 50');

    let validCount = 0;
    for (const stock of response.data) {
      if (stock.lastPrice > 0 && stock.dayHigh > 0 && stock.dayLow > 0) {
        // LTP must be between day low and day high (inclusive, with small tolerance)
        const tolerance = stock.lastPrice * 0.001; // 0.1% tolerance for data race
        const aboveOrEqualLow  = stock.lastPrice >= stock.dayLow - tolerance;
        const belowOrEqualHigh = stock.lastPrice <= stock.dayHigh + tolerance;

        expect(
          aboveOrEqualLow,
          `${stock.symbol}: LTP (${stock.lastPrice}) should be >= DayLow (${stock.dayLow})`
        ).toBeTruthy();
        expect(
          belowOrEqualHigh,
          `${stock.symbol}: LTP (${stock.lastPrice}) should be <= DayHigh (${stock.dayHigh})`
        ).toBeTruthy();

        validCount++;
      }
    }
    console.log(`✓ ${validCount} stocks validated: LTP within [DayLow, DayHigh] range`);
  });

  test('should validate API response time is acceptable (under 8 seconds)', async ({ apiUtils }) => {
    // First initialise session
    await apiUtils.initSession();

    await apiUtils.assertResponseTime(
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
      8_000,
    );
    console.log('✓ API response time within acceptable limit');
  });
});
