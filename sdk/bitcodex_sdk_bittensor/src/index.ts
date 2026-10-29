// Chain helpers re-exported so apps need one import. Proxy helpers read ProxyType
// from chain metadata; signAndSend checks proxy.ProxyExecuted for proxy calls.
export {
  type Balances,
  type BittensorChainId,
  buildAddProxy,
  buildProxyCall,
  buildRemoveProxy,
  type CallCard,
  chainProxyTypes,
  checkProxyExecuted,
  DEFAULT_SLIPPAGE_BPS,
  describeCall,
  formatPrice,
  formatTaoAmount,
  formatUnits,
  getApi,
  listSubnets,
  NETWORKS,
  parseUnits,
  type StakePosition,
  type SubnetSummary,
  type SwapQuote,
  toAddress,
  validateProxyType,
} from "@bitcodex/bittensor-chain";

export { BitcodeXBittensorWallet } from "./bittensor_wallet";
export { BittensorWalletEventEmitter } from "./emitter";
export {
  addEntry,
  defaultHistoryStore,
  type HistoryEntry,
  type HistoryStore,
  historyKey,
} from "./history";
export { INJECTED_NAME, type InjectWeb3Options, injectWeb3 } from "./inject";
export { USER_CANCELLED } from "./make_signature";
export { extrinsicOutcome, isProxyCall } from "./outcome";
export type {
  BitcodeXBittensorInitArgs,
  BitcodeXBittensorInitError,
  BitcodeXBittensorState,
  BittensorWalletEvent,
  BittensorWalletEventHandler,
  BittensorWalletEventMap,
  SendResult,
  StakeArgs,
  StakeResult,
  UnstakeArgs,
} from "./types";
