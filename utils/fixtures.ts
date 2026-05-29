import { test as baseTest, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LiveEquityPage } from '../pages/LiveEquityPage';
import { NseApiUtils } from './apiUtils';

/**
 * Extended test fixture that injects Page Object instances
 * into every test automatically via Playwright's fixture system.
 */
type NseFixtures = {
  homePage: HomePage;
  liveEquityPage: LiveEquityPage;
  apiUtils: NseApiUtils;
};

export const test = baseTest.extend<NseFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  liveEquityPage: async ({ page }, use) => {
    const liveEquityPage = new LiveEquityPage(page);
    await use(liveEquityPage);
  },

  apiUtils: async ({ request }, use) => {
    const apiUtils = new NseApiUtils(request);
    await use(apiUtils);
  },
});

export { expect } from '@playwright/test';

// ── Test Data Constants ───────────────────────────────────────────────────────

export const NSE_INDEXES = {
  NIFTY_50: 'NIFTY 50',
  NIFTY_BANK: 'NIFTY BANK',
  NIFTY_IT: 'NIFTY IT',
  NIFTY_NEXT_50: 'NIFTY NEXT 50',
  NIFTY_MIDCAP: 'NIFTY MIDCAP 100',
} as const;

export const EXPECTED_COLUMNS = [
  'Symbol',
  'Open',
  'High',
  'Low',
  'Prev. Close',
  '% Change',
];

export const WELL_KNOWN_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO'];
