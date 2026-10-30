// X05 on localnet with real extrinsics: send, stake/unstake at quoted limits, a too-tight
// limit, and getStakes/getBalances against chain state. BITTENSOR_LOCALNET=1, after
// `node scripts/seed_localnet.mjs` (subnet owned by //BitcodeXValidator).
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import {
  getBalances,
  getStakes,
  quoteStake,
  quoteUnstake,
} from "@bitcodex-bittensor-chain/wallet_data";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);

let api: ApiPromise;
let alice: KeyringPair;
let validator: string;
let netuid: number;

interface Included {
  fee: bigint;
  events: { section: string; method: string; data: string[] }[];
}

function send(
  tx: SubmittableExtrinsic<"promise">,
  pair: KeyringPair,
): Promise<Included> {
  return new Promise((resolve, reject) => {
    tx.signAndSend(pair, { nonce: -1 }, ({ status, dispatchError, events }) => {
      if (dispatchError) {
        const e = dispatchError.isModule
          ? api.registry.findMetaError(dispatchError.asModule)
          : null;
        reject(
          new Error(e ? `${e.section}.${e.name}` : dispatchError.toString()),
        );
      } else if (status.isInBlock) {
        const paid = events.find(
          (e) => e.event.section === "transactionPayment",
        );
        resolve({
          fee: paid ? BigInt(paid.event.data[1].toString()) : BigInt(-1),
          events: events.map((e) => ({
            section: e.event.section,
            method: e.event.method,
            data: e.event.data.map((x) => x.toString()),
          })),
        });
      }
    }).catch(reject);
  });
}

/** |a - b| <= b / divisor */
function near(a: bigint, b: bigint, divisor: number): boolean {
  const diff = a > b ? a - b : b - a;
  return diff * BigInt(divisor) <= b;
}

function within1(a: bigint | undefined, b: bigint): boolean {
  return a !== undefined && a - b <= BigInt(1) && b - a <= BigInt(1);
}

async function freshUser(tao: bigint): Promise<KeyringPair> {
  const user = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromMnemonic(
    mnemonicGenerate(),
  );
  await send(api.tx.balances.transferKeepAlive(user.address, tao * TAO), alice);
  return user;
}

d("wallet data (localnet)", () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    const res = await getApi("bittensor:localnet");
    if (!res.success) {
      throw new Error(res.err);
    }
    api = res.data;
    const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
    alice = keyring.addFromUri("//Alice");
    validator = keyring.addFromUri("//BitcodeXValidator").address;
    const owners = await api.query.subtensorModule.subnetOwnerHotkey.entries();
    const own = owners.find(([, owner]) => owner.toString() === validator);
    if (!own) {
      throw new Error("run scripts/seed_localnet.mjs first");
    }
    netuid = (own[0].args[0] as unknown as { toNumber(): number }).toNumber();
  });

  afterAll(async () => {
    await disconnectAll();
  });

  it("send 10 TAO between two users: balances exact, fee as previewed", async () => {
    const a = await freshUser(BigInt(100));
    const b = await freshUser(BigInt(100));
    const tx = api.tx.balances.transferKeepAlive(b.address, BigInt(10) * TAO);
    const preview = (await tx.paymentInfo(a.address)).partialFee.toBigInt();
    const before = [
      await getBalances(api, a.address),
      await getBalances(api, b.address),
    ];
    const res = await send(tx, a);
    const after = [
      await getBalances(api, a.address),
      await getBalances(api, b.address),
    ];
    expect(res.fee).toBe(preview);
    expect(before[0].free - after[0].free).toBe(BigInt(10) * TAO + res.fee);
    expect(after[1].free - before[1].free).toBe(BigInt(10) * TAO);
  });

  it("stake 50 TAO at the quoted limit, unstake half; numbers match chain", async () => {
    const user = await freshUser(BigInt(200));
    const q = await quoteStake(api, netuid, BigInt(50) * TAO);
    const staked = await send(
      api.tx.subtensorModule.addStakeLimit(
        validator,
        netuid,
        q.tao,
        q.limitPrice,
        false,
      ),
      user,
    );
    const added = staked.events.find((e) => e.method === "StakeAdded");
    const gotAlpha = BigInt(added?.data[3] ?? "0");
    // Emissions move the pool between the quote block and inclusion: the fill must be
    // within the quote's slippage (1%), which is what the limit price enforces.
    // eslint-disable-next-line no-console
    console.log(`stake quote ${q.alpha} alpha, got ${gotAlpha}`);
    expect(near(gotAlpha, q.alpha, 100)).toBe(true);
    const priceAfter = BigInt(
      (await api.call.swapRuntimeApi.currentAlphaPrice(netuid)).toString(),
    );
    // Predicted end price within the slippage too.
    const diff =
      priceAfter > q.priceAfter
        ? priceAfter - q.priceAfter
        : q.priceAfter - priceAfter;
    expect(diff * BigInt(100)).toBeLessThanOrEqual(q.priceAfter);

    const stakes = await getStakes(api, user.address);
    const pos = stakes.find(
      (s) => s.netuid === netuid && s.hotkey === validator,
    );
    // Stake is held as pool shares: readback can round down by 1 rao.
    expect(within1(pos?.alpha, gotAlpha)).toBe(true);

    const half = gotAlpha / BigInt(2);
    const uq = await quoteUnstake(api, netuid, half);
    const removed = await send(
      api.tx.subtensorModule.removeStakeLimit(
        validator,
        netuid,
        half,
        uq.limitPrice,
        false,
      ),
      user,
    );
    const ev = removed.events.find((e) => e.method === "StakeRemoved");
    expect(near(BigInt(ev?.data[2] ?? "0"), uq.tao, 100)).toBe(true);
    const left = (await getStakes(api, user.address)).find(
      (s) => s.netuid === netuid,
    );
    const expected = (pos?.alpha ?? BigInt(0)) - half;
    // eslint-disable-next-line no-console
    console.log(`stake left ${left?.alpha} alpha, expected ${expected}`);
    // Stake also earns emission between blocks: within 0.01%.
    expect(near(left?.alpha ?? BigInt(0), expected, 10_000)).toBe(true);
  });

  it("a too-tight limit stake fails with a decoded error", async () => {
    const user = await freshUser(BigInt(100));
    const q = await quoteStake(api, netuid, BigInt(20) * TAO, 0);
    // Below the predicted end price: the chain refuses instead of filling.
    const tight = (q.price + q.averagePrice) / BigInt(2);
    await expect(
      send(
        api.tx.subtensorModule.addStakeLimit(
          validator,
          netuid,
          q.tao,
          tight,
          false,
        ),
        user,
      ),
    ).rejects.toThrow(
      /subtensorModule\.SlippageTooHigh|swap\.PriceLimitExceeded/,
    );
  });
});
