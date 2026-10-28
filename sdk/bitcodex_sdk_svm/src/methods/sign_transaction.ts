import type { Transaction, VersionedTransaction } from "@solana/web3.js";

import {
  makeSignature,
  SolanaRpcError,
  SolanaRpcErrorCode,
} from "./make_signature";
import type { BitcodeXSvmWalletInterface } from "@bitcodex-sdk-svm/types";

export async function signTransaction<
  T extends Transaction | VersionedTransaction,
>(this: BitcodeXSvmWalletInterface, transaction: T): Promise<T> {
  if (!this.connected || !this.publicKey) {
    throw new SolanaRpcError(
      SolanaRpcErrorCode.Internal,
      "Wallet not connected",
    );
  }

  const result = await makeSignature.call(this, {
    type: "sign_transaction",
    transaction,
  });

  if (result.type !== "sign_transaction") {
    throw new SolanaRpcError(
      SolanaRpcErrorCode.Internal,
      "Unexpected result type",
    );
  }

  return result.signedTransaction as T;
}
