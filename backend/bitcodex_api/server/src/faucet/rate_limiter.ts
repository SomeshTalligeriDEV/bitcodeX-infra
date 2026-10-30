/** At most one take per key per `cooldownMs` (in memory; the faucet is a single process). */
export class AddressRateLimiter {
  private readonly last = new Map<string, number>();

  constructor(
    private readonly cooldownMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns 0 and records the take, or the seconds left until the key may take again. */
  take(key: string): number {
    const t = this.now();
    const prev = this.last.get(key);
    if (prev !== undefined && t - prev < this.cooldownMs) {
      return Math.ceil((this.cooldownMs - (t - prev)) / 1000);
    }
    this.last.set(key, t);
    if (this.last.size > 10_000) {
      for (const [k, v] of this.last) {
        if (t - v >= this.cooldownMs) {
          this.last.delete(k);
        }
      }
    }
    return 0;
  }

  /** Undo a take whose drip failed, so the user can retry right away. */
  release(key: string) {
    this.last.delete(key);
  }
}
