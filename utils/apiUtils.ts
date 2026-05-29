import { APIRequestContext, expect } from '@playwright/test';
import { Logger } from './logger';

/**
 * NSE API utility for validating API responses against UI data
 * NSE exposes internal APIs which power the same data shown in the UI
 */
export class NseApiUtils {
  private readonly logger: Logger;

  constructor(private readonly request: APIRequestContext) {
    this.logger = new Logger('NseApiUtils');
  }

  /**
   * Base headers required by NSE API (mimics browser)
   */
  private get headers() {
    return {
      'Accept': '*/*',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Referer': 'https://www.nseindia.com/market-data/live-equity-market',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
  }

  /**
   * Set up a session cookie by first visiting the NSE home page
   * (NSE requires a valid session before the API can be called)
   */
  async initSession(): Promise<void> {
    this.logger.info('Initialising NSE API session');
    const res = await this.request.get('https://www.nseindia.com/', {
      headers: this.headers,
    });
    expect(res.status()).toBe(200);
    this.logger.info('Session initialised');
  }

  /**
   * Fetch live equity market data for a given index
   * @param indexSymbol e.g. 'NIFTY 50', 'NIFTY BANK'
   */
  async getLiveEquityData(indexSymbol = 'NIFTY 50'): Promise<NseEquityResponse> {
    // First hit the page to get session cookies
    await this.request.get('https://www.nseindia.com/market-data/live-equity-market', {
      headers: this.headers,
    });

    const encodedSymbol = encodeURIComponent(indexSymbol);
    const url = `https://www.nseindia.com/api/equity-stockIndices?index=${encodedSymbol}`;
    this.logger.info(`Calling NSE API: ${url}`);

    const response = await this.request.get(url, { headers: this.headers });
    this.logger.info(`API response status: ${response.status()}`);

    expect(response.status()).toBe(200);
    const body = await response.json() as NseEquityResponse;
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBeTruthy();

    return body;
  }

  /**
   * Fetch quote data for a specific symbol
   */
  async getQuoteData(symbol: string): Promise<NseQuoteResponse> {
    // Hit referrer page first
    await this.request.get(`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`, {
      headers: this.headers,
    });

    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`;
    this.logger.info(`Calling NSE Quote API: ${url}`);

    const response = await this.request.get(url, { headers: this.headers });
    expect(response.status()).toBe(200);

    const body = await response.json() as NseQuoteResponse;
    return body;
  }

  /**
   * Validate a specific field from the API matches the expected value (within tolerance)
   */
  assertNumericMatch(
    apiValue: number,
    uiValue: number,
    tolerance = 0.01,
    fieldName = 'value',
  ): void {
    const diff = Math.abs(apiValue - uiValue);
    expect(
      diff,
      `API ${fieldName} (${apiValue}) should match UI value (${uiValue}) within tolerance ${tolerance}`,
    ).toBeLessThanOrEqual(tolerance);
    this.logger.info(`✓ ${fieldName}: API=${apiValue} | UI=${uiValue} | diff=${diff}`);
  }

  /**
   * Assert API response time is within acceptable limits
   */
  async assertResponseTime(url: string, maxMs = 5000): Promise<void> {
    const start = Date.now();
    const response = await this.request.get(url, { headers: this.headers });
    const elapsed = Date.now() - start;
    this.logger.info(`Response time for ${url}: ${elapsed}ms`);
    expect(elapsed, `API response time should be under ${maxMs}ms`).toBeLessThanOrEqual(maxMs);
    expect(response.status()).toBe(200);
  }
}

// ── Type Definitions ─────────────────────────────────────────────────────────

export interface NseEquityStock {
  symbol: string;
  open: number;
  dayHigh: number;
  dayLow: number;
  lastPrice: number;
  previousClose: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  nearWKH: number;
  nearWKL: number;
  perChange365d: number;
  perChange30d: number;
}

export interface NseEquityResponse {
  name: string;
  timestamp: string;
  data: NseEquityStock[];
  metadata?: {
    indexName: string;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    last: number;
    percChange: number;
    change: number;
  };
}

export interface NseQuoteResponse {
  info?: { symbol: string; companyName: string };
  priceInfo?: {
    lastPrice: number;
    change: number;
    pChange: number;
    open: number;
    close: number;
    high: number;
    low: number;
  };
}
