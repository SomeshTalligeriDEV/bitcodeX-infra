import { type Hex, toHex } from "viem";

import type { BitcodeXEthWalletInterface } from "@bitcodex-sdk-eth/types";

export async function switchChain(
  this: BitcodeXEthWalletInterface,
  chainId: Hex | number,
): Promise<void> {
  const provider = await this.getEthereumProvider();

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: toHex(chainId) }],
  });
}
