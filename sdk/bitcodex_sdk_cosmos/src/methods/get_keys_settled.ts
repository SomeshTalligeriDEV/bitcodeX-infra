import type { Key, SettledResponses } from "@keplr-wallet/types";

import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export async function getKeysSettled(
  this: BitcodeXCosmosWalletInterface,
  chainIds: string[],
): Promise<SettledResponses<Key>> {
  await this.waitUntilInitialized;

  return Promise.allSettled(chainIds.map((chainId) => this.getKey(chainId)));
}
