import type {
  BitcodeXWalletInterface,
  BitcodeXWalletMsgOpenModal,
  MakeBittensorSigData,
  MakeBittensorSigResult,
} from "@bitcodex/bitcodex-sdk-core";
import { v4 as uuidv4 } from "uuid";

/** polkadot.js extensions reject with this message when the user cancels. */
export const USER_CANCELLED = "Cancelled";

/**
 * Open the iframe's bittensor/make_signature modal and wait for the user's decision.
 * The iframe decodes, checks and signs; this side never sees key material.
 */
export async function requestSignature(
  bitcodexWallet: BitcodeXWalletInterface,
  data: MakeBittensorSigData,
): Promise<MakeBittensorSigResult> {
  const msg: BitcodeXWalletMsgOpenModal = {
    target: "bitcodex_attached",
    msg_type: "open_modal",
    payload: {
      modal_type: "bittensor/make_signature",
      modal_id: uuidv4(),
      data,
    },
  };

  try {
    const res = await bitcodexWallet.openModal(msg);
    if (!res.success) {
      throw new Error(`open modal failed: ${String(res.err)}`);
    }
    const ack = res.data;
    if (ack.modal_type !== "bittensor/make_signature") {
      throw new Error("Invalid modal type response");
    }
    switch (ack.type) {
      case "approve": {
        if (ack.data.chain_type !== "bittensor") {
          throw new Error("Invalid chain type sig response");
        }
        return ack.data.sig_result;
      }
      case "reject": {
        throw new Error(USER_CANCELLED);
      }
      case "error": {
        throw new Error(`signing failed: ${ack.error.type}`);
      }
      default: {
        throw new Error("unreachable response type");
      }
    }
  } finally {
    bitcodexWallet.closeModal();
  }
}
