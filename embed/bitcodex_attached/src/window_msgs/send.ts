import type { BitcodeXWalletMsg } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";

const TIMEOUT_MS = 30_000;

export function sendMsgToWindow(
  window: Window,
  msg: BitcodeXWalletMsg,
  targetOrigin: string,
) {
  return new Promise<BitcodeXWalletMsg>((resolve, reject) => {
    const channel = new MessageChannel();

    const timer = setTimeout(() => {
      channel.port1.onmessage = null;
      reject(
        new Error(
          `[bitcodex] window message timeout (${TIMEOUT_MS}ms), msg_type: ${msg.msg_type}`,
        ),
      );
    }, TIMEOUT_MS);

    channel.port1.onmessage = (obj: any) => {
      clearTimeout(timer);

      const data = obj.data as BitcodeXWalletMsg;

      channel.port1.close();

      if (data.hasOwnProperty("payload")) {
        resolve(data);
      } else {
        resolve({
          target: BITCODEX_SDK_TARGET,
          msg_type: "unknown_msg_type",
          payload: JSON.stringify(data),
        });
      }
    };

    window.postMessage(msg, targetOrigin, [channel.port2]);
  });
}
