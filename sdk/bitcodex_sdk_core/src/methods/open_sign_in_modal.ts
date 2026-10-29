import type {
  BitcodeXAppConfig,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";
import { renderSignInModal } from "@bitcodex-sdk-core/ui/signin_modal";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

/** This app's dashboard settings via the iframe; null if unavailable within 3 s. */
async function fetchAppConfig(
  wallet: BitcodeXWalletWebInterface,
): Promise<BitcodeXAppConfig | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 3000),
  );
  const request = wallet
    .sendMsgToIframe({
      target: BITCODEX_ATTACHED_TARGET,
      msg_type: "get_app_config",
      payload: null,
    })
    .then((res) =>
      res.msg_type === "get_app_config_ack" && res.payload.success
        ? res.payload.data
        : null,
    )
    .catch(() => null);
  return Promise.race([request, timeout]);
}

const state = { isModalOpen: false };

export async function openSignInModal(
  this: BitcodeXWalletWebInterface,
): Promise<void> {
  await this.waitUntilInitialized;

  if (state.isModalOpen) {
    return;
  }
  const app = await fetchAppConfig(this);
  if (app && !app.origin_allowed) {
    throw new Error(
      `This site (${window.location.origin}) is not an allowed origin of app "${app.label}". Add it in the BitcodeX developer dashboard.`,
    );
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
      // The integrating app's explicit theme wins; else the dashboard setting.
      theme: this._theme ?? app?.theme_mode ?? "system",
      branding: app
        ? {
            loginMethods: app.login_methods,
            accentColor: app.accent_color,
            logoUrl: app.logo_url,
          }
        : undefined,
    });
  });
}
