// Prints ONE new throwaway Bittensor address (SS58, prefix 42) for the demo recording,
// for example a hotkey to add or a recipient to send to. The key is discarded on
// purpose: only the public address is printed, so nothing secret is ever shown.
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, mnemonicGenerate } from "@polkadot/util-crypto";

await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromMnemonic(
  mnemonicGenerate(),
);
console.log(pair.address);
