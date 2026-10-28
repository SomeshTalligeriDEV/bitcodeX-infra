import type {
  BitcodeXWalletInitArgs,
  BitcodeXWalletInterface,
} from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";
import type {
  Connection,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

import type { SvmWalletEvent, SvmWalletEventHandler } from "./event";
import type { BitcodeXSvmWalletChainOptions } from "./internal";
import type {
  BitcodeXSvmWalletInitError,
  LazyInitError,
} from "@bitcodex-sdk-svm/errors";

export interface BitcodeXSvmWalletState {
  publicKey: PublicKey | null;
  publicKeyRaw: string | null;
  chainId: string;
}

export type BitcodeXSvmWalletInitArgs = BitcodeXWalletInitArgs & {
  chain_id: string;
};

export interface BitcodeXSvmWalletStaticInterface {
  new (
    bitcodexWallet: BitcodeXWalletInterface,
    chainOptions: BitcodeXSvmWalletChainOptions,
  ): BitcodeXSvmWalletInterface;
  init: (
    args: BitcodeXSvmWalletInitArgs,
  ) => Result<BitcodeXSvmWalletInterface, BitcodeXSvmWalletInitError>;
}

export interface BitcodeXSvmWalletInterface {
  state: BitcodeXSvmWalletState;
  bitcodexWallet: BitcodeXWalletInterface;
  waitUntilInitialized: Promise<Result<BitcodeXSvmWalletState, LazyInitError>>;

  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(
    transaction: T,
  ) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ) => Promise<T[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  sendTransaction: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendOptions,
  ) => Promise<TransactionSignature>;

  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendOptions,
  ) => Promise<{ signature: TransactionSignature }>;
  signAndSendAllTransactions: (
    transactions: (Transaction | VersionedTransaction)[],
    connection: Connection,
    options?: SendOptions,
  ) => Promise<{ signatures: TransactionSignature[] }>;

  on: <K extends SvmWalletEvent>(
    event: K,
    handler: SvmWalletEventHandler<K>,
  ) => void;
  off: <K extends SvmWalletEvent>(
    event: K,
    handler: SvmWalletEventHandler<K>,
  ) => void;
}
