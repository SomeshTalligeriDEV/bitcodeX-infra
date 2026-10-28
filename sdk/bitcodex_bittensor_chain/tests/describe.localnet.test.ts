// Localnet: cards built from real metadata, the way the iframe decodes a host payload,
// and the previewed fee checked against the fee actually charged. BITTENSOR_LOCALNET=1.
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Call } from "@polkadot/types/interfaces";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

import { disconnectAll, getApi } from "@bitcodex-bittensor-chain/api";
import { describeCall, flattenCards } from "@bitcodex-bittensor-chain/describe";
import { toPlainCall } from "@bitcodex-bittensor-chain/plain_call";

const RUN = process.env.BITTENSOR_LOCALNET === "1";
const d = RUN ? describe : describe.skip;
const TAO = BigInt(1_000_000_000);

let api: ApiPromise;
let alice: KeyringPair;
let bob: string;

/** Decode from the call hex, exactly as the iframe does with `payload.method`. */
function cardFor(hex: string) {
  return describeCall(
    toPlainCall(api.registry.createType("Call", hex) as Call),
  );
}

d("describe (localnet)", () => {
  beforeAll(async () => {
    await cryptoWaitReady();
    const res = await getApi("bittensor:localnet");
    if (!res.success) {
      throw new Error(res.err);
    }
    api = res.data;
    const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
    alice = keyring.addFromUri("//Alice");
    bob = keyring.addFromMnemonic(mnemonicGenerate()).address;
  });

  afterAll(async () => {
    await disconnectAll();
  });

  it("transfer, stake, register, proxy-wrapped stake and batch show the right cards", () => {
    const transfer = cardFor(
      api.tx.balances.transferKeepAlive(bob, TAO * BigInt(10)).method.toHex(),
    );
    expect(transfer.title).toBe("Send TAO");
    expect(transfer.rows).toContainEqual({
      label: "To",
      value: bob,
      mono: true,
    });
    expect(transfer.rows).toContainEqual({ label: "Amount", value: "10 TAO" });

    const stake = cardFor(
      api.tx.subtensorModule.addStake(bob, 1, TAO * BigInt(50)).method.toHex(),
    );
    expect(stake.title).toBe("Stake TAO");
    expect(stake.rows.map((r) => r.value)).toEqual(["Subnet 1", bob, "50 TAO"]);

    const register = cardFor(
      api.tx.subtensorModule.burnedRegister(1, bob).method.toHex(),
    );
    expect(register.title).toBe("Register a hotkey on a subnet");

    const proxied = cardFor(
      api.tx.proxy
        .proxy(
          alice.address,
          null,
          api.tx.subtensorModule.addStake(bob, 1, TAO),
        )
        .method.toHex(),
    );
    expect(proxied.known).toBe(true);
    expect(proxied.title).toBe("Act on behalf of another wallet");
    expect(proxied.inner[0].title).toBe("Stake TAO");

    const batch = cardFor(
      api.tx.utility
        .batch([
          api.tx.system.remark("hello"),
          api.tx.balances.transferKeepAlive(bob, TAO * BigInt(3)),
        ])
        .method.toHex(),
    );
    const hidden = flattenCards(batch).find((c) => c.title === "Send TAO");
    expect(hidden?.rows).toContainEqual({ label: "Amount", value: "3 TAO" });
    expect(flattenCards(batch)[1].rows[0].value).toBe("hello");
  });

  it("sudo calls are unknown (red)", () => {
    const card = cardFor(
      api.tx.sudo.sudo(api.tx.system.remark("x")).method.toHex(),
    );
    expect(card.known).toBe(false);
  });

  it("previewed fee matches the fee charged", async () => {
    const tx = api.tx.balances.transferKeepAlive(bob, TAO);
    const preview = (await tx.paymentInfo(alice.address)).partialFee.toBigInt();
    const charged = await new Promise<bigint>((resolve, reject) => {
      tx.signAndSend(
        alice,
        { nonce: -1 },
        ({ status, events, dispatchError }) => {
          if (dispatchError) {
            reject(new Error(dispatchError.toString()));
          } else if (status.isInBlock) {
            const paid = events.find(
              (e) => e.event.section === "transactionPayment",
            );
            resolve(
              paid
                ? BigInt(
                    (
                      paid.event.data[1] as unknown as { toString(): string }
                    ).toString(),
                  )
                : BigInt(-1),
            );
          }
        },
      ).catch(reject);
    });
    // eslint-disable-next-line no-console
    console.log(`fee preview ${preview} rao, charged ${charged} rao`);
    expect(charged).toBeGreaterThan(BigInt(0));
    const diff = charged > preview ? charged - preview : preview - charged;
    // Within 1% (weight-based fee estimates can differ slightly from the charged fee).
    expect(diff * BigInt(100)).toBeLessThanOrEqual(preview);
  });
});
