import type { Result } from "@bitcodex/stdlib-js";
import { PublicKey } from "@solana/web3.js";

import type { LazyInitError } from "@bitcodex-sdk-svm/errors";
import type {
  BitcodeXSvmWalletInternal,
  BitcodeXSvmWalletState,
} from "@bitcodex-sdk-svm/types";

export async function lazyInit(
  wallet: BitcodeXSvmWalletInternal,
): Promise<Result<BitcodeXSvmWalletState, LazyInitError>> {
  const coreStateRes = await wallet.bitcodexWallet.waitUntilInitialized;

  if (!coreStateRes.success) {
    return {
      success: false,
      err: {
        type: "lazy_init_error",
        msg: "Core wallet initialization failed",
      },
    };
  }

  // Set initial state from core wallet if user is already logged in
  // Use Ed25519 key for SVM chains (not secp256k1)
  try {
    const ed25519Key = await wallet.bitcodexWallet.getPublicKeyEd25519();
    if (ed25519Key) {
      const publicKeyBytes = Buffer.from(ed25519Key, "hex");
      const newPublicKey = new PublicKey(publicKeyBytes);

      wallet.state.publicKey = newPublicKey;
      wallet.state.publicKeyRaw = ed25519Key;
      wallet.publicKey = newPublicKey;
      wallet.connected = true;
    }
  } catch (e) {
    console.warn("[SVM SDK] Failed to get Ed25519 key during init:", e);
  }

  return {
    success: true,
    data: wallet.state,
  };
}
