import type { SvmWalletEventEmitter } from "../emitter";
import type { BitcodeXSvmWalletInterface } from "./svm_wallet";

export interface BitcodeXSvmWalletChainOptions {
  chain_id: string;
}

/**
 * Internal interface that extends BitcodeXSvmWalletInterface with private emitter.
 * Used internally by SDK methods that need access to the event emitter.
 */
export interface BitcodeXSvmWalletInternal extends BitcodeXSvmWalletInterface {
  _emitter: SvmWalletEventEmitter;
  _accountsChangedHandler: (payload: { publicKey: string | null }) => void;
  _chainOptions: BitcodeXSvmWalletChainOptions;
}
