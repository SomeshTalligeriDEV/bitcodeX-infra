// Localnet integration tests. Run with `yarn test:localnet` against
// ghcr.io/raofoundation/subtensor-localnet:devnet on ws://127.0.0.1:9944 (scripts/dev-up.sh).
// Uses //Alice dev funds and random throwaway keys. Skipped unless BITTENSOR_LOCALNET=1.
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Signer, SignerPayloadJSON } from "@polkadot/types/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { toAddress } from "@bitcodex-bittensor-chain/address";
import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import { encodePayload, payloadBytes } from "@bitcodex-bittensor-chain/payload";
import {
  buildAddProxy,
  buildProxyCall,
  chainProxyTypes,
  checkProxyExecuted,
  type EventRecordLike,
} from "@bitcodex-bittensor-chain/proxy";
import { wrapEd25519 } from "@bitcodex-bittensor-chain/signature";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = 1_000_000_000n;

let api: ApiPromise;
let alice: KeyringPair;

// A polkadot.js Signer built only from this package's helpers, the way the iframe signs.
function packageSigner(pair: KeyringPair, lengths: number[] = []): Signer {
  let id = 0;
  return {
    signPayload: async (payload: SignerPayloadJSON) => {
      lengths.push(encodePayload(api.registry, payload).length);
      const sig = wrapEd25519(pair.sign(payloadBytes(api.registry, payload)));
      if (!sig.success) {
        throw new Error(sig.err);
      }
      return { id: ++id, signature: sig.data };
    },
  };
}

function send(
  tx: SubmittableExtrinsic<"promise">,
  account: KeyringPair | string,
  signer?: Signer,
): Promise<EventRecordLike[]> {
  return new Promise((resolve, reject) => {
    tx.signAndSend(account, { signer }, ({ status, events, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
      } else if (status.isInBlock) {
        resolve(events as unknown as EventRecordLike[]);
      }
    }).catch(reject);
  });
}

async function fundedEd25519(tao: bigint) {
  const pair = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromSeed(
    randomBytes(32),
  );
  await send(api.tx.balances.transferKeepAlive(pair.address, tao * TAO), alice);
  return pair;
}

d("localnet", () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    const res = await getApi("bittensor:localnet");
    if (!res.success) {
      throw new Error(res.err);
    }
    api = res.data;
    alice = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromUri(
      "//Alice",
    );
  });
  afterAll(disconnectAll);

  it("chainProxyTypes reads Subtensor's 21 proxy types from metadata", () => {
    const res = chainProxyTypes(api);
    if (!res.success) {
      throw new Error(res.err);
    }
    expect(res.data).toContain("Staking");
    expect(res.data).toContain("SmallTransfer");
    expect(res.data.length).toBe(21);
    // polkadot.js's built-in type is different: that is why metadata must be used.
    const builtin = api.registry.createType("ProxyType") as unknown as {
      defKeys: string[];
    };
    expect(builtin.defKeys.length).not.toBe(res.data.length);
  });

  it("toAddress + payloadBytes + wrapEd25519 make a transfer the chain accepts", async () => {
    const pair = await fundedEd25519(10n);
    const addr = toAddress(pair.publicKey);
    expect(addr).toEqual({ success: true, data: pair.address });
    const lengths: number[] = [];
    const events = await send(
      api.tx.balances.transferKeepAlive(alice.address, 1n * TAO),
      pair.address,
      packageSigner(pair, lengths),
    );
    expect(
      events.some(({ event }) => event.method === "ExtrinsicSuccess"),
    ).toBe(true);
    expect(lengths[0]).toBeLessThanOrEqual(256);
  });

  it("a >256-byte payload (utility.batchAll of 10 remarks) is signed as blake2_256 and accepted", async () => {
    const pair = await fundedEd25519(10n);
    const lengths: number[] = [];
    const batch = api.tx.utility.batchAll(
      Array.from({ length: 10 }, (_, i) =>
        api.tx.system.remark(`bitcodex test ${i} `.padEnd(40, "x")),
      ),
    );
    const events = await send(
      batch,
      pair.address,
      packageSigner(pair, lengths),
    );
    expect(lengths[0]).toBeGreaterThan(256);
    expect(
      events.some(({ event }) => event.method === "ExtrinsicSuccess"),
    ).toBe(true);
  });

  it("checkProxyExecuted: Staking proxy transfer fails although the extrinsic succeeds", async () => {
    const owner = await fundedEd25519(5n);
    const agent = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
      randomBytes(32),
    );
    await send(
      api.tx.balances.transferKeepAlive(agent.address, 1n * TAO),
      alice,
    );

    const add = buildAddProxy(api, agent.address, "Staking", 0);
    if (!add.success) {
      throw new Error(add.err);
    }
    await send(add.data, owner.address, packageSigner(owner));

    const call = buildProxyCall(
      api,
      owner.address,
      "Staking",
      api.tx.balances.transferKeepAlive(agent.address, TAO / 10n),
    );
    if (!call.success) {
      throw new Error(call.err);
    }
    const events = await send(call.data, agent);

    expect(
      events.some(({ event }) => event.method === "ExtrinsicSuccess"),
    ).toBe(true);
    expect(checkProxyExecuted(api.registry, events)).toEqual({
      success: false,
      err: "proxy inner call failed: system.CallFiltered",
    });
  });

  it("checkProxyExecuted passes when the proxied call succeeds (Any proxy, remark)", async () => {
    const owner = await fundedEd25519(5n);
    const agent = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
      randomBytes(32),
    );
    await send(
      api.tx.balances.transferKeepAlive(agent.address, 1n * TAO),
      alice,
    );

    const add = buildAddProxy(api, agent.address, "Any", 0);
    if (!add.success) {
      throw new Error(add.err);
    }
    await send(add.data, owner.address, packageSigner(owner));

    const call = buildProxyCall(
      api,
      owner.address,
      "Any",
      api.tx.system.remark("via proxy"),
    );
    if (!call.success) {
      throw new Error(call.err);
    }
    expect(
      checkProxyExecuted(api.registry, await send(call.data, agent)),
    ).toEqual({
      success: true,
      data: undefined,
    });
  });

  it("buildAddProxy rejects a proxy type the chain does not have", () => {
    expect(buildAddProxy(api, alice.address, "IdentityJudgement").success).toBe(
      false,
    );
  });
});
