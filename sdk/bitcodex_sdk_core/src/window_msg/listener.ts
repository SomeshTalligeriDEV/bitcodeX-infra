import type { Result } from "@bitcodex/stdlib-js";

import type {
  BitcodeXWalletMsg,
  BitcodeXWalletMsgInitAck,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";
import type { InitPayload } from "@bitcodex-sdk-core/types/init";

export function registerMsgListener(
  _bitcodexWallet: BitcodeXWalletWebInterface,
): Promise<Result<InitPayload, string>> {
  if (window.__bitcodex_ev) {
    // TODO: theoretically unreachable but this can happen
    // Later we will report to centralized logging system
    console.error("[bitcodex] isn't it already initialized?");
  }

  return new Promise((resolve) => {
    async function handler(event: MessageEvent) {
      if (event.ports.length < 1) {
        // do nothing

        return;
      }

      const port = event.ports[0];
      const msg = event.data as BitcodeXWalletMsg;

      if (msg.msg_type === "init") {
        const ack: BitcodeXWalletMsgInitAck = {
          target: "bitcodex_attached",
          msg_type: "init_ack",
          payload: { success: true, data: null },
        };

        port.postMessage(ack);

        window.removeEventListener("message", handler);

        resolve(msg.payload);
      } else {
      }
    }

    window.addEventListener("message", handler);
    window.__bitcodex_ev = handler;
    console.log("[bitcodex] msg listener registered");
  });
}
