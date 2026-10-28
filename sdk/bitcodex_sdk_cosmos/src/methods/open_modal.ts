import type {
  BitcodeXWalletMsgOpenModal,
  MakeCosmosSigData,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";
import { v4 as uuidv4 } from "uuid";

import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export async function openModal(
  this: BitcodeXCosmosWalletInterface,
  data: MakeCosmosSigData,
): Promise<OpenModalAckPayload> {
  const modal_id = uuidv4();

  const openModalMsg: BitcodeXWalletMsgOpenModal = {
    target: "bitcodex_attached",
    msg_type: "open_modal",
    payload: {
      modal_type: "cosmos/make_signature",
      modal_id,
      data,
    },
  };
  try {
    const modalResult = await this.bitcodexWallet.openModal(openModalMsg);

    if (!modalResult.success) {
      throw new Error("modal result not success");
    }

    this.bitcodexWallet.closeModal();

    return modalResult.data;
  } catch (err: any) {
    throw new Error(`Error getting modal response, err: ${err}`);
  }
}
