import { v4 as uuidv4 } from "uuid";

import type {
  BitcodeXWalletMsg,
  BitcodeXWalletMsgOAuthSignInUpdate,
  BitcodeXWalletMsgOAuthSignInUpdateAck,
  BitcodeXWalletMsgOpenModal,
  BitcodeXWalletWebInterface,
  OAuthState,
} from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

const FIVE_MINS_MS = 5 * 60 * 1000;

export async function handleTelegramSignIn(
  bitcodexWallet: BitcodeXWalletWebInterface,
) {
  const signInRes = await tryTelegramSignIn(bitcodexWallet);

  if (!signInRes.payload.success) {
    throw new Error(
      `sign in fail, err: ${signInRes.payload.err?.type ?? "unknown"}`,
    );
  }
}

async function tryTelegramSignIn(
  bitcodexWallet: BitcodeXWalletWebInterface,
): Promise<BitcodeXWalletMsgOAuthSignInUpdate> {
  const modalId = uuidv4();

  const oauthState: OAuthState = {
    apiKey: bitcodexWallet.apiKey,
    targetOrigin: window.location.origin,
    provider: "telegram",
    modalId,
  };
  const oauthStateString = JSON.stringify(oauthState);

  console.debug(
    "[bitcodex] Telegram login - oauthStateString: %s",
    oauthStateString,
  );

  const modalMsg: BitcodeXWalletMsgOpenModal = {
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "open_modal",
    payload: {
      modal_type: "auth/telegram_login",
      modal_id: modalId,
      data: {
        state: oauthStateString,
      },
    },
  };

  const oauthSignInUpdateWaiter = waitForOAuthSignInUpdate(bitcodexWallet);

  const result = await bitcodexWallet.openModal(modalMsg);
  console.log("[bitcodex] Telegram login open modal result: %o", result);
  if (!result.success) {
    oauthSignInUpdateWaiter.cancel();
    throw new Error(
      `Telegram login open modal failed, err: ${result.err.type}`,
    );
  }

  return await oauthSignInUpdateWaiter.promise;
}

function waitForOAuthSignInUpdate(bitcodexWallet: BitcodeXWalletWebInterface) {
  let cleanup: (() => void) | null = null;

  const promise = new Promise<BitcodeXWalletMsgOAuthSignInUpdate>(
    (resolve, reject) => {
      function onMessage(event: MessageEvent) {
        if (event.ports.length < 1) {
          return;
        }

        const port = event.ports[0];
        const data = event.data as BitcodeXWalletMsg;

        if (data.msg_type === "oauth_sign_in_update") {
          console.log(
            "[bitcodex] Telegram login - oauth_sign_in_update recv, %o",
            data,
          );

          const msg: BitcodeXWalletMsgOAuthSignInUpdateAck = {
            target: "bitcodex_attached",
            msg_type: "oauth_sign_in_update_ack",
            payload: null,
          };

          port.postMessage(msg);

          if (data.payload.success) {
            resolve(data);
          } else {
            reject(new Error(data.payload.err.type));
          }

          cleanup?.();
          cleanup = null;
        }
      }

      window.addEventListener("message", onMessage);

      const timeout = window.setTimeout(() => {
        cleanup?.();
        cleanup = null;
        reject(new Error("Timeout: no response within 5 minutes"));
        bitcodexWallet.closeModal();
      }, FIVE_MINS_MS);

      cleanup = () => {
        console.log(
          "[bitcodex] Telegram login - clean up oauth sign in listener",
        );
        window.clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
      };
    },
  );

  return {
    promise,
    cancel: () => {
      cleanup?.();
      cleanup = null;
    },
  };
}
