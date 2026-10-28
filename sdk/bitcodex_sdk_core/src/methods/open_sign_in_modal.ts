import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import { renderSignInModal } from "@bitcodex-sdk-core/ui/signin_modal";

const state = { isModalOpen: false };

export async function openSignInModal(
  this: BitcodeXWalletWebInterface,
): Promise<void> {
  await this.waitUntilInitialized;

  if (state.isModalOpen) {
    return;
  }
  state.isModalOpen = true;

  return new Promise((resolve, reject) => {
    renderSignInModal({
      onSelect: async (provider) => {
        await this.signIn(provider);
        state.isModalOpen = false;
        resolve();
      },
      onClose: () => {
        state.isModalOpen = false;
        reject(new Error("Sign in cancelled"));
      },
      theme: this._theme ?? "system",
    });
  });
}
