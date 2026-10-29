import { describe, expect, it } from "@jest/globals";

import {
  decayedBurn,
  decayFactorQ32,
  mulByQ32,
} from "@bitcodex-bittensor-chain/hotkeys";

describe("registration cost math (ported from subtensor)", () => {
  it("decay factor for half-life 360 matches the chain", () => {
    // Value read from localnet (BurnHalfLife=360), 2026-10-29.
    expect(decayFactorQ32(360)).toBe(BigInt(4286705684));
    expect(decayFactorQ32(0)).toBe(BigInt(1) << BigInt(32));
  });

  it("reproduces observed localnet burns block by block", () => {
    const params = {
      halfLife: 360,
      minBurn: BigInt(500_000),
      maxBurn: BigInt(100_000_000_000),
    };
    // (before, blocks, after) observed on localnet subnet 2.
    const seen: [number, number, number][] = [
      [3133855, 1, 3127826],
      [3121809, 2, 3109810],
      [3103828, 2, 3091898],
      [3056382, 1, 3050502],
    ];
    for (const [before, blocks, after] of seen) {
      expect(decayedBurn(BigInt(before), params, blocks)).toBe(BigInt(after));
    }
  });

  it("clamps to min and max", () => {
    const params = {
      halfLife: 360,
      minBurn: BigInt(500_000),
      maxBurn: BigInt(1_000_000),
    };
    expect(decayedBurn(BigInt(500_100), params)).toBe(BigInt(500_000));
    expect(decayedBurn(BigInt(5_000_000), params)).toBe(BigInt(1_000_000));
    expect(mulByQ32(BigInt(10), BigInt(1) << BigInt(31))).toBe(BigInt(5));
  });
});
