import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";

export function closeModal(this: BitcodeXWalletWebInterface) {
  this.iframe.style.display = "none";

  if (this.activePopupWindow) {
    try {
      if (!this.activePopupWindow.closed) {
        this.activePopupWindow.close();
      }
    } catch (error) {
      console.error("[bitcodex] failed to close popup", error);
    }
  }

  this.activePopupWindow = null;
  this.activePopupId = null;
}
