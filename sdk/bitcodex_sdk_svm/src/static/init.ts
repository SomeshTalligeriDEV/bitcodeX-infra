import { BitcodeXWallet } from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";

import { BitcodeXSvmWallet } from "@bitcodex-sdk-svm/constructor";
import type { BitcodeXSvmWalletInitError } from "@bitcodex-sdk-svm/errors";
import type {
  BitcodeXSvmWalletInitArgs,
  BitcodeXSvmWalletInterface,
} from "@bitcodex-sdk-svm/types";

export function init(
  args: BitcodeXSvmWalletInitArgs,
): Result<BitcodeXSvmWalletInterface, BitcodeXSvmWalletInitError> {
  const bitcodexSvmWalletRes = BitcodeXWallet.init(args);

  if (!bitcodexSvmWalletRes.success) {
    console.error(
      "[bitcodex-svm] bitcodex-svm wallet core init fail, err: %s",
      bitcodexSvmWalletRes.err,
    );

    return {
      success: false,
      err: {
        type: "bitcodex_svm_wallet_init_fail",
        msg: bitcodexSvmWalletRes.err.toString(),
      },
    };
  }

  const chainOptions = {
    chain_id: args.chain_id,
  };

  return {
    success: true,
    data: new BitcodeXSvmWallet(bitcodexSvmWalletRes.data, chainOptions),
  };
}
