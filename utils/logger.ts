/**
 * Logger utility - provides structured console logging with timestamps
 * Avoids external dependencies while giving useful test output
 */
export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private format(level: string, message: string): string {
    const ts = new Date().toISOString();
    return `[${ts}] [${level.padEnd(5)}] [${this.context}] ${message}`;
  }

  info(message: string): void {
    console.log(this.format('INFO', message));
  }

  warn(message: string): void {
    console.warn(this.format('WARN', message));
  }

  error(message: string, error?: unknown): void {
    console.error(this.format('ERROR', message));
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }

  debug(message: string): void {
    if (process.env.DEBUG_LOGS === 'true') {
      console.log(this.format('DEBUG', message));
    }
  }

  step(step: string): void {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(this.format('STEP', `▶ ${step}`));
    console.log('─'.repeat(60));
  }
}
