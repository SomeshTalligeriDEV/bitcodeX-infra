import type { BitcodeXWalletInitArgs } from "@bitcodex/bitcodex-sdk-core";
import type {
  BittensorChainId,
  SiwbFields,
  SwapQuote,
} from "@bitcodex/bittensor-chain";

import type { HistoryEntry, HistoryStore } from "./history";

export type BitcodeXBittensorInitArgs = BitcodeXWalletInitArgs & {
  chain_id: BittensorChainId;
  /** Override the network's default endpoint (still network-checked). */
  rpc_url?: string;
  /** Where history is kept; defaults to localStorage on the app's origin. */
  history_store?: HistoryStore;
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
  historyChanged: HistoryEntry;
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

export interface StakeArgs {
  netuid: number;
  /** Validator hotkey (SS58). */
  hotkey: string;
  /** Decimal TAO, e.g. "50". */
  amountTao: string;
  /** Max price move accepted, basis points (100 = 1%, the default). */
  slippageBps?: number;
  allowPartial?: boolean;
}

export interface UnstakeArgs {
  netuid: number;
  hotkey: string;
  /** Decimal alpha, e.g. "25". */
  amountAlpha: string;
  slippageBps?: number;
  allowPartial?: boolean;
}

export interface StakeResult extends SendResult {
  quote: SwapQuote;
}

export interface SignInWithBittensorArgs {
  /** Server-issued, at least 8 alphanumeric characters (replay protection). */
  nonce: string;
  statement?: string;
  /** Defaults to window.location.host. Must equal the requesting site's host. */
  domain?: string;
  /** Defaults to window.location.origin. */
  uri?: string;
  /** Defaults to 10. */
  expirationMinutes?: number;
  requestId?: string;
  resources?: string[];
}

export interface SignInWithBittensorResult {
  message: string;
  /** 64-byte ed25519 signature over <Bytes>message</Bytes>, hex. */
  signature: string;
  address: string;
  fields: SiwbFields;
}

export interface RegisterHotkeyResult extends SendResult {
  /** Cost shown and used as the limit (rao). */
  quotedMax: bigint;
  /** Exact registration cost charged on chain (rao, excl. tx fee); <= quotedMax. */
  charged: bigint;
}
