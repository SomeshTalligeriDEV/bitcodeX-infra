export { SvmWalletEventEmitter } from "./emitter";
export type {
  BitcodeXSvmWalletError,
  BitcodeXSvmWalletInitError,
  LazyInitError,
} from "./errors";
export { BitcodeXSvmWallet } from "./svm_wallet";
export type {
  BitcodeXSvmWalletInitArgs,
  BitcodeXSvmWalletInterface,
  BitcodeXSvmWalletState,
  BitcodeXSvmWalletStaticInterface,
  SvmSignAllTransactionsParams,
  SvmSignAllTransactionsResult,
  SvmSignMessageParams,
  SvmSignMessageResult,
  SvmSignParams,
  SvmSignResult,
  SvmSignTransactionParams,
  SvmSignTransactionResult,
  SvmWalletEvent,
  SvmWalletEventHandler,
  SvmWalletEventMap,
} from "./types";
export type { WalletStandardConfig } from "./wallet-standard";
// Wallet Standard
export {
  BITCODEX_WALLET_NAME,
  BitcodeXStandardWallet,
  BitcodeXSvmWalletAccount,
  buildSignInMessage,
  createSignInFeature,
  registerWalletStandard,
} from "./wallet-standard";
