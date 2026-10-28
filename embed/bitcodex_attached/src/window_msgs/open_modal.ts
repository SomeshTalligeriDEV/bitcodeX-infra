import type { BitcodeXWalletMsgOpenModal } from "@bitcodex/bitcodex-sdk-core";

import type { MsgEventContext } from "./types";
import { useMemoryState } from "@bitcodex-attached/store/memory";

export async function handleOpenModal(
  ctx: MsgEventContext,
  msg: BitcodeXWalletMsgOpenModal,
) {
  const { port } = ctx;

  useMemoryState.getState().clearError();
  useMemoryState.getState().openModal({ port, msg });
}
