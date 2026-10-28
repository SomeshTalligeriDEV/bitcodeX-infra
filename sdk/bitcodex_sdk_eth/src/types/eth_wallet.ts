import type {
  BitcodeXWalletInitArgs,
  BitcodeXWalletInterface,
} from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";
import type { Address, Hex } from "viem";

import type { BitcodeXViemAccount } from "./account";
import type { EthSignParams, EthSignResult } from "./sign";
import type {
  BitcodeXEthWalletInitError,
  LazyInitError,
} from "@bitcodex-sdk-eth/errors";
import type { BitcodeXEIP1193Provider } from "@bitcodex-sdk-eth/provider";

export interface BitcodeXEthWalletState {
  publicKey: Hex | null;
  address: Address | null;
  publicKeyRaw: string | null;
}

export type BitcodeXEthWalletInitArgs = BitcodeXWalletInitArgs;

export interface BitcodeXEthWalletStaticInterface {
  new (bitcodexWallet: BitcodeXWalletInterface): BitcodeXEthWalletInterface;
  init: (
    args: BitcodeXEthWalletInitArgs,
  ) => Result<BitcodeXEthWalletInterface, BitcodeXEthWalletInitError>;
}

export interface BitcodeXEthWalletInterface {
  state: BitcodeXEthWalletState;
  bitcodexWallet: BitcodeXWalletInterface;
  provider: BitcodeXEIP1193Provider | null;
  waitUntilInitialized: Promise<Result<BitcodeXEthWalletState, LazyInitError>>;

  getEthereumProvider: () => Promise<BitcodeXEIP1193Provider>;
  sign: (message: string) => Promise<Hex>;
  switchChain: (chainId: Hex | number) => Promise<void>;
  toViemAccount: () => Promise<BitcodeXViemAccount>;
  getPublicKey: () => Promise<Hex>;
  getAddress: () => Promise<Hex>;
  makeSignature: (params: EthSignParams) => Promise<EthSignResult>;
}
