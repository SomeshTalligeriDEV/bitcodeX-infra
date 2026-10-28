import {
  BitcodeXWallet,
  type BitcodeXWalletInitArgs,
} from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";

import { BitcodeXCosmosWallet } from "@bitcodex-sdk-cosmos/constructor";
import type { BitcodeXCosmosWalletInitError } from "@bitcodex-sdk-cosmos/errors";
import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export function init(
  args: BitcodeXWalletInitArgs,
): Result<BitcodeXCosmosWalletInterface, BitcodeXCosmosWalletInitError> {
  const walletRes = BitcodeXWallet.init(args);
  if (!walletRes.success) {
    console.error(
      "[bitcodex-cosmos] cosmos wallet core init fail, err: %s",
      walletRes.err,
    );

    return {
      success: false,
      err: {
        type: "bitcodex_cosmos_wallet_init_fail",
        msg: walletRes.err.toString(),
      },
    };
  }

  const instance = new BitcodeXCosmosWallet(walletRes.data);

  return { success: true, data: instance };
}
