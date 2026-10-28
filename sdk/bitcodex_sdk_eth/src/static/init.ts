import { BitcodeXWallet } from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";

import { BitcodeXEthWallet } from "@bitcodex-sdk-eth/constructor";
import type { BitcodeXEthWalletInitError } from "@bitcodex-sdk-eth/errors";
import type {
  BitcodeXEthWalletInitArgs,
  BitcodeXEthWalletInterface,
} from "@bitcodex-sdk-eth/types";

export function init(
  args: BitcodeXEthWalletInitArgs,
): Result<BitcodeXEthWalletInterface, BitcodeXEthWalletInitError> {
  const bitcodexEthWalletRes = BitcodeXWallet.init(args);

  if (!bitcodexEthWalletRes.success) {
    console.error(
      "[bitcodex-eth] bitcodex-eth wallet core init fail, err: %s",
      bitcodexEthWalletRes.err,
    );

    return {
      success: false,
      err: {
        type: "bitcodex_eth_wallet_init_fail",
        msg: bitcodexEthWalletRes.err.toString(),
      },
    };
  }

  const instance = new BitcodeXEthWallet(bitcodexEthWalletRes.data);

  return {
    success: true,
    data: instance,
  };
}
