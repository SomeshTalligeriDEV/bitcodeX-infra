// X06: what the dashboard shows (getBalances, getStakes, getProxies) equals raw chain
// storage for a user with a balance, two stakes and one proxy. BITTENSOR_LOCALNET=1,
// after scripts/seed_localnet.mjs.
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import { quoteRegistration } from "@bitcodex-bittensor-chain/hotkeys";
import { buildAddProxy, getProxies } from "@bitcodex-bittensor-chain/proxy";
import { getBalances, getStakes } from "@bitcodex-bittensor-chain/wallet_data";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);
let api: ApiPromise;
let alice: KeyringPair;
let netuid: number;

const send = (tx: SubmittableExtrinsic<"promise">, pair: KeyringPair) =>
  new Promise<void>((resolve, reject) => {
    tx.signAndSend(pair, { nonce: -1 }, ({ status, dispatchError }) => {
      if (dispatchError) {
        const e = dispatchError.isModule
          ? api.registry.findMetaError(dispatchError.asModule)
          : null;
        reject(
          new Error(e ? `${e.section}.${e.name}` : dispatchError.toString()),
        );
      } else if (status.isInBlock) {
        resolve();
      }
    }).catch(reject);
  });

d("dashboard state (localnet)", () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    const res = await getApi("bittensor:localnet");
    if (!res.success) {
      throw new Error(res.err);
    }
    api = res.data;
    const sr = new Keyring({ type: "sr25519", ss58Format: 42 });
    alice = sr.addFromUri("//Alice");
    const validator = sr.addFromUri("//BitcodeXValidator").address;
    const owners = await api.query.subtensorModule.subnetOwnerHotkey.entries();
    const own = owners.find(([, o]) => o.toString() === validator);
    if (!own) {
      throw new Error("run scripts/seed_localnet.mjs first");
    }
    netuid = Number(own[0].args[0].toString());
  });

  afterAll(async () => {
    await disconnectAll();
  });

  it("balance, two stakes and one proxy match raw chain storage", async () => {
    const user = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate());
    const sr = new Keyring({ type: "sr25519", ss58Format: 42 });
    const validator = sr.addFromUri("//BitcodeXValidator").address;
    const hk2 = sr.addFromMnemonic(mnemonicGenerate()).address;
    const agent = sr.addFromMnemonic(mnemonicGenerate()).address;
    await send(
      api.tx.balances.transferKeepAlive(user.address, BigInt(100) * TAO),
      alice,
    );
    // second validator hotkey: registered by the user on the same subnet
    const q = await quoteRegistration(api, netuid);
    await send(api.tx.subtensorModule.registerLimit(netuid, hk2, q.cost), user);
    await send(
      api.tx.subtensorModule.addStake(validator, netuid, BigInt(10) * TAO),
      user,
    );
    await send(
      api.tx.subtensorModule.addStake(hk2, netuid, BigInt(5) * TAO),
      user,
    );
    const add = buildAddProxy(api, agent, "Staking");
    if (!add.success) {
      throw new Error(add.err);
    }
    await send(add.data, user);

    // Read everything at one block so dashboard and raw reads see the same state.
    const head = (await api.rpc.chain.getHeader()).hash;
    const at = await api.at(head);
    const atApi = at as unknown as ApiPromise;

    const raw = (await at.query.system.account(user.address)) as unknown as {
      data: { free: { toBigInt(): bigint }; reserved: { toBigInt(): bigint } };
    };
    const balances = await getBalances(atApi, user.address);
    expect(balances.free).toBe(raw.data.free.toBigInt());
    expect(balances.reserved).toBe(raw.data.reserved.toBigInt());

    const stakes = await getStakes(api, user.address);
    expect(stakes.map((s) => s.hotkey).sort()).toEqual([hk2, validator].sort());
    for (const s of stakes) {
      const one = (
        await api.call.stakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid(
          s.hotkey,
          user.address,
          s.netuid,
        )
      ).toJSON() as { stake: number | string };
      // Stake accrues emission every block: compare at 0.01%.
      const rawAlpha = BigInt(one.stake);
      const diff = rawAlpha > s.alpha ? rawAlpha - s.alpha : s.alpha - rawAlpha;
      expect(diff * BigInt(10_000) <= rawAlpha).toBe(true);
      expect(s.taoValue > BigInt(0)).toBe(true);
    }

    const proxies = await getProxies(atApi, user.address);
    expect(proxies.delegations).toEqual([
      { delegate: agent, proxyType: "Staking", delay: 0 },
    ]);
    // The proxy deposit is part of the reserved balance.
    expect(balances.reserved >= proxies.deposit).toBe(true);
  });
});
