import type {
  BitcodeXWalletMsgExportDisplayCopy,
  BitcodeXWalletMsgExportDisplayCopyError,
  BitcodeXWalletMsgExportDisplayError,
  BitcodeXWalletMsgExportDisplayResize,
} from "./export_display";

export * from "./export_display";
export * from "./export_priv_key";

export type BitcodeXWalletProtectedMsgs =
  | BitcodeXWalletMsgExportDisplayResize
  | BitcodeXWalletMsgExportDisplayError
  | BitcodeXWalletMsgExportDisplayCopy
  | BitcodeXWalletMsgExportDisplayCopyError;
