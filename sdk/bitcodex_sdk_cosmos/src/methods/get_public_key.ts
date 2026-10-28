import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export async function getPublicKey(
  this: BitcodeXCosmosWalletInterface,
): Promise<Uint8Array | null> {
  console.log("[bitcodex-cosmos] getPublicKey: start");

  try {
    await this.waitUntilInitialized;

    if (this.state === null) {
      throw new Error("Cosmos SDK is not properly initialized");
    }

    if (this.state.publicKey) {
      console.log("[bitcodex-cosmos] getPublicKey: cached public key");

      return this.state.publicKey;
    }

    console.log("[bitcodex-cosmos] getPublicKey: getPublicKey from BitcodeX");

    const pk = await this.bitcodexWallet.getPublicKey();

    if (pk === null) {
      this.state.publicKey = null;
      return null;
    } else {
      const publicKey = Buffer.from(pk, "hex");

      this.state.publicKey = publicKey;
      return this.state.publicKey;
    }
  } catch (error: any) {
    console.error("[bitcodex-cosmos] getPublicKey failed with error:", error);

    throw error;
  }
}
