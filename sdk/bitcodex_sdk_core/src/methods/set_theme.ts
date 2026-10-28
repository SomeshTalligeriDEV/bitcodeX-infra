import type {
  BitcodeXWalletMsgSetTheme,
  BitcodeXWalletTheme,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";

export async function setTheme(
  this: BitcodeXWalletWebInterface,
  theme: BitcodeXWalletTheme,
) {
  this._theme = theme;

  await this.waitUntilInitialized;

  const contentWindow = this.iframe.contentWindow;
  if (contentWindow === null) {
    console.warn("[bitcodex] setTheme: iframe contentWindow is null");
    return;
  }

  const msg: BitcodeXWalletMsgSetTheme = {
    target: "bitcodex_attached",
    msg_type: "set_theme",
    payload: { theme },
  };

  contentWindow.postMessage(msg, this.sdkEndpoint);

  if (this.activePopupWindow && !this.activePopupWindow.closed) {
    this.activePopupWindow.postMessage(msg, this.sdkEndpoint);
  }
}
