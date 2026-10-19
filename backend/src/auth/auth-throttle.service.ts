import { Injectable } from '@nestjs/common';

export const AUTH_THROTTLE_MAX_FAILURES = 5;
export const AUTH_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_THROTTLE_RETRY_AFTER_SECONDS = 60;
const AUTH_THROTTLE_MAX_ENTRIES = 10_000;

type FailureEntry = {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
};

@Injectable()
export class AuthThrottleService {
  private readonly failures = new Map<string, FailureEntry>();

  key(email: string, clientAddress: string): string {
    return `${email.trim().toLowerCase()}|${clientAddress || 'unknown'}`;
  }

  retryAfterSeconds(key: string): number | null {
    const now = Date.now();
    this.removeExpired(now);
    const entry = this.failures.get(key);
    if (!entry || entry.blockedUntil <= now) return null;
    return Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
  }

  recordFailure(key: string): void {
    const now = Date.now();
    this.removeExpired(now);
    const existing = this.failures.get(key);
    const entry = existing && now - existing.firstFailureAt < AUTH_THROTTLE_WINDOW_MS
      ? existing
      : { failures: 0, firstFailureAt: now, blockedUntil: 0 };

    entry.failures += 1;
    if (entry.failures >= AUTH_THROTTLE_MAX_FAILURES) {
      entry.blockedUntil = now + AUTH_THROTTLE_RETRY_AFTER_SECONDS * 1000;
    }
    this.failures.delete(key);
    this.failures.set(key, entry);
    this.enforceBound();
  }

  recordSuccess(key: string): void {
    this.failures.delete(key);
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.failures) {
      if (entry.blockedUntil <= now && now - entry.firstFailureAt >= AUTH_THROTTLE_WINDOW_MS) {
        this.failures.delete(key);
      }
    }
  }

  private enforceBound(): void {
    while (this.failures.size > AUTH_THROTTLE_MAX_ENTRIES) {
      const oldest = this.failures.keys().next().value;
      if (oldest === undefined) return;
      this.failures.delete(oldest);
    }
  }
}
