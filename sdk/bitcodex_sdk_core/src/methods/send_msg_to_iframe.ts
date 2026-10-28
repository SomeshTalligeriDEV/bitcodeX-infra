import type {
  BitcodeXWalletMsg,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";

const TIMEOUT_MS = 30_000;

export async function sendMsgToIframe(
  this: BitcodeXWalletWebInterface,
  msg: BitcodeXWalletMsg,
): Promise<BitcodeXWalletMsg> {
  await this.waitUntilInitialized;

  const contentWindow = this.iframe.contentWindow;
  if (contentWindow === null) {
    throw new Error("iframe contentWindow is null");
  }

  return new Promise<BitcodeXWalletMsg>((resolve, reject) => {
    const channel = new MessageChannel();

    const timer = setTimeout(() => {
      channel.port1.onmessage = null;
      reject(
        new Error(
          `[bitcodex] iframe response timeout (${TIMEOUT_MS}ms), msg_type: ${msg.msg_type}`,
        ),
      );
    }, TIMEOUT_MS);

    channel.port1.onmessage = (event: MessageEvent) => {
      clearTimeout(timer);

      const data = event.data as BitcodeXWalletMsg;

      console.debug("[bitcodex] reply recv", data);

      if (data.hasOwnProperty("payload")) {
        resolve(data);
      } else {
        console.error("[bitcodex] unknown msg type");
        resolve({
          target: "bitcodex_sdk",
          msg_type: "unknown_msg_type",
          payload: JSON.stringify(data),
        });
      }
    };

    contentWindow.postMessage(msg, this.sdkEndpoint, [channel.port2]);
  });
}
