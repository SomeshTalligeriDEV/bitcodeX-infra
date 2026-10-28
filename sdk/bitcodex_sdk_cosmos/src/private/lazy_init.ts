import type { Result } from "@bitcodex/stdlib-js";

import type { LazyInitError } from "@bitcodex-sdk-cosmos/errors";
import type {
  BitcodeXCosmosWalletInterface,
  BitcodeXCosmosWalletState,
} from "@bitcodex-sdk-cosmos/types";

export async function lazyInit(
  bitcodexCosmosWallet: BitcodeXCosmosWalletInterface,
): Promise<Result<BitcodeXCosmosWalletState, LazyInitError>> {
  const walletStateRes =
    await bitcodexCosmosWallet.bitcodexWallet.waitUntilInitialized;

  if (!walletStateRes.success) {
    return {
      success: false,
      err: { type: "bitcodex_cosmos_wallet_lazy_init_fail" },
    };
  }

  setUpEventHandlers.call(bitcodexCosmosWallet);

  const walletState = walletStateRes.data;
  if (walletState.publicKey) {
    const pk = Buffer.from(walletState.publicKey, "hex");

    bitcodexCosmosWallet.state = {
      publicKey: pk,
      publicKeyRaw: walletState.publicKey,
    };

    bitcodexCosmosWallet.eventEmitter.emit({
      type: "accountsChanged",
      authType: walletState.authType,
      email: walletState.email,
      publicKey: pk,
      name: walletState.name,
    });
  } else {
    bitcodexCosmosWallet.state = {
      publicKey: null,
      publicKeyRaw: null,
    };

    bitcodexCosmosWallet.eventEmitter.emit({
      type: "accountsChanged",
      authType: walletState.authType,
      email: walletState.email,
      publicKey: null,
      name: walletState.name,
    });
  }

  return { success: true, data: bitcodexCosmosWallet.state };
}

export function setUpEventHandlers(this: BitcodeXCosmosWalletInterface): void {
  console.log("[bitcodex-cosmos] set up event handlers");

  this.bitcodexWallet.on({
    type: "CORE__accountsChanged",
    handler: (payload) => {
      console.log(
        "[bitcodex-cosmos] CORE__accountsChanged callback, payload: %s",
        JSON.stringify(payload),
      );

      const { publicKey, email, name, authType } = payload;

      if (this.state.publicKeyRaw !== publicKey) {
        if (publicKey !== null) {
          const pk = Buffer.from(publicKey, "hex");

          this.state = {
            publicKey: pk,
            publicKeyRaw: publicKey,
          };
        } else {
          this.state = {
            publicKey: null,
            publicKeyRaw: null,
          };
        }

        this.eventEmitter.emit({
          type: "accountsChanged",
          email: email,
          publicKey: this.state.publicKey,
          name,
          authType,
        });
      }
    },
  });

  this.bitcodexWallet.on({
    type: "CORE__chainChanged",
    handler: (_payload) => {
      this.eventEmitter.emit({ type: "chainChanged" });
    },
  });
}
