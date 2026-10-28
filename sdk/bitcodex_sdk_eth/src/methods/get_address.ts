import { type Hex, isAddress } from "viem";

import type { BitcodeXEthWalletInterface } from "@bitcodex-sdk-eth/types";
import { publicKeyToEthereumAddress } from "@bitcodex-sdk-eth/utils";

export async function getAddress(
  this: BitcodeXEthWalletInterface,
): Promise<Hex> {
  if (this.state.address !== null) {
    return this.state.address;
  }

  await this.bitcodexWallet.waitUntilInitialized;

  const publicKey = await this.getPublicKey();
  const address = publicKeyToEthereumAddress(publicKey);
  if (!isAddress(address)) {
    throw new Error("Invalid address");
  }

  this.state.address = address;

  return address;
}
