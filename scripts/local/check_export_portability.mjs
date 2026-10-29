// X07 portability check on localnet (no browser, no servers): follows the export path
// with the same WASM the iframe uses, then proves the exported key works elsewhere.
//   1. FROST ed25519 keygen from a random seed (group key = coldkey address)
//   2. seed 2-of-2 SSS split [server, client] and combine (cait-sith WASM, as the iframe)
//   3. polkadot.js Keyring ed25519 addFromSeed(recovered) -> same address
//   4. keystore JSON (toJson(password)) -> addFromJson + unlock -> same address
//   5. the imported key signs a real transfer on localnet
// Both shares live in this one process: TEST ONLY. Never prints the seed.
//   node scripts/local/check_export_portability.mjs
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, encodeAddress } from "@polkadot/util-crypto";

const WS = "ws://127.0.0.1:9944";
const root = new URL("../../crypto/", import.meta.url);
async function loadWasm(dir, name) {
  const mod = await import(new URL(`${dir}/pkg/${name}.js`, root));
  mod.initSync({
    module: readFileSync(new URL(`${dir}/pkg/${name}_bg.wasm`, root)),
  });
  return mod;
}
const frost = await loadWasm(
  "teddsa/frost_ed25519_cosmos_compat_wasm",
  "frost_ed25519_cosmos_compat_wasm",
);
const cs = await loadWasm(
  "tecdsa/cait_sith_cosmos_compat_wasm",
  "cait_sith_cosmos_compat_wasm",
);
await cryptoWaitReady();

const id = (n) => {
  const a = new Array(32).fill(0);
  a[31] = n;
  return a;
};
const result = (name, ok, extra = "") =>
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);

const seed = randomBytes(32);
const kg = frost.cli_keygen_seed_ed25519([...seed]);
const coldkey = encodeAddress(
  new Uint8Array(kg.public_key_package.verifying_key),
  42,
);

const [serverPt, clientPt] = cs.seed_sss_split([...seed], [id(2), id(1)], 2);
seed.fill(0);
const recovered = Uint8Array.from(
  cs.seed_sss_combine([serverPt, { x: id(1), y: clientPt.y }], 2),
);

const kr = new Keyring({ type: "ed25519", ss58Format: 42 });
const fromSeed = kr.addFromSeed(recovered);
result(
  "addFromSeed(exported seed) = FROST coldkey address",
  fromSeed.address === coldkey,
  coldkey,
);

const json = fromSeed.toJson("correct horse battery");
const fromJson = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromJson(
  json,
);
fromJson.decodePkcs8("correct horse battery");
result(
  "keystore JSON import + unlock = same address",
  fromJson.address === coldkey,
  `encoding=${JSON.stringify(json.encoding.content)}`,
);
let wrongOk = false;
try {
  new Keyring({ type: "ed25519" })
    .addFromJson(json)
    .decodePkcs8("wrong password");
  wrongOk = true;
} catch {
  /* expected */
}
result("wrong keystore password is rejected", !wrongOk);
recovered.fill(0);

const api = await ApiPromise.create({
  provider: new WsProvider(WS),
  noInitWarn: true,
});
const chainType = (await api.rpc.system.chainType()).toString();
if (chainType !== "Local" && chainType !== "Development")
  throw new Error(`refusing: chainType ${chainType}`);
const alice = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromUri(
  "//Alice",
);
const inBlock = (tx, signer) =>
  new Promise((res, rej) =>
    tx
      .signAndSend(
        signer,
        { nonce: -1 },
        ({ status, dispatchError, txHash }) => {
          if (dispatchError) rej(new Error(dispatchError.toString()));
          else if (status.isInBlock) res(txHash.toHex());
        },
      )
      .catch(rej),
  );
await inBlock(
  api.tx.balances.transferKeepAlive(coldkey, 10_000_000_000n),
  alice,
);
const tx = await inBlock(
  api.tx.balances.transferKeepAlive(alice.address, 1_000_000_000n),
  fromJson,
);
result("imported key signs a transfer on localnet", true, `tx=${tx}`);
await api.disconnect();
process.exit(0);
