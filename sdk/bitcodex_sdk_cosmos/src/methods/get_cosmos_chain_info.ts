import type { ChainInfo } from "@keplr-wallet/types";

import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";
import { sendGetCosmosChainInfo } from "@bitcodex-sdk-cosmos/utils/chain";

export async function getCosmosChainInfo(
  this: BitcodeXCosmosWalletInterface,
): Promise<ChainInfo[]> {
  const chainInfoRes = await sendGetCosmosChainInfo(this.bitcodexWallet);

  if (!chainInfoRes.success) {
    throw new Error(
      `Failed to get chain registry response: ${chainInfoRes.err.toString()}`,
    );
  }

  return chainInfoRes.data;
}
