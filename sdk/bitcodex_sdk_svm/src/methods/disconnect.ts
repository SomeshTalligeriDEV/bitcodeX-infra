import type {
  BitcodeXSvmWalletInterface,
  BitcodeXSvmWalletInternal,
} from "@bitcodex-sdk-svm/types";

export async function disconnect(
  this: BitcodeXSvmWalletInterface,
): Promise<void> {
  const internal = this as BitcodeXSvmWalletInternal;

  // Remove event listener from core wallet
  this.bitcodexWallet.off({
    type: "CORE__accountsChanged",
    handler: internal._accountsChangedHandler,
  });

  // Clear session in iframe (clears stored auth token and public key)
  await this.bitcodexWallet.signOut();

  // Clear local state
  this.state.publicKey = null;
  this.state.publicKeyRaw = null;
  this.publicKey = null;
  this.connected = false;

  // Emit disconnect event
  internal._emitter.emit("disconnect");
}
