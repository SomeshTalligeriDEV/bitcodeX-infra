import type { CurveType } from "@bitcodex/bitcodex-types/crypto";

export type BitcodeXWalletMsgExportDisplayResize = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_resize__";
  payload: { height: number; key_type: CurveType | null };
};

export type BitcodeXWalletMsgExportDisplayError = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_error__";
  payload: { key_type: CurveType | null };
};

export type BitcodeXWalletMsgExportDisplayCopy = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_copy__";
  payload: { key_type: CurveType | null };
};

export type BitcodeXWalletMsgExportDisplayCopyError = {
  target: "bitcodex_user_dashboard";
  msg_type: "__export_display_copy_error__";
  payload: { key_type: CurveType | null };
};
