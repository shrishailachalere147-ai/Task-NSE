import { Page, Locator } from '@playwright/test';

/**
 * TableUtils - Reusable helpers for working with HTML tables
 */
export class TableUtils {
  constructor(private readonly page: Page) {}

  /**
   * Extract all data from a table as a 2D array of strings
   */
  async extractTableData(tableLocator: Locator): Promise<string[][]> {
    await tableLocator.waitFor({ state: 'visible' });
    const rows = tableLocator.locator('tbody tr');
    const rowCount = await rows.count();
    const result: string[][] = [];

    for (let r = 0; r < rowCount; r++) {
      const cells = rows.nth(r).locator('td');
      const cellCount = await cells.count();
      const rowData: string[] = [];
      for (let c = 0; c < cellCount; c++) {
        const text = (await cells.nth(c).textContent() ?? '').trim();
        rowData.push(text);
      }
      result.push(rowData);
    }
    return result;
  }

  /**
   * Get column index by header name (case-insensitive)
   */
  async getColumnIndex(tableLocator: Locator, columnName: string): Promise<number> {
    const headers = tableLocator.locator('thead th');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).textContent() ?? '').trim().toLowerCase();
      if (text.includes(columnName.toLowerCase())) {
        return i;
      }
    }
    throw new Error(`Column "${columnName}" not found in table headers`);
  }

  /**
   * Get all values from a specific column (by index)
   */
  async getColumnValues(tableLocator: Locator, colIndex: number): Promise<string[]> {
    const rows = tableLocator.locator('tbody tr');
    const count = await rows.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator('td').nth(colIndex);
      values.push((await cell.textContent() ?? '').trim());
    }
    return values;
  }

  /**
   * Check if a column is sorted ascending
   */
  isSortedAscending(values: number[]): boolean {
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) return false;
    }
    return true;
  }

  /**
   * Check if a column is sorted descending
   */
  isSortedDescending(values: number[]): boolean {
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) return false;
    }
    return true;
  }

  /**
   * Parse numeric string (handles commas, parens for negatives, % signs)
   */
  parseNumeric(value: string): number {
    // Handle parentheses for negative numbers e.g. (1.23)
    const isNegative = value.startsWith('(') && value.endsWith(')');
    const cleaned = value.replace(/[(),₹%\s,]/g, '');
    const num = parseFloat(cleaned);
    return isNegative ? -num : num;
  }

  /**
   * Convert string column values to numbers (skips unparseable)
   */
  toNumbers(values: string[]): number[] {
    return values
      .map(v => this.parseNumeric(v))
      .filter(n => !isNaN(n));
  }
}
