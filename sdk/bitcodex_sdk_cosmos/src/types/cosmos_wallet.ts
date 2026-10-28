import type {
  BitcodeXWalletInitArgs,
  BitcodeXWalletInterface,
  EventEmitter3,
  MakeCosmosSigData,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";
import type {
  AccountData,
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignature,
  StdSignDoc,
} from "@cosmjs/amino";
import type {
  DirectSignResponse,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import type {
  ChainInfo,
  KeplrSignOptions,
  Key,
  SettledResponses,
} from "@keplr-wallet/types";

import type {
  BitcodeXCosmosWalletEvent2,
  BitcodeXCosmosWalletEventHandler2,
} from "./event";
import type {
  BitcodeXCosmosWalletInitError,
  LazyInitError,
} from "@bitcodex-sdk-cosmos/errors";
import type { ArbitrarySigVerificationResult } from "@bitcodex-sdk-cosmos/methods/verify_arbitrary";
import type { SignDoc } from "@bitcodex-sdk-cosmos/types/sign";

export interface BitcodeXCosmosWalletState {
  publicKey: Uint8Array | null;
  publicKeyRaw: string | null;
}

export interface BitcodeXCosmosWalletStaticInterface {
  new (bitcodexWallet: BitcodeXWalletInterface): BitcodeXCosmosWalletInterface;
  init: (
    args: BitcodeXWalletInitArgs,
  ) => Result<BitcodeXCosmosWalletInterface, BitcodeXCosmosWalletInitError>;
}

export interface BitcodeXCosmosWalletInterface {
  state: BitcodeXCosmosWalletState;
  bitcodexWallet: BitcodeXWalletInterface;
  eventEmitter: EventEmitter3<
    BitcodeXCosmosWalletEvent2,
    BitcodeXCosmosWalletEventHandler2
  >;
  waitUntilInitialized: Promise<
    Result<BitcodeXCosmosWalletState, LazyInitError>
  >;

  enable: (_chainId: string) => Promise<void>;
  on: (handlerDef: BitcodeXCosmosWalletEventHandler2) => void;
  off: (handlerDef: BitcodeXCosmosWalletEventHandler2) => void;
  getPublicKey: () => Promise<Uint8Array | null>;
  getCosmosChainInfo: () => Promise<ChainInfo[]>;
  experimentalSuggestChain: (_chainInfo: ChainInfo) => Promise<void>;
  getAccounts: () => Promise<AccountData[]>;
  getOfflineSigner: (
    chainId: string,
    signOptions?: KeplrSignOptions,
  ) => OfflineDirectSigner;

  getOfflineSignerOnlyAmino: (
    chainId: string,
    signOptions?: KeplrSignOptions,
  ) => OfflineAminoSigner;

  getOfflineSignerAuto: (
    chainId: string,
    signOptions?: KeplrSignOptions,
  ) => Promise<OfflineDirectSigner | OfflineAminoSigner>;

  getKey: (chainId: string) => Promise<Key>;

  getKeysSettled: (chainIds: string[]) => Promise<SettledResponses<Key>>;

  sendTx: (
    chainId: string,
    tx: unknown,
    mode: "async" | "sync" | "block",
  ) => Promise<Uint8Array>;

  signAmino: (
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions,
  ) => Promise<AminoSignResponse>;

  signDirect: (
    chainId: string,
    signer: string,
    signDoc: SignDoc,
    signOptions?: KeplrSignOptions,
  ) => Promise<DirectSignResponse>;

  signArbitrary: (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
  ) => Promise<StdSignature>;

  verifyArbitrary: (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature,
  ) => Promise<ArbitrarySigVerificationResult>;

  openModal: (data: MakeCosmosSigData) => Promise<OpenModalAckPayload>;
}
