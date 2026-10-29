import type { CurveType } from "@bitcodex/bitcodex-types/crypto";

/** Exportable key formats: the two curves, plus the Bittensor coldkey seed (ed25519). */
export type ExportKeyType = CurveType | "bittensor";

export type BitcodeXWalletMsgExportDisplayResize = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_resize__";
  payload: { height: number; key_type: ExportKeyType | null };
};

export type BitcodeXWalletMsgExportDisplayError = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_error__";
  payload: { key_type: ExportKeyType | null };
};

export type BitcodeXWalletMsgExportDisplayCopy = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_copy__";
  payload: { key_type: ExportKeyType | null };
};

export type BitcodeXWalletMsgExportDisplayCopyError = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_copy_error__";
  payload: { key_type: ExportKeyType | null };
};
