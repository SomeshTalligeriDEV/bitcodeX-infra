import { describe, expect, it } from "@jest/globals";

import {
  bytesToText,
  describeCall,
  flattenCards,
  formatTaoAmount,
  type PlainCall,
  toBigIntValue,
} from "@bitcodex-bittensor-chain/describe";

const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
const call = (
  section: string,
  method: string,
  args: Record<string, unknown> = {},
  inner: PlainCall[] = [],
): PlainCall => ({ section, method, args, inner });

describe("amounts", () => {
  it("parses u64 JSON forms", () => {
    expect(toBigIntValue(5)).toBe(BigInt(5));
    expect(toBigIntValue("0x3b9aca00")).toBe(BigInt(1_000_000_000));
    expect(toBigIntValue("18446744073709551615")).toBe(
      BigInt("18446744073709551615"),
    );
    expect(toBigIntValue("abc")).toBeNull();
  });

  it("formats rao as TAO with trimmed decimals", () => {
    expect(formatTaoAmount(BigInt(1_500_000_000))).toBe("1.5 TAO");
    expect(formatTaoAmount(BigInt(1))).toBe("0.000000001 TAO");
    expect(formatTaoAmount(BigInt(0))).toBe("0 TAO");
  });
});

describe("describeCall", () => {
  it("shows a transfer with destination and TAO amount", () => {
    const card = describeCall(
      call("balances", "transferKeepAlive", {
        dest: { id: BOB },
        value: 10_000_000_000,
      }),
    );
    expect(card.known).toBe(true);
    expect(card.title).toBe("Send TAO");
    expect(card.rows).toEqual([
      { label: "To", value: BOB, mono: true },
      { label: "Amount", value: "10 TAO" },
    ]);
    expect(card.danger).toBeNull();
  });

  it("does not hide a transfer inside a batch", () => {
    const card = describeCall(
      call("utility", "batchAll", {}, [
        call("system", "remark", { remark: "0x6869" }),
        call("balances", "transferKeepAlive", {
          dest: { id: BOB },
          value: "0x2540be400",
        }),
      ]),
    );
    const all = flattenCards(card);
    expect(all.map((c) => c.title)).toEqual([
      "Several actions (all or nothing)",
      "On-chain note",
      "Send TAO",
    ]);
    expect(all[1].rows[0].value).toBe("hi");
    expect(all[2].rows[1].value).toBe("10 TAO");
  });

  it("marks unknown calls red, and a known wrapper around one as unknown", () => {
    const sudo = call("sudo", "sudo", {}, [call("system", "remark", {})]);
    const card = describeCall(sudo);
    expect(card.known).toBe(false);
    expect(card.danger).toMatch(/Unknown call/);

    const proxied = describeCall(
      call("proxy", "proxy", { real: { id: BOB }, forceProxyType: null }, [
        call("adminUtils", "sudoSetTempo", { netuid: 1, tempo: 1 }),
      ]),
    );
    expect(proxied.known).toBe(false);
    expect(proxied.inner[0].known).toBe(false);
  });

  it("shows stake amounts in TAO and unstake amounts in alpha", () => {
    const stake = describeCall(
      call("subtensorModule", "addStakeLimit", {
        hotkey: BOB,
        netuid: 1,
        amountStaked: 50_000_000_000,
        limitPrice: 1_050_000_000,
        allowPartial: false,
      }),
    );
    expect(stake.rows.map((r) => r.value)).toEqual([
      "Subnet 1",
      BOB,
      "50 TAO",
      "1.05 TAO per alpha",
      "no",
    ]);
    const unstake = describeCall(
      call("subtensorModule", "removeStake", {
        hotkey: BOB,
        netuid: 1,
        amountUnstaked: 25_000_000_000,
      }),
    );
    expect(unstake.rows[2].value).toBe("25 alpha");
  });

  it("warns on coldkey swaps, transfer-all and broad proxies", () => {
    expect(
      describeCall(
        call("subtensorModule", "scheduleSwapColdkey", { newColdkey: BOB }),
      ).danger,
    ).toMatch(/ALL your TAO/);
    expect(
      describeCall(
        call("balances", "transferAll", { dest: { id: BOB }, keepAlive: true }),
      ).danger,
    ).toMatch(/entire free balance/);
    expect(
      describeCall(
        call("proxy", "addProxy", {
          delegate: { id: BOB },
          proxyType: "Any",
          delay: 0,
        }),
      ).danger,
    ).toMatch(/Any/);
    expect(
      describeCall(
        call("proxy", "addProxy", {
          delegate: { id: BOB },
          proxyType: "Staking",
          delay: 0,
        }),
      ).danger,
    ).toBeNull();
  });

  it("keeps non-text remarks as hex", () => {
    expect(bytesToText("0x00ff")).toBe("0x00ff");
    expect(bytesToText("0x68656c6c6f")).toBe("hello");
  });
});

describe("registerLimit card", () => {
  it("shows subnet, hotkey and the maximum cost in TAO", () => {
    const card = describeCall(
      call("subtensorModule", "registerLimit", {
        netuid: 2,
        hotkey: BOB,
        limitPrice: 3_050_502,
      }),
    );
    expect(card.known).toBe(true);
    expect(card.rows.map((r) => r.value)).toEqual([
      "Subnet 2",
      BOB,
      "0.003050502 TAO",
    ]);
  });
});
