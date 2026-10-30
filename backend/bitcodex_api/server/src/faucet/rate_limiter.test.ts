import { AddressRateLimiter } from "./rate_limiter";

describe("AddressRateLimiter", () => {
  it("allows one take per key per cooldown", () => {
    let t = 0;
    const limiter = new AddressRateLimiter(60_000, () => t);
    expect(limiter.take("a")).toBe(0);
    t = 1_000;
    expect(limiter.take("a")).toBe(59);
    expect(limiter.take("b")).toBe(0);
    t = 60_000;
    expect(limiter.take("a")).toBe(0);
  });

  it("release lets a failed drip retry at once", () => {
    const limiter = new AddressRateLimiter(60_000, () => 0);
    expect(limiter.take("a")).toBe(0);
    limiter.release("a");
    expect(limiter.take("a")).toBe(0);
  });
});
