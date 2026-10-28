// Chain helpers re-exported so apps need one import. Proxy helpers read ProxyType
// from chain metadata; signAndSend checks proxy.ProxyExecuted for proxy calls.
export {
  type BittensorChainId,
  buildAddProxy,
  buildProxyCall,
  buildRemoveProxy,
  chainProxyTypes,
  checkProxyExecuted,
  getApi,
  NETWORKS,
  toAddress,
  validateProxyType,
} from "@bitcodex/bittensor-chain";

export { BitcodeXBittensorWallet } from "./bittensor_wallet";
export { BittensorWalletEventEmitter } from "./emitter";
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
} from "./types";
