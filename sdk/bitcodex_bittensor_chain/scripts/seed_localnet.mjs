// Localnet only: create one subnet with a validator so staking has a real target.
// Idempotent: reuses the subnet already owned by the dev validator hotkey.
// Uses public dev URIs (//Alice, //BitcodeXValidator); never a real key.
//   node sdk/bitcodex_bittensor_chain/scripts/seed_localnet.mjs
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";

const WS = process.env.WS ?? "ws://127.0.0.1:9944";
const TAO = 1_000_000_000n;
if (!/^ws:\/\/(127\.0\.0\.1|localhost):\d+$/.test(WS)) {
  throw new Error(`refusing: ${WS} is not a local endpoint`);
}

await cryptoWaitReady();
const api = await ApiPromise.create({
  provider: new WsProvider(WS),
  noInitWarn: true,
});
const chainType = (await api.rpc.system.chainType()).toString();
if (chainType !== "Local" && chainType !== "Development") {
  throw new Error(`refusing: chainType is ${chainType}`);
}

const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
const alice = keyring.addFromUri("//Alice");
const validator = keyring.addFromUri("//BitcodeXValidator");

function send(tx, signer, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}: not in a block after 60 s`)),
      60_000,
    );
    tx.signAndSend(
      signer,
      { nonce: -1 },
      ({ status, dispatchError, events, txHash }) => {
        if (dispatchError) {
          clearTimeout(timer);
          const e = dispatchError.isModule
            ? api.registry.findMetaError(dispatchError.asModule)
            : null;
          reject(
            new Error(
              `${label}: ${e ? `${e.section}.${e.name}` : dispatchError.toString()}`,
            ),
          );
        } else if (status.isInBlock) {
          clearTimeout(timer);
          resolve({ events, txHash: txHash.toHex() });
        }
      },
    ).catch((err) => {
      clearTimeout(timer);
      reject(new Error(`${label}: ${err.message}`));
    });
  });
}

async function findSubnet() {
  const owners = await api.query.subtensorModule.subnetOwnerHotkey.entries();
  for (const [key, owner] of owners) {
    if (owner.toString() === validator.address) {
      return key.args[0].toNumber();
    }
  }
  return null;
}

let netuid = await findSubnet();
if (netuid === null) {
  const r = await send(
    api.tx.subtensorModule.registerNetwork(validator.address),
    alice,
    "registerNetwork",
  );
  netuid = r.events
    .find((e) => e.event.method === "NetworkAdded")
    .event.data[0].toNumber();
  console.log(`created subnet ${netuid} tx=${r.txHash}`);
}
const started = (
  await api.query.subtensorModule.firstEmissionBlockNumber(netuid)
).isSome;
if (!started) {
  const r = await send(
    api.tx.subtensorModule.startCall(netuid),
    alice,
    "startCall",
  );
  console.log(`started subnet ${netuid} tx=${r.txHash}`);
}
const own = (
  await api.call.stakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid(
    validator.address,
    alice.address,
    netuid,
  )
).toJSON();
if (!own || BigInt(own.stake) === 0n) {
  const r = await send(
    api.tx.subtensorModule.addStake(validator.address, netuid, 100n * TAO),
    alice,
    "addStake",
  );
  console.log(`Alice staked 100 TAO to the validator tx=${r.txHash}`);
}
const price = (
  await api.call.swapRuntimeApi.currentAlphaPrice(netuid)
).toString();
console.log(
  JSON.stringify({ netuid, validatorHotkey: validator.address, price }),
);
await api.disconnect();
