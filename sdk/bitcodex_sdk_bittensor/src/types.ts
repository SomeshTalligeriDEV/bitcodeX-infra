import type { BitcodeXWalletInitArgs } from "@bitcodex/bitcodex-sdk-core";
import type { BittensorChainId } from "@bitcodex/bittensor-chain";

export type BitcodeXBittensorInitArgs = BitcodeXWalletInitArgs & {
  chain_id: BittensorChainId;
};

export interface BitcodeXBittensorState {
  /** SS58 coldkey address (prefix 42), or null when signed out. */
  address: string | null;
  /** Hex ed25519 group public key from the iframe. */
  publicKeyRaw: string | null;
  chainId: BittensorChainId;
}

export type BittensorWalletEventMap = {
  connect: string;
  disconnect: undefined;
  accountChanged: string | null;
};

export type BittensorWalletEvent = keyof BittensorWalletEventMap;

export type BittensorWalletEventHandler<K extends BittensorWalletEvent> = (
  payload: BittensorWalletEventMap[K],
) => void;

export interface SendResult {
  txHash: string;
  blockHash: string;
}

export type BitcodeXBittensorInitError = {
  type: "bitcodex_bittensor_wallet_init_fail";
  msg: string;
};
