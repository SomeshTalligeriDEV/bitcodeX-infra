import type { AuthType } from "@bitcodex/bitcodex-types/auth";

export interface AccountsChangedPayload {
  authType: AuthType | null;
  email: string | null;
  publicKey: string | null;
  name: string | null;
}

export type BitcodeXWalletCoreEvent2 =
  | {
      type: "CORE__accountsChanged";
      authType: AuthType | null;
      email: string | null;
      publicKey: string | null;
      name: string | null;
    }
  | {
      type: "CORE__chainChanged";
    };

export type BitcodeXWalletCoreEventHandler2 =
  | {
      type: "CORE__accountsChanged";
      handler: (payload: AccountsChangedPayload) => void;
    }
  | {
      type: "CORE__chainChanged";
      handler: (payload: undefined) => void;
    };
