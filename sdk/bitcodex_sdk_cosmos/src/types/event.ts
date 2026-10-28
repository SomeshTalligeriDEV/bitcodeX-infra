import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type { Key } from "@keplr-wallet/types";

export interface AccountChangePayload {
  authType: AuthType | null;
  email: string | null;
  publicKey: Key["pubKey"] | null;
  name: string | null;
}

export type BitcodeXCosmosWalletEvent2 =
  | ({
      type: "accountsChanged";
    } & AccountChangePayload)
  | {
      type: "chainChanged";
    };

export type BitcodeXCosmosWalletEventHandler2 =
  | {
      type: "accountsChanged";
      handler: (payload: AccountChangePayload) => void;
    }
  | {
      type: "chainChanged";
      handler: (payload: undefined) => void;
    };
