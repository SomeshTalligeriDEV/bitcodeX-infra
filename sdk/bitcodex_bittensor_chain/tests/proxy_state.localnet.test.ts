// getProxies against chain storage: add a Staking proxy, read it, remove it, gone.
// BITTENSOR_LOCALNET=1.
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import {
  buildAddProxy,
  buildRemoveProxy,
  getProxies,
} from "@bitcodex-bittensor-chain/proxy";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);
let api: ApiPromise;
let alice: KeyringPair;

const send = (tx: SubmittableExtrinsic<"promise">, pair: KeyringPair) =>
  new Promise<void>((resolve, reject) => {
    tx.signAndSend(pair, { nonce: -1 }, ({ status, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
      } else if (status.isInBlock) {
        resolve();
      }
    }).catch(reject);
  });

d("getProxies (localnet)", () => {
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

  afterAll(async () => {
    await disconnectAll();
  });

  it("lists an added Staking proxy with its deposit, and nothing after removal", async () => {
    const user = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate());
    const agent = new Keyring({
      type: "sr25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate()).address;
    await send(
      api.tx.balances.transferKeepAlive(user.address, BigInt(5) * TAO),
      alice,
    );
    const add = buildAddProxy(api, agent, "Staking");
    if (!add.success) {
      throw new Error(add.err);
    }
    await send(add.data, user);
    const state = await getProxies(api, user.address);
    expect(state.delegations).toEqual([
      { delegate: agent, proxyType: "Staking", delay: 0 },
    ]);
    const base = BigInt(api.consts.proxy.proxyDepositBase.toString());
    const factor = BigInt(api.consts.proxy.proxyDepositFactor.toString());
    expect(state.deposit).toBe(base + factor);

    const rm = buildRemoveProxy(api, agent, "Staking");
    if (!rm.success) {
      throw new Error(rm.err);
    }
    await send(rm.data, user);
    const after = await getProxies(api, user.address);
    expect(after.delegations).toEqual([]);
    expect(after.deposit).toBe(BigInt(0));
  });
});
