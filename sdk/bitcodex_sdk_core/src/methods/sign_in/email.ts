import { v4 as uuidv4 } from "uuid";

import { generateNonce } from "./utils";
import type {
  BitcodeXWalletMsg,
  BitcodeXWalletMsgOAuthSignInUpdate,
  BitcodeXWalletMsgOAuthSignInUpdateAck,
  BitcodeXWalletMsgOpenModal,
  BitcodeXWalletWebInterface,
  OAuthState,
} from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

const TEN_MINS_MS = 10 * 60 * 1000;

export async function handleEmailSignIn(
  bitcodexWallet: BitcodeXWalletWebInterface,
) {
  const signInRes = await tryAuth0EmailSignIn(bitcodexWallet);

  if (!signInRes.payload.success) {
    throw new Error(
      `sign in fail, err: ${signInRes.payload.err?.type ?? "unknown"}`,
    );
  }
}

async function tryAuth0EmailSignIn(
  bitcodexWallet: BitcodeXWalletWebInterface,
): Promise<BitcodeXWalletMsgOAuthSignInUpdate> {
  const modalId = uuidv4();

  const oauthState: OAuthState = {
    apiKey: bitcodexWallet.apiKey,
    targetOrigin: window.location.origin,
    provider: "auth0",
    modalId,
  };
  const oauthStateString = JSON.stringify(oauthState);

  console.debug("[bitcodex] oauthStateString: %s", oauthStateString);

  const nonce = generateNonce();

  const modalMsg: BitcodeXWalletMsgOpenModal = {
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "open_modal",
    payload: {
      modal_type: "auth/email_login",
      modal_id: modalId,
      data: {
        email_hint: null,
        oauth: {
          nonce,
          state: oauthStateString,
        },
      },
    },
  };

  const oauthSignInUpdateWaiter = waitForOAuthSignInUpdate(bitcodexWallet);

  const result = await bitcodexWallet.openModal(modalMsg);
  if (!result.success) {
    oauthSignInUpdateWaiter.cancel();
    throw new Error(`email sign in open modal failed, err: ${result.err.type}`);
  }

  // User closed the email login modal or an error occurred before approval.
  if (
    result.data.modal_type === "auth/email_login" &&
    result.data.type !== "approve"
  ) {
    oauthSignInUpdateWaiter.cancel();
    const reason =
      result.data.type === "error" ? result.data.error.type : result.data.type;
    throw new Error(`email sign in open modal rejected, reason: ${reason}`);
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
          console.log("[bitcodex] oauth_sign_in_update recv, %o", data);

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
        reject(new Error("Timeout: no response within 10 minutes"));
        bitcodexWallet.closeModal();
      }, TEN_MINS_MS);

      cleanup = () => {
        console.log("[bitcodex] clean up oauth sign in listener");
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
