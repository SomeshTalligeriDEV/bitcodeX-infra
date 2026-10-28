import type {
  BitcodeXWalletInterface,
  BitcodeXWalletState,
  BitcodeXWalletTheme,
  SignInType,
} from "@bitcodex/bitcodex-sdk-core";
import type { AuthType } from "@bitcodex/bitcodex-types/auth";

export interface BitcodeXProviderConfig {
  apiKey: string;
  sdkEndpoint?: string;
  theme?: BitcodeXWalletTheme;
  eth?: BitcodeXEthConfig | boolean;
  cosmos?: BitcodeXCosmosConfig | boolean;
  svm?: BitcodeXSvmConfig | boolean;
}

export type BitcodeXEthConfig = Record<string, never>;

export type BitcodeXCosmosConfig = Record<string, never>;

export interface BitcodeXSvmConfig {
  chainId: string;
}

export interface BitcodeXCoreState {
  wallet: BitcodeXWalletInterface | null;
  isReady: boolean;
  authType: AuthType | null;
  email: string | null;
  publicKey: string | null;
  name: string | null;
}

export type BitcodeXCoreAction =
  | { type: "INIT_SUCCESS"; wallet: BitcodeXWalletInterface }
  | { type: "READY"; state: BitcodeXWalletState }
  | {
      type: "ACCOUNTS_CHANGED";
      authType: AuthType | null;
      email: string | null;
      publicKey: string | null;
      name: string | null;
    };

export interface UseBitcodeXReturn {
  wallet: BitcodeXWalletInterface | null;
  isReady: boolean;
  isSignedIn: boolean;
  authType: AuthType | null;
  email: string | null;
  name: string | null;
  publicKey: string | null;
  signIn: (type: SignInType) => Promise<void>;
  signOut: () => Promise<void>;
  openSignInModal: () => Promise<void>;
  setTheme: (theme: BitcodeXWalletTheme) => Promise<void>;
}

export type {
  AuthType,
  SignInType,
  BitcodeXWalletInterface,
  BitcodeXWalletState,
  BitcodeXWalletTheme,
};
