import type { BitcodeXCosmosWalletInterface } from "@bitcodex/bitcodex-sdk-cosmos";
import type { BitcodeXEthWalletInterface } from "@bitcodex/bitcodex-sdk-eth";
import type { BitcodeXSvmWalletInterface } from "@bitcodex/bitcodex-sdk-svm";
import { PublicKey } from "@solana/web3.js";

export async function refreshSvmEd25519Key(
  svmWallet: BitcodeXSvmWalletInterface,
): Promise<boolean> {
  try {
    const ed25519Key = await svmWallet.bitcodexWallet.getPublicKeyEd25519();
    if (!ed25519Key) {
      return false;
    }

    const publicKeyBytes = Buffer.from(ed25519Key, "hex");
    const newPublicKey = new PublicKey(publicKeyBytes);

    svmWallet.state.publicKey = newPublicKey;
    svmWallet.state.publicKeyRaw = ed25519Key;
    svmWallet.publicKey = newPublicKey;
    svmWallet.connected = true;

    return true;
  } catch (e) {
    console.warn("[SVM SDK] Failed to refresh Ed25519 key:", e);
    return false;
  }
}

export function resetSDKStates(
  ethWallet: BitcodeXEthWalletInterface | null,
  cosmosWallet: BitcodeXCosmosWalletInterface | null,
  svmWallet: BitcodeXSvmWalletInterface | null,
) {
  if (ethWallet) {
    ethWallet.state.publicKey = null;
    ethWallet.state.publicKeyRaw = null;
    ethWallet.state.address = null;
  }

  if (cosmosWallet) {
    cosmosWallet.state.publicKey = null;
    cosmosWallet.state.publicKeyRaw = null;
  }

  if (svmWallet) {
    svmWallet.state.publicKey = null;
    svmWallet.state.publicKeyRaw = null;
    svmWallet.publicKey = null;
    svmWallet.connected = false;
  }
}
