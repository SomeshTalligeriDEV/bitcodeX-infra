// X08 on localnet: register a fresh sr25519 hotkey (public address only) from an
// ed25519 coldkey with registerLimit at the quoted cost; check UID, owner and the
// exact charge. BITTENSOR_LOCALNET=1, after scripts/seed_localnet.mjs.
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Hash } from "@polkadot/types/interfaces";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import {
  checkRegistration,
  decayedBurn,
  getHotkeyInfo,
  getOwnedHotkeys,
  quoteRegistration,
} from "@bitcodex-bittensor-chain/hotkeys";
import { hotkeySwapCost } from "@bitcodex-bittensor-chain/swap";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);

let api: ApiPromise;
let alice: KeyringPair;
let netuid: number;

function send(
  tx: ReturnType<ApiPromise["tx"]["balances"]["transferKeepAlive"]>,
  pair: KeyringPair,
): Promise<{ block: Hash; fee: bigint }> {
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
          block: status.asInBlock,
          fee: paid ? BigInt(paid.event.data[1].toString()) : BigInt(-1),
        });
      }
    }).catch(reject);
  });
}

d("hotkeys (localnet)", () => {
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

  it("registers a fresh hotkey: UID appears, owner is the coldkey, charge = quoted cost", async () => {
    const coldkey = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate());
    // A hotkey address as it would come from `btcli wallet show` on the miner machine.
    const hotkey = new Keyring({
      type: "sr25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate()).address;
    await send(
      api.tx.balances.transferKeepAlive(coldkey.address, BigInt(50) * TAO),
      alice,
    );

    const check = await checkRegistration(api, coldkey.address, netuid, hotkey);
    expect(check.success).toBe(true);
    if (!check.success) {
      return;
    }
    const quote = check.data;
    const { block, fee } = await send(
      api.tx.subtensorModule.registerLimit(netuid, hotkey, quote.cost),
      coldkey,
    );

    const header = await api.rpc.chain.getHeader(block);
    const parent = await api.at(header.parentHash);
    const now = await api.at(block);
    const before = (
      (await parent.query.system.account(coldkey.address)) as unknown as {
        data: { free: { toBigInt(): bigint } };
      }
    ).data.free.toBigInt();
    const after = (
      (await now.query.system.account(coldkey.address)) as unknown as {
        data: { free: { toBigInt(): bigint } };
      }
    ).data.free.toBigInt();
    const charged = before - after - fee;
    // The exact charge is the parent block's burn decayed one block.
    const parentBurn = BigInt(
      (await parent.query.subtensorModule.burn(netuid)).toString(),
    );
    // eslint-disable-next-line no-console
    console.log(
      `registration: quoted ${quote.cost} rao, charged ${charged} rao, predicted from parent ${decayedBurn(parentBurn, quote.params)} rao`,
    );
    expect(charged).toBe(decayedBurn(parentBurn, quote.params));
    // Included in the next block → exactly the quoted cost; later → decayed further (≤).
    expect(charged <= quote.cost).toBe(true);

    const info = await getHotkeyInfo(api, hotkey);
    expect(info.owner).toBe(coldkey.address);
    expect(info.subnets.find((s) => s.netuid === netuid)).toBeDefined();
    expect(await getOwnedHotkeys(api, coldkey.address)).toContain(hotkey);

    const again = await checkRegistration(api, coldkey.address, netuid, hotkey);
    expect(again.success ? null : again.err).toMatch(/already registered/);
  });

  it("a limit below the cost fails with a decoded error", async () => {
    const coldkey = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate());
    const hotkey = new Keyring({
      type: "sr25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate()).address;
    await send(
      api.tx.balances.transferKeepAlive(coldkey.address, BigInt(10) * TAO),
      alice,
    );
    const quote = await quoteRegistration(api, netuid);
    await expect(
      send(
        api.tx.subtensorModule.registerLimit(
          netuid,
          hotkey,
          quote.cost / BigInt(2),
        ),
        coldkey,
      ),
    ).rejects.toThrow(/RegistrationPriceLimitExceeded/);
  });

  it("refuses a hotkey owned by another coldkey before signing", async () => {
    const validator = new Keyring({
      type: "sr25519",
      ss58Format: 42,
    }).addFromUri("//BitcodeXValidator").address;
    const res = await checkRegistration(api, alice.address, netuid, validator);
    // //BitcodeXValidator is owned by Alice (seed script), so use a fresh coldkey.
    const other = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate()).address;
    const res2 = await checkRegistration(api, other, netuid, validator);
    expect(res.success ? null : res.err).toMatch(/already registered|owned/);
    expect(res2.success ? null : res2.err).toMatch(/different coldkey/);
  });

  it("charges exactly the chain's swap cost and moves the UID", async () => {
    const coldkey = new Keyring({
      type: "ed25519",
      ss58Format: 42,
    }).addFromMnemonic(mnemonicGenerate());
    const sr = new Keyring({ type: "sr25519", ss58Format: 42 });
    const oldHk = sr.addFromMnemonic(mnemonicGenerate()).address;
    const newHk = sr.addFromMnemonic(mnemonicGenerate()).address;
    await send(
      api.tx.balances.transferKeepAlive(coldkey.address, BigInt(20) * TAO),
      alice,
    );
    const q = await quoteRegistration(api, netuid);
    await send(
      api.tx.subtensorModule.registerLimit(netuid, oldHk, q.cost),
      coldkey,
    );

    const { block, fee } = await send(
      api.tx.subtensorModule.swapHotkey(oldHk, newHk, netuid),
      coldkey,
    );
    const header = await api.rpc.chain.getHeader(block);
    const free = async (at: Hash) =>
      (
        (await (
          await api.at(at)
        ).query.system.account(coldkey.address)) as unknown as {
          data: { free: { toBigInt(): bigint } };
        }
      ).data.free.toBigInt();
    const charged = (await free(header.parentHash)) - (await free(block)) - fee;
    expect(charged).toBe(hotkeySwapCost(api, netuid));
    const info = await getHotkeyInfo(api, newHk);
    expect(info.owner).toBe(coldkey.address);
    expect(info.subnets.some((s) => s.netuid === netuid)).toBe(true);
    expect(
      (await getHotkeyInfo(api, oldHk)).subnets.some(
        (s) => s.netuid === netuid,
      ),
    ).toBe(false);
  });
});
