// Offline unit tests: no chain needed.
import { describe, expect, it } from "@jest/globals";
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { blake2AsU8a, cryptoWaitReady } from "@polkadot/util-crypto";

import { fromAddress, toAddress } from "@bitcodex-bittensor-chain/address";
import {
  checkNetwork,
  MAINNET_GENESIS,
  TESTNET_GENESIS,
} from "@bitcodex-bittensor-chain/networks";
import {
  MAX_RAW_PAYLOAD,
  signingBytes,
} from "@bitcodex-bittensor-chain/payload";
import {
  chainProxyTypes,
  checkProxyExecuted,
  type EventRecordLike,
  validateProxyType,
} from "@bitcodex-bittensor-chain/proxy";
import { wrapEd25519 } from "@bitcodex-bittensor-chain/signature";

const bytes = (n: number, fill = 7) => new Uint8Array(n).fill(fill);

describe("toAddress", () => {
  it("matches @polkadot/keyring ed25519 for the same public key", async () => {
    await cryptoWaitReady();
    const pair = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromSeed(
      bytes(32, 3),
    );
    const res = toAddress(pair.publicKey);
    expect(res).toEqual({ success: true, data: pair.address });
    expect(pair.address.startsWith("5")).toBe(true);
  });

  it("accepts hex with or without 0x", () => {
    const pk = bytes(32, 9);
    const a = toAddress(pk);
    expect(toAddress(u8aToHex(pk))).toEqual(a);
    expect(toAddress(u8aToHex(pk).slice(2))).toEqual(a);
  });

  it("rejects wrong lengths and non-hex", () => {
    expect(toAddress(bytes(31)).success).toBe(false);
    expect(toAddress(bytes(33)).success).toBe(false);
    expect(toAddress("0xzz").success).toBe(false);
  });

  it("round-trips through fromAddress", () => {
    const pk = bytes(32, 5);
    const res = toAddress(pk);
    if (!res.success) {
      throw new Error(res.err);
    }
    expect(fromAddress(res.data)).toEqual({ success: true, data: pk });
    expect(fromAddress("not-an-address").success).toBe(false);
  });
});

describe("signingBytes", () => {
  it("signs payloads up to 256 bytes raw", () => {
    const p = bytes(MAX_RAW_PAYLOAD);
    expect(signingBytes(p)).toBe(p);
    expect(signingBytes(bytes(1)).length).toBe(1);
  });

  it("signs blake2_256(payload) above 256 bytes", () => {
    const p = bytes(MAX_RAW_PAYLOAD + 1);
    const out = signingBytes(p);
    expect(out.length).toBe(32);
    expect(u8aToHex(out)).toBe(u8aToHex(blake2AsU8a(p, 256)));
  });
});

describe("wrapEd25519", () => {
  it("prefixes 0x00 (MultiSignature::Ed25519) to a 64-byte signature", () => {
    const sig = bytes(64, 0xab);
    const res = wrapEd25519(sig);
    if (!res.success) {
      throw new Error(res.err);
    }
    expect(res.data.length).toBe(2 + 65 * 2);
    expect(res.data.startsWith("0x00")).toBe(true);
    expect(res.data.slice(4)).toBe(u8aToHex(sig).slice(2));
  });

  it("rejects signatures that are not 64 bytes", () => {
    expect(wrapEd25519(bytes(63)).success).toBe(false);
    expect(wrapEd25519(bytes(65)).success).toBe(false);
  });
});

describe("checkNetwork", () => {
  const localFacts = {
    genesisHash: "0xda4f",
    chainType: "Local",
    endpoint: "ws://127.0.0.1:9944",
  };

  it("accepts localnet by chainType and local endpoint, not by name", () => {
    expect(checkNetwork("bittensor:localnet", localFacts).success).toBe(true);
    expect(
      checkNetwork("bittensor:localnet", {
        ...localFacts,
        chainType: "Development",
      }).success,
    ).toBe(true);
  });

  it("refuses localnet when the chain is Live or the endpoint is remote", () => {
    expect(
      checkNetwork("bittensor:localnet", { ...localFacts, chainType: "Live" })
        .success,
    ).toBe(false);
    expect(
      checkNetwork("bittensor:localnet", {
        ...localFacts,
        endpoint: "wss://entrypoint-finney.opentensor.ai:443",
      }).success,
    ).toBe(false);
  });

  it("refuses mainnet while disabled, and testnet with an unknown genesis", () => {
    const live = {
      genesisHash: "0x2f05",
      chainType: "Live",
      endpoint: "wss://example.org",
    };
    const mainnet = checkNetwork("bittensor:mainnet", live);
    expect(mainnet.success).toBe(false);
    if (!mainnet.success) {
      expect(mainnet.err).toMatch(/disabled/);
    }
    expect(checkNetwork("bittensor:testnet", live).success).toBe(false);
  });

  // Facts read from the live chains on 2026-10-29 (00-research.md "Testnet").
  const testnetFacts = {
    genesisHash: TESTNET_GENESIS,
    chainType: "Development",
    endpoint: "wss://test.finney.opentensor.ai:443",
  };
  const mainnetFacts = {
    genesisHash: MAINNET_GENESIS,
    chainType: "Live",
    endpoint: "wss://entrypoint-finney.opentensor.ai:443",
  };

  it("accepts testnet only by its genesis hash", () => {
    expect(checkNetwork("bittensor:testnet", testnetFacts).success).toBe(true);
    expect(
      checkNetwork("bittensor:testnet", {
        ...testnetFacts,
        genesisHash: `0x${"ab".repeat(32)}`,
      }).success,
    ).toBe(false);
  });

  it("testnet reports Development, but is never accepted as localnet (remote endpoint)", () => {
    const res = checkNetwork("bittensor:localnet", testnetFacts);
    expect(res.success ? "" : res.err).toMatch(/not local/);
  });

  it("names mainnet explicitly whatever network was requested", () => {
    for (const id of ["bittensor:testnet", "bittensor:localnet"] as const) {
      const res = checkNetwork(id, {
        ...mainnetFacts,
        endpoint: "ws://127.0.0.1:9944",
      });
      expect(res.success ? "" : res.err).toMatch(/MAINNET/);
    }
  });
});

// --- proxy: ProxyType from chain metadata -------------------------------------------------

const SUBTENSOR_PROXY_TYPES = [
  "Any",
  "Owner",
  "NonCritical",
  "NonTransfer",
  "Senate",
  "NonFungible",
  "Triumvirate",
  "Governance",
  "Staking",
  "Registration",
  "Transfer",
  "SmallTransfer",
  "RootWeights",
  "ChildKeys",
  "SudoUncheckedSetCode",
  "SwapHotkey",
  "SubnetLeaseBeneficiary",
  "RootClaim",
  "BasketTrading",
  "Validate",
  "Weights",
];

function mockApi(typeName: string, variants: string[] | null) {
  const created: string[] = [];
  const api = {
    tx: {
      proxy: {
        addProxy: {
          meta: {
            args: [
              {
                name: { toString: () => "delegate" },
                type: { toString: () => "AccountIdLookupOf" },
              },
              {
                name: { toString: () => "proxyType" },
                type: { toString: () => typeName },
              },
              {
                name: { toString: () => "delay" },
                type: { toString: () => "BlockNumberFor" },
              },
            ],
          },
        },
      },
    },
    registry: {
      createType: (name: string) => {
        created.push(name);
        if (variants === null) {
          throw new Error(`unknown type ${name}`);
        }
        return { defKeys: variants };
      },
    },
  };
  return { api: api as never, created };
}

describe("chainProxyTypes", () => {
  it("reads variants from the metadata type of proxy.addProxy's proxyType arg", () => {
    const { api, created } = mockApi(
      "SubtensorRuntimeCommonProxyProxyType",
      SUBTENSOR_PROXY_TYPES,
    );
    const res = chainProxyTypes(api);
    expect(res).toEqual({ success: true, data: SUBTENSOR_PROXY_TYPES });
    // Must not fall back to polkadot.js's built-in "ProxyType".
    expect(created).toEqual(["SubtensorRuntimeCommonProxyProxyType"]);
  });

  it("fails when the chain has no proxy pallet or the type cannot be built", () => {
    expect(chainProxyTypes({ tx: {}, registry: {} } as never).success).toBe(
      false,
    );
    expect(chainProxyTypes(mockApi("Missing", null).api).success).toBe(false);
    expect(chainProxyTypes(mockApi("Empty", []).api).success).toBe(false);
  });

  it("validateProxyType accepts chain types and rejects others", () => {
    const { api } = mockApi(
      "SubtensorRuntimeCommonProxyProxyType",
      SUBTENSOR_PROXY_TYPES,
    );
    expect(validateProxyType(api, "SmallTransfer")).toEqual({
      success: true,
      data: "SmallTransfer",
    });
    expect(validateProxyType(api, "staking").success).toBe(false);
    expect(validateProxyType(api, "IdentityJudgement").success).toBe(false);
  });
});

// --- proxy: ProxyExecuted result -----------------------------------------------------------

const registry = {
  findMetaError: () => ({ section: "system", name: "CallFiltered" }),
} as never;
const moduleErr = { isModule: true, asModule: {}, toString: () => "Module" };
const ev = (
  section: string,
  method: string,
  data: unknown,
): EventRecordLike => ({
  event: { section, method, data },
});
const ok = { isErr: false, asErr: moduleErr };
const err = { isErr: true, asErr: moduleErr };
const success = ev("system", "ExtrinsicSuccess", {});

describe("checkProxyExecuted", () => {
  it("passes when every ProxyExecuted result is Ok", () => {
    expect(
      checkProxyExecuted(registry, [
        ev("proxy", "ProxyExecuted", { result: ok }),
        success,
      ]).success,
    ).toBe(true);
  });

  it("fails on an Err inner result even though the extrinsic succeeded", () => {
    const res = checkProxyExecuted(registry, [
      ev("proxy", "ProxyExecuted", { result: err }),
      success,
    ]);
    expect(res).toEqual({
      success: false,
      err: "proxy inner call failed: system.CallFiltered",
    });
  });

  it("fails if any of several ProxyExecuted events is Err", () => {
    const res = checkProxyExecuted(registry, [
      ev("proxy", "ProxyExecuted", { result: ok }),
      ev("proxy", "ProxyExecuted", [err]),
      success,
    ]);
    expect(res.success).toBe(false);
  });

  it("fails when there is no ProxyExecuted event", () => {
    const res = checkProxyExecuted(registry, [success]);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.err).toMatch(/no proxy.ProxyExecuted/);
    }
  });

  it("fails on ExtrinsicFailed", () => {
    const res = checkProxyExecuted(registry, [
      ev("system", "ExtrinsicFailed", { dispatchError: moduleErr }),
    ]);
    expect(res).toEqual({
      success: false,
      err: "extrinsic failed: system.CallFiltered",
    });
  });
});
