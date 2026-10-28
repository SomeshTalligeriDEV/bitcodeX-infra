import type { Hex } from "viem";

import type { BitcodeXEthWalletInterface } from "@bitcodex-sdk-eth/types";

export async function getPublicKey(
  this: BitcodeXEthWalletInterface,
): Promise<Hex> {
  console.log("[bitcodex-eth] getPublicKey: start");

  if (this.state.publicKey !== null) {
    console.log("[bitcodex-eth] getPublicKey: cached public key");

    return this.state.publicKey;
  }

  await this.waitUntilInitialized;

  console.log(
    "[bitcodex-eth] getPublicKey: getPublicKey from bitcodex-eth wallet",
  );

  const ret = await this.bitcodexWallet.getPublicKey();
  if (ret === null) {
    throw new Error("Failed to fetch public key");
  }

  this.state.publicKey = `0x${ret}`;

  return `0x${ret}`;
}
