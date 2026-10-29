import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type { Result } from "@bitcodex/stdlib-js";

import type {
  BitcodeXWalletCoreEvent2,
  BitcodeXWalletCoreEventHandler2,
} from "./event";
import type { OpenModalAckPayload } from "./modal";
import type {
  BitcodeXWalletMsg,
  BitcodeXWalletMsgOpenModal,
  WalletInfo,
} from "./msg";
import type { SignInType } from "./oauth";
import type {
  BitcodeXWalletInitError,
  OpenModalError,
} from "@bitcodex-sdk-core/errors";
import type { EventEmitter3 } from "@bitcodex-sdk-core/event";

export type { WalletInfo };

export type BitcodeXWalletTheme = "light" | "dark";

export interface BitcodeXWalletStaticInterface {
  new (
    apiKey: string,
    iframe: HTMLIFrameElement,
    sdkEndpoint: string,
  ): BitcodeXWalletWebInterface;
  version: string;
  init: (
    args: BitcodeXWalletInitArgs,
  ) => Result<BitcodeXWalletInterface, BitcodeXWalletInitError>;
}

/**
 * Wallet interface consumed by chain SDKs (eth, cosmos, svm).
 * Platform-specific implementations (web, mobile) implement this.
 */
export interface BitcodeXWalletInterface {
  origin: string;
  state: BitcodeXWalletState;
  apiKey: string;
  sdkEndpoint: string;
  eventEmitter: EventEmitter3<
    BitcodeXWalletCoreEvent2,
    BitcodeXWalletCoreEventHandler2
  >;
  waitUntilInitialized: Promise<Result<BitcodeXWalletState, string>>;

  openModal: (
    msg: BitcodeXWalletMsgOpenModal,
  ) => Promise<Result<OpenModalAckPayload, OpenModalError>>;
  openSignInModal: () => Promise<void>;
  closeModal: () => void;
  sendMsgToIframe: (msg: BitcodeXWalletMsg) => Promise<BitcodeXWalletMsg>;
  signIn: (type: SignInType) => Promise<void>;
  signOut: () => Promise<void>;
  getPublicKey: () => Promise<string | null>;
  getPublicKeyEd25519: () => Promise<string | null>;
  /** Access token for your backend (verify with @bitcodex/server). Null when signed out. */
  getAccessToken: () => Promise<string | null>;
  getEmail: () => Promise<string | null>;
  getName: () => Promise<string | null>;
  getWalletInfo: () => Promise<WalletInfo | null>;
  getAuthType: () => Promise<AuthType | null>;
  setTheme: (theme: BitcodeXWalletTheme) => Promise<void>;
  startEmailSignIn: (email: string) => Promise<void>;
  completeEmailSignIn: (email: string, code: string) => Promise<void>;
  on: (handlerDef: BitcodeXWalletCoreEventHandler2) => void;
  off: (handlerDef: BitcodeXWalletCoreEventHandler2) => void;
}

/**
 * Web-specific wallet interface used internally by bitcodex_sdk_core.
 * Extends BitcodeXWalletInterface with browser-only fields.
 */
export interface BitcodeXWalletWebInterface extends BitcodeXWalletInterface {
  iframe: HTMLIFrameElement;
  activePopupId: string | null;
  activePopupWindow: Window | null;
  _theme: BitcodeXWalletTheme | null;
}

export interface BitcodeXWalletInitArgs {
  api_key: string;
  sdk_endpoint?: string;
  theme?: BitcodeXWalletTheme;
}

export interface BitcodeXWalletState {
  authType: AuthType | null;
  email: string | null;
  publicKey: string | null;
  name: string | null;
}
