import type { Hex } from "viem";

import type { BitcodeXEthWalletInterface } from "@bitcodex-sdk-eth/types";

export async function personalSign(
  this: BitcodeXEthWalletInterface,
  message: string,
): Promise<Hex> {
  const result = await this.makeSignature({
    type: "personal_sign",
    data: {
      address: await this.getAddress(),
      message,
    },
  });

  if (result.type !== "signature") {
    throw new Error("Invalid result type");
  }

  return result.signature;
}
