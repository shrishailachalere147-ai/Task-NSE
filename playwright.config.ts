import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for NSE India Automation Suite
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory where tests are located
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60_000,

  // Expect timeout for assertions
  expect: {
    timeout: 15_000,
  },

  // Run tests in parallel
  fullyParallel: false,

  // Fail the build on CI if test.only is left accidentally
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Limit workers to avoid rate limiting on live site
  workers: process.env.CI ? 2 : 1,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for NSE India
    baseURL: 'https://www.nseindia.com',

    // Browser tracing on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',

    // Navigation timeout
    navigationTimeout: 30_000,

    // Action timeout
    actionTimeout: 15_000,

    // Browser launch options to appear more human-like
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en;q=0.9',
    },

    // Viewport
    viewport: { width: 1440, height: 900 },

    // Locale
    locale: 'en-IN',

    // Timezone
    timezoneId: 'Asia/Kolkata',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
    // Mobile responsive test
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
      },
      testMatch: '**/responsive.spec.ts',
    },
  ],
});
