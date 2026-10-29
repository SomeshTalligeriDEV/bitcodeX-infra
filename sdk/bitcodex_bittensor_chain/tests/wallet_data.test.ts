import { describe, expect, it } from "@jest/globals";

import {
  balancesFrom,
  formatPrice,
  parseUnits,
} from "@bitcodex-bittensor-chain/wallet_data";

const big = (n: number | string) => ({ toBigInt: () => BigInt(n) });

describe("parseUnits", () => {
  it("parses decimal TAO into rao", () => {
    expect(parseUnits("1")).toEqual({ success: true, data: BigInt(1e9) });
    expect(parseUnits("0.5")).toEqual({ success: true, data: BigInt(5e8) });
    expect(parseUnits(".000000001")).toEqual({
      success: true,
      data: BigInt(1),
    });
    expect(parseUnits(" 10.25 ")).toEqual({
      success: true,
      data: BigInt(10_250_000_000),
    });
  });

  it("rejects junk, signs, exponents and >9 decimals", () => {
    for (const bad of ["", "-1", "1e3", "abc", "1.2.3", "0.0000000001"]) {
      expect(parseUnits(bad).success).toBe(false);
    }
  });
});

describe("balancesFrom", () => {
  it("transferable is free minus the freeze not covered by reserves", () => {
    const b = balancesFrom({
      data: { free: big(1000), reserved: big(100), frozen: big(300) },
    });
    expect(b.transferable).toBe(BigInt(800));
    const noFreeze = balancesFrom({
      data: { free: big(1000), reserved: big(500), frozen: big(200) },
    });
    expect(noFreeze.transferable).toBe(BigInt(1000));
  });
});

describe("formatPrice", () => {
  it("shows TAO per alpha with 4 decimals", () => {
    expect(formatPrice(BigInt(1_102_447_128))).toBe("1.1024");
    expect(formatPrice(BigInt(12_732_460_246))).toBe("12.7324");
  });
});
