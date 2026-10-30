// X09 acceptance on localnet: an agent key acts for a user only within the ProxyType the
// user granted; the chain enforces it. BITTENSOR_LOCALNET=1, after seed_localnet.mjs.
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import {
  actAs,
  describePermission,
  getProxyFilter,
  proxyDeposit,
} from "@bitcodex-bittensor-chain/permissions";
import {
  buildAddProxy,
  buildRemoveProxy,
  getProxies,
} from "@bitcodex-bittensor-chain/proxy";
import { getBalances, getStakes } from "@bitcodex-bittensor-chain/wallet_data";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);
let api: ApiPromise;
let alice: KeyringPair;
let validator: string;
let netuid: number;

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

async function setup(proxyType: string) {
  const user = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromMnemonic(
    mnemonicGenerate(),
  );
  const agent = new Keyring({
    type: "sr25519",
    ss58Format: 42,
  }).addFromMnemonic(mnemonicGenerate());
  await send(
    api.tx.balances.transferKeepAlive(user.address, BigInt(20) * TAO),
    alice,
  );
  await send(
    api.tx.balances.transferKeepAlive(agent.address, BigInt(1) * TAO),
    alice,
  );
  const add = buildAddProxy(api, agent.address, proxyType);
  if (!add.success) {
    throw new Error(add.err);
  }
  const before = await getBalances(api, user.address);
  await send(add.data, user);
  return { user, agent, reservedBefore: before.reserved };
}

d("permissions (localnet)", () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    const res = await getApi("bittensor:localnet");
    if (!res.success) {
      throw new Error(res.err);
    }
    api = res.data;
    const sr = new Keyring({ type: "sr25519", ss58Format: 42 });
    alice = sr.addFromUri("//Alice");
    validator = sr.addFromUri("//BitcodeXValidator").address;
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

  it("reads what each permission allows from the chain", async () => {
    const small = await getProxyFilter(api, "SmallTransfer");
    expect(small?.mode).toBe("allow");
    expect(describePermission(small!).can).toContain(
      "send TAO, only below 0.5 TAO per call",
    );
    const staking = await getProxyFilter(api, "Staking");
    expect(describePermission(staking!).can).toContain("stake");
    expect(
      describePermission(staking!).can.some((c) => c.startsWith("send TAO")),
    ).toBe(false);
  });

  it("Staking: agent stakes 1 TAO for the user; a transfer is rejected by the chain", async () => {
    const { user, agent } = await setup("Staking");
    const staked = await actAs(
      api,
      agent,
      user.address,
      "Staking",
      api.tx.subtensorModule.addStake(validator, netuid, TAO),
    );
    expect(staked.success).toBe(true);
    const stakes = await getStakes(api, user.address);
    expect(
      stakes.some((s) => s.hotkey === validator && s.netuid === netuid),
    ).toBe(true);

    const steal = await actAs(
      api,
      agent,
      user.address,
      "Staking",
      api.tx.balances.transferKeepAlive(agent.address, TAO),
    );
    expect(steal.success).toBe(false);
    expect(steal.success ? "" : steal.err).toMatch(/CallFiltered/);
  });

  it("SmallTransfer: 0.4 TAO works, 0.6 TAO fails", async () => {
    const { user, agent } = await setup("SmallTransfer");
    const ok = await actAs(
      api,
      agent,
      user.address,
      "SmallTransfer",
      api.tx.balances.transferKeepAlive(
        agent.address,
        (TAO * BigInt(4)) / BigInt(10),
      ),
    );
    expect(ok.success).toBe(true);
    const tooBig = await actAs(
      api,
      agent,
      user.address,
      "SmallTransfer",
      api.tx.balances.transferKeepAlive(
        agent.address,
        (TAO * BigInt(6)) / BigInt(10),
      ),
    );
    expect(tooBig.success ? "" : tooBig.err).toMatch(/CallFiltered/);
  });

  it("revoke: deposit refunded, next agent action fails", async () => {
    const { user, agent, reservedBefore } = await setup("Staking");
    const held = await getProxies(api, user.address);
    expect(held.deposit).toBe(proxyDeposit(api, 0));
    const rm = buildRemoveProxy(api, agent.address, "Staking");
    if (!rm.success) {
      throw new Error(rm.err);
    }
    await send(rm.data, user);
    expect((await getBalances(api, user.address)).reserved).toBe(
      reservedBefore,
    );
    const after = await actAs(
      api,
      agent,
      user.address,
      "Staking",
      api.tx.subtensorModule.addStake(validator, netuid, TAO),
    );
    expect(after.success).toBe(false);
    expect(after.success ? "" : after.err).toMatch(/NotProxy/);
  });
});
