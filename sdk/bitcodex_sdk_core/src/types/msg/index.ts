import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type { Bytes32 } from "@bitcodex/bytes";
import type { Result } from "@bitcodex/stdlib-js";
import type { ChainInfo } from "@keplr-wallet/types";

import type { InitPayload } from "@bitcodex-sdk-core/types/init";
import type {
  OpenModalAckPayload,
  OpenModalPayload,
} from "@bitcodex-sdk-core/types/modal";
import type {
  OAuthPayload,
  OAuthTokenRequestPayload,
} from "@bitcodex-sdk-core/types/oauth";
import type { OAuthSignInError } from "@bitcodex-sdk-core/types/sign_in";

export * from "../protected/export_priv_key";
export * from "./get_conn_apps";

export type BitcodeXWalletMsgGetPublicKey = {
  target: "bitcodex_attached";
  msg_type: "get_public_key";
  payload: null;
};

export type BitcodeXWalletMsgGetPublicKeyAck = {
  target: "bitcodex_sdk";
  msg_type: "get_public_key_ack";
  payload: Result<string, string>;
};

/** App settings from the developer dashboard (X11), as the iframe sees them. */
export interface BitcodeXAppConfig {
  app_id: string;
  label: string;
  allowed_origins: string[];
  /** Enabled login methods in display order, e.g. ["google", "github"]. */
  login_methods: string[];
  accent_color: string | null;
  theme_mode: "light" | "dark" | "system";
  logo_url: string | null;
  network: string;
  /** Whether the requesting page's origin may use this app. */
  origin_allowed: boolean;
}

/** MFA settings (X12), only from the user dashboard's origins. */
export type BitcodeXWalletMsgMfa = {
  target: "bitcodex_attached";
  msg_type: "mfa";
  payload: {
    action: "status" | "enroll" | "confirm" | "threshold" | "disable";
    body: Record<string, unknown>;
  };
};

export type BitcodeXWalletMsgMfaAck = {
  target: "bitcodex_sdk";
  msg_type: "mfa_ack";
  payload: Result<Record<string, unknown>, string>;
};

/** Wallet login (X04) calls, forwarded by the iframe to the API with the app key. */
export type BitcodeXWalletMsgWalletLogin = {
  target: "bitcodex_attached";
  msg_type: "wallet_login";
  payload: {
    action: "nonce" | "verify" | "link";
    body: Record<string, unknown>;
  };
};

export type BitcodeXWalletMsgWalletLoginAck = {
  target: "bitcodex_sdk";
  msg_type: "wallet_login_ack";
  payload: Result<Record<string, unknown>, string>;
};

export type BitcodeXWalletMsgGetAccessToken = {
  target: "bitcodex_attached";
  msg_type: "get_access_token";
  payload: null;
};

export type BitcodeXWalletMsgGetAccessTokenAck = {
  target: "bitcodex_sdk";
  msg_type: "get_access_token_ack";
  payload: Result<{ access_token: string; expires_in: number }, string>;
};

export type BitcodeXWalletMsgGetAppConfig = {
  target: "bitcodex_attached";
  msg_type: "get_app_config";
  payload: null;
};

export type BitcodeXWalletMsgGetAppConfigAck = {
  target: "bitcodex_sdk";
  msg_type: "get_app_config_ack";
  payload: Result<BitcodeXAppConfig, string>;
};

export type BitcodeXWalletMsgGetPublicKeyEd25519 = {
  target: "bitcodex_attached";
  msg_type: "get_public_key_ed25519";
  payload: null;
};

export type BitcodeXWalletMsgGetPublicKeyEd25519Ack = {
  target: "bitcodex_sdk";
  msg_type: "get_public_key_ed25519_ack";
  payload: Result<string, string>;
};

export type BitcodeXWalletMsgSetOAuthNonce = {
  target: "bitcodex_attached";
  msg_type: "set_oauth_nonce";
  payload: string;
};

export type BitcodeXWalletMsgSetOAuthNonceAck = {
  target: "bitcodex_sdk";
  msg_type: "set_oauth_nonce_ack";
  payload: Result<null, string>;
};

export type BitcodeXWalletMsgSetCodeVerifier = {
  target: "bitcodex_attached";
  msg_type: "set_code_verifier";
  payload: string;
};

export type BitcodeXWalletMsgSetCodeVerifierAck = {
  target: "bitcodex_sdk";
  msg_type: "set_code_verifier_ack";
  payload: Result<null, string>;
};

export type BitcodeXWalletMsgOAuthSignInUpdate = {
  target: "bitcodex_sdk";
  msg_type: "oauth_sign_in_update";
  payload: Result<null, OAuthSignInError>;
};

export type BitcodeXWalletMsgOAuthSignInUpdateAck = {
  target: "bitcodex_attached";
  msg_type: "oauth_sign_in_update_ack";
  payload: null;
};

export type BitcodeXWalletMsgOAuthInfoPass = {
  target: "bitcodex_attached";
  msg_type: "oauth_info_pass";
  payload: OAuthPayload | OAuthTokenRequestPayload;
};

export type BitcodeXWalletMsgOAuthInfoPassAck = {
  target: "bitcodex_attached_popup";
  msg_type: "oauth_info_pass_ack";
  payload: null;
};

export type BitcodeXWalletMsgSignOut = {
  target: "bitcodex_attached";
  msg_type: "sign_out";
  payload: null;
};

export type BitcodeXWalletMsgSignOutAck = {
  target: "bitcodex_sdk";
  msg_type: "sign_out_ack";
  payload: Result<null, string>;
};

export type BitcodeXWalletMsgOpenModal = {
  target: "bitcodex_attached";
  msg_type: "open_modal";
  payload: OpenModalPayload;
};

export type BitcodeXWalletMsgOpenModalAck = {
  target: "bitcodex_sdk";
  msg_type: "open_modal_ack";
  payload: OpenModalAckPayload;
};

export type BitcodeXWalletMsgHideModal = {
  target: "bitcodex_attached";
  msg_type: "hide_modal";
  payload: null;
};

export type BitcodeXWalletMsgHideModalAck = {
  target: "bitcodex_sdk";
  msg_type: "hide_modal_ack";
  payload: Result<null, string>;
};

export type BitcodeXWalletMsgInit = {
  target: "bitcodex_sdk";
  msg_type: "init";
  payload: Result<InitPayload, string>;
};

export type BitcodeXWalletMsgInitAck = {
  target: "bitcodex_attached";
  msg_type: "init_ack";
  payload: Result<null, string>;
};

export type BitcodeXWalletMsgGetEmail = {
  target: "bitcodex_attached";
  msg_type: "get_email";
  payload: null;
};

export type BitcodeXWalletMsgGetEmailAck = {
  target: "bitcodex_sdk";
  msg_type: "get_email_ack";
  payload: Result<string, string>;
};

export type BitcodeXWalletMsgGetName = {
  target: "bitcodex_attached";
  msg_type: "get_name";
  payload: null;
};

export type BitcodeXWalletMsgGetNameAck = {
  target: "bitcodex_sdk";
  msg_type: "get_name_ack";
  payload: Result<string, string>;
};

export type WalletInfo = {
  authType: AuthType;
  publicKey: string;
  email: string | null;
  name: string | null;
};

export type BitcodeXWalletMsgGetWalletInfo = {
  target: "bitcodex_attached";
  msg_type: "get_wallet_info";
  payload: null;
};

export type BitcodeXWalletMsgGetWalletInfoAck = {
  target: "bitcodex_sdk";
  msg_type: "get_wallet_info_ack";
  payload: Result<WalletInfo, string>;
};

export type BitcodeXWalletMsgGetAuthType = {
  target: "bitcodex_attached";
  msg_type: "get_auth_type";
  payload: null;
};

export type BitcodeXWalletMsgGetAuthTypeAck = {
  target: "bitcodex_sdk";
  msg_type: "get_auth_type_ack";
  payload: Result<AuthType, string>;
};

export type BitcodeXWalletMsgGetCosmosChainInfo = {
  target: "bitcodex_attached";
  msg_type: "get_cosmos_chain_info";
  payload: {
    chain_id: string | null;
  };
};

export type BitcodeXWalletMsgGetCosmosChainInfoAck = {
  target: "bitcodex_sdk";
  msg_type: "get_cosmos_chain_info_ack";
  payload: Result<ChainInfo[], string>;
};

export type BitcodeXWalletMsgGetEthChainInfo = {
  target: "bitcodex_attached";
  msg_type: "get_eth_chain_info";
  payload: {
    chain_id: string | null;
  };
};

export type BitcodeXWalletMsgGetEthChainInfoAck = {
  target: "bitcodex_sdk";
  msg_type: "get_eth_chain_info_ack";
  payload: Result<ChainInfo[], string>;
};

export type BitcodeXWalletMsgImportPrivateKey = {
  target: "bitcodex_attached";
  msg_type: "import_private_key";
  payload: OAuthPayload;
};

export type BitcodeXWalletMsgImportPrivateKeyAck = {
  target: "bitcodex_sdk";
  msg_type: "import_private_key_ack";
  payload: Result<Bytes32, string>;
};

export type OAuthProvider = "google" | "x" | "discord" | "github";

export type BitcodeXWalletMsgGenerateOAuthUrl = {
  target: "bitcodex_attached";
  msg_type: "generate_oauth_url";
  payload: {
    provider: OAuthProvider;
    apiKey: string;
    targetOrigin: string;
    redirectScheme?: string | null;
    /** When true, OAuth URL includes mobileOsBrowser flag in state.
     *  Used by the OS-browser login flow. */
    mobileOsBrowser?: boolean;
  };
};

export type BitcodeXWalletMsgGenerateOAuthUrlAck = {
  target: "bitcodex_sdk";
  msg_type: "generate_oauth_url_ack";
  payload: Result<{ url: string }, string>;
};

export type BitcodeXWalletMsgSetTheme = {
  target: "bitcodex_attached";
  msg_type: "set_theme";
  payload: {
    theme: "light" | "dark";
  };
};

export type BitcodeXWalletMsg =
  | BitcodeXWalletMsgInit
  | BitcodeXWalletMsgInitAck
  | BitcodeXWalletMsgGetPublicKey
  | BitcodeXWalletMsgGetPublicKeyAck
  | BitcodeXWalletMsgGetPublicKeyEd25519
  | BitcodeXWalletMsgMfa
  | BitcodeXWalletMsgMfaAck
  | BitcodeXWalletMsgWalletLogin
  | BitcodeXWalletMsgWalletLoginAck
  | BitcodeXWalletMsgGetAccessToken
  | BitcodeXWalletMsgGetAccessTokenAck
  | BitcodeXWalletMsgGetAppConfig
  | BitcodeXWalletMsgGetAppConfigAck
  | BitcodeXWalletMsgGetPublicKeyEd25519Ack
  | BitcodeXWalletMsgSetOAuthNonce
  | BitcodeXWalletMsgSetOAuthNonceAck
  | BitcodeXWalletMsgSetCodeVerifier
  | BitcodeXWalletMsgSetCodeVerifierAck
  | BitcodeXWalletMsgOAuthSignInUpdate
  | BitcodeXWalletMsgOAuthSignInUpdateAck
  | BitcodeXWalletMsgOAuthInfoPass
  | BitcodeXWalletMsgOAuthInfoPassAck
  | BitcodeXWalletMsgSignOut
  | BitcodeXWalletMsgSignOutAck
  | BitcodeXWalletMsgOpenModal
  | BitcodeXWalletMsgOpenModalAck
  | BitcodeXWalletMsgHideModal
  | BitcodeXWalletMsgHideModalAck
  | BitcodeXWalletMsgGetEmail
  | BitcodeXWalletMsgGetEmailAck
  | BitcodeXWalletMsgGetName
  | BitcodeXWalletMsgGetNameAck
  | BitcodeXWalletMsgGetWalletInfo
  | BitcodeXWalletMsgGetWalletInfoAck
  | BitcodeXWalletMsgGetAuthType
  | BitcodeXWalletMsgGetAuthTypeAck
  | BitcodeXWalletMsgGetCosmosChainInfo
  | BitcodeXWalletMsgGetCosmosChainInfoAck
  | BitcodeXWalletMsgGetEthChainInfo
  | BitcodeXWalletMsgGetEthChainInfoAck
  | BitcodeXWalletMsgImportPrivateKey
  | BitcodeXWalletMsgImportPrivateKeyAck
  | BitcodeXWalletMsgGenerateOAuthUrl
  | BitcodeXWalletMsgGenerateOAuthUrlAck
  | BitcodeXWalletMsgSetTheme
  | {
      target: "bitcodex_sdk";
      msg_type: "unknown_msg_type";
      payload: string | null;
    };
