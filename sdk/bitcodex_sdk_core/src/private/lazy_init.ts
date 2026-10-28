import type { Result } from "@bitcodex/stdlib-js";

import { BITCODEX_IFRAME_ID } from "@bitcodex-sdk-core/iframe";
import type {
  BitcodeXWalletState,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";
import { registerMsgListener } from "@bitcodex-sdk-core/window_msg/listener";

export async function lazyInit(
  bitcodexWallet: BitcodeXWalletWebInterface,
): Promise<Result<BitcodeXWalletState, string>> {
  await waitUntilDocumentLoad();

  const el = document.getElementById(BITCODEX_IFRAME_ID);
  if (el === null) {
    return {
      success: false,
      err: "iframe not exists even after bitcodex wallet initialization",
    };
  }

  const checkURLRes = await checkURL(bitcodexWallet.sdkEndpoint);
  if (!checkURLRes.success) {
    return checkURLRes;
  }

  const registerRes = await registerMsgListener(bitcodexWallet);
  if (registerRes.success) {
    const initResult = registerRes.data;
    const { email, public_key, name, auth_type } = initResult;

    bitcodexWallet.state = {
      email,
      publicKey: public_key,
      name,
      authType: auth_type,
    };

    if (email && public_key) {
      bitcodexWallet.eventEmitter.emit({
        type: "CORE__accountsChanged",
        email: email,
        publicKey: public_key,
        name,
        authType: auth_type,
      });
    }

    return { success: true, data: bitcodexWallet.state };
  } else {
    return {
      success: false,
      err: "msg listener register fail",
    };
  }
}

async function checkURL(url: string): Promise<Result<string, string>> {
  try {
    const response = await fetch(url, { mode: "no-cors" });
    if (!response.ok) {
      return { success: true, data: url };
    } else {
      return {
        success: false,
        err: `SDK endpoint, resp contains err, url: ${url}`,
      };
    }
  } catch (err: any) {
    console.error("[bitcodex] check url fail, url: %s", url);

    return { success: false, err: `check url fail, ${err.toString()}` };
  }
}

// Wait for the document to load then give the processor one-tick to load
// iframe
async function waitUntilDocumentLoad() {
  return new Promise((resolve) => {
    if (document.readyState === "complete") {
      Promise.resolve().then(() => {
        resolve(0);
      });
    } else {
      window.addEventListener("load", () => {
        Promise.resolve().then(() => {
          resolve(0);
        });
      });
    }
  });
}
