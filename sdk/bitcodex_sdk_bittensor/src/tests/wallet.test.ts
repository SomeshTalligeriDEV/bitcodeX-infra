import type {
  BitcodeXWalletInterface,
  BitcodeXWalletMsgOpenModal,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";
import { describe, expect, it } from "@jest/globals";
import { Keyring } from "@polkadot/keyring";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import { stringToHex, u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { BitcodeXBittensorWallet } from "@bitcodex-sdk-bittensor/bittensor_wallet";
import { INJECTED_NAME, injectWeb3 } from "@bitcodex-sdk-bittensor/inject";
import { USER_CANCELLED } from "@bitcodex-sdk-bittensor/make_signature";
import { extrinsicOutcome } from "@bitcodex-sdk-bittensor/outcome";

type Ack = (msg: BitcodeXWalletMsgOpenModal) => OpenModalAckPayload;

function mockCore(publicKeyHex: string | null, ack: Ack) {
  const sent: BitcodeXWalletMsgOpenModal[] = [];
  let closed = 0;
  const core = {
    origin: "http://localhost:3200",
    waitUntilInitialized: Promise.resolve({ success: true, data: {} }),
    on: () => {},
    off: () => {},
    getPublicKeyEd25519: async () => publicKeyHex,
    signOut: async () => {},
    openModal: async (msg: BitcodeXWalletMsgOpenModal) => {
      sent.push(msg);
      return { success: true, data: ack(msg) };
    },
    closeModal: () => {
      closed++;
    },
  } as unknown as BitcodeXWalletInterface;
  return { core, sent, closedCount: () => closed };
}

const approve =
  (sig: { type: "multi_signature" | "signature"; signature: string }): Ack =>
  (msg) => ({
    modal_type: "bittensor/make_signature",
    modal_id: (msg.payload as { modal_id: string }).modal_id,
    type: "approve",
    data: { chain_type: "bittensor", sig_result: sig },
  });

const reject: Ack = (msg) => ({
  modal_type: "bittensor/make_signature",
  modal_id: (msg.payload as { modal_id: string }).modal_id,
  type: "reject",
});

async function pair() {
  await cryptoWaitReady();
  return new Keyring({ type: "ed25519", ss58Format: 42 }).addFromSeed(
    new Uint8Array(32).fill(4),
  );
}

const payloadFor = (address: string) =>
  ({
    address,
    blockHash: "0x01",
    blockNumber: "0x01",
    era: "0x00",
    genesisHash: "0x02",
    method: "0x0500",
    nonce: "0x00",
    signedExtensions: ["CheckNonce"],
    specVersion: "0x01",
    tip: "0x00",
    transactionVersion: "0x01",
    version: 4,
  }) as SignerPayloadJSON;

describe("BitcodeXBittensorWallet", () => {
  it("connect() returns the SS58 address of the iframe's ed25519 key", async () => {
    const p = await pair();
    const { core } = mockCore(u8aToHex(p.publicKey).slice(2), reject);
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    expect(await wallet.connect()).toBe(p.address);
    expect(wallet.address?.startsWith("5")).toBe(true);
  });

  it("connect() fails when nobody is signed in", async () => {
    const { core } = mockCore(null, reject);
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    await expect(wallet.connect()).rejects.toThrow(/sign in/);
  });

  it("signer.signPayload sends the whole signer payload to the iframe modal", async () => {
    const p = await pair();
    const sig = `0x00${"ab".repeat(64)}`;
    const { core, sent, closedCount } = mockCore(
      u8aToHex(p.publicKey),
      approve({ type: "multi_signature", signature: sig }),
    );
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    const payload = payloadFor(p.address);
    const res = await wallet.signer.signPayload?.(payload);

    expect(res?.signature).toBe(sig);
    expect(closedCount()).toBe(1);
    const msg = sent[0].payload as {
      modal_type: string;
      data: {
        sign_type: string;
        payload: {
          chain_id: string;
          signer: string;
          data: { signer_payload: unknown };
        };
      };
    };
    expect(msg.modal_type).toBe("bittensor/make_signature");
    expect(msg.data.sign_type).toBe("extrinsic");
    expect(msg.data.payload.chain_id).toBe("bittensor:localnet");
    expect(msg.data.payload.signer).toBe(p.address);
    // No pre-computed bytes: the iframe derives them from the payload.
    expect(msg.data.payload.data).toEqual({ signer_payload: payload });
  });

  it("refuses a payload for a different account without opening the modal", async () => {
    const p = await pair();
    const { core, sent } = mockCore(u8aToHex(p.publicKey), reject);
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    const other = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromUri(
      "//Bob",
    );
    await expect(
      wallet.signer.signPayload?.(payloadFor(other.address)),
    ).rejects.toThrow(/different account/);
    expect(sent.length).toBe(0);
  });

  it("rejects with 'Cancelled' when the user rejects", async () => {
    const p = await pair();
    const { core } = mockCore(u8aToHex(p.publicKey), reject);
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    await expect(
      wallet.signer.signPayload?.(payloadFor(p.address)),
    ).rejects.toThrow(USER_CANCELLED);
  });

  it("signRaw only accepts type 'bytes'", async () => {
    const p = await pair();
    const { core, sent } = mockCore(
      u8aToHex(p.publicKey),
      approve({ type: "signature", signature: "0x11" }),
    );
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    await expect(
      wallet.signer.signRaw?.({
        address: p.address,
        data: "0x00",
        type: "payload",
      }),
    ).rejects.toThrow(/bytes/);
    expect(sent.length).toBe(0);
  });

  it("signMessage hex-encodes text and returns the iframe signature", async () => {
    const p = await pair();
    const { core, sent } = mockCore(
      u8aToHex(p.publicKey),
      approve({ type: "signature", signature: "0x11" }),
    );
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");
    expect(await wallet.signMessage("hello bittensor")).toBe("0x11");
    const msg = sent[0].payload as {
      data: { sign_type: string; payload: { data: { message: string } } };
    };
    expect(msg.data.sign_type).toBe("raw");
    expect(msg.data.payload.data.message).toBe(stringToHex("hello bittensor"));
  });
});

describe("injectWeb3", () => {
  it("registers window.injectedWeb3.bitcodex with the wallet's account and signer", async () => {
    const g = globalThis as unknown as {
      window?: {
        injectedWeb3?: Record<
          string,
          { enable: (o: string) => Promise<unknown> }
        >;
      };
    };
    g.window = g.window ?? ({} as never);
    const p = await pair();
    const { core } = mockCore(u8aToHex(p.publicKey), reject);
    const wallet = new BitcodeXBittensorWallet(core, "bittensor:localnet");

    injectWeb3(wallet);
    const entry = g.window?.injectedWeb3?.[INJECTED_NAME];
    expect(entry).toBeDefined();
    const injected = (await entry?.enable("test app")) as {
      accounts: { get: () => Promise<{ address: string; type: string }[]> };
      signer: unknown;
    };
    expect(await injected.accounts.get()).toEqual([
      { address: p.address, name: "BitcodeX", type: "ed25519" },
    ]);
    expect(injected.signer).toBe(wallet.signer);
  });
});

describe("extrinsicOutcome", () => {
  const registry = {
    findMetaError: () => ({ section: "system", name: "CallFiltered" }),
  } as never;
  const moduleErr = { isModule: true, asModule: {}, toString: () => "Module" };
  const ev = (section: string, method: string, data: unknown) => ({
    event: { section, method, data },
  });
  const proxyCall = { section: "proxy", method: "proxy" };

  it("a proxy call whose inner call failed is a failure", () => {
    expect(
      extrinsicOutcome(registry, proxyCall, undefined, [
        ev("proxy", "ProxyExecuted", {
          result: { isErr: true, asErr: moduleErr },
        }),
        ev("system", "ExtrinsicSuccess", {}),
      ]),
    ).toEqual({
      success: false,
      err: "proxy inner call failed: system.CallFiltered",
    });
  });

  it("a proxy call without a ProxyExecuted event is a failure", () => {
    expect(extrinsicOutcome(registry, proxyCall, undefined, []).success).toBe(
      false,
    );
  });

  it("a non-proxy call succeeds without a ProxyExecuted event", () => {
    expect(
      extrinsicOutcome(
        registry,
        { section: "balances", method: "transferKeepAlive" },
        undefined,
        [],
      ),
    ).toEqual({ success: true, data: undefined });
  });

  it("a dispatch error is a failure", () => {
    expect(
      extrinsicOutcome(
        registry,
        { section: "balances", method: "transferKeepAlive" },
        moduleErr,
        [],
      ).success,
    ).toBe(false);
  });
});
