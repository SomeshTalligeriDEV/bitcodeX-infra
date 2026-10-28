import type { AuthType } from "@bitcodex/bitcodex-types/auth";

export type BitcodeXWalletMsgExportPrivateKey = {
  target: "bitcodex_attached";
  msg_type: "__export_private_key__";
  payload: { auth_type: AuthType };
};

export type ExportPrivateKeyError =
  | { type: "UNAUTHORIZED_ORIGIN" }
  | { type: "NOT_AUTHENTICATED" }
  | { type: "MISSING_KEY_SHARES" }
  | { type: "COMBINE_ERROR"; error: string }
  | { type: "API_ERROR"; error: string }
  | { type: "REAUTH_TIMEOUT" }
  | { type: "REAUTH_ERROR"; error: string };

export type ExportPrivateKeyAckPayload =
  | { success: true }
  | { success: false; error: ExportPrivateKeyError };

export interface BitcodeXWalletMsgExportPrivateKeyAck {
  target: "bitcodex_sdk";
  msg_type: "__export_private_key_ack__";
  payload: ExportPrivateKeyAckPayload;
}
