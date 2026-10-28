import type { Result } from "@bitcodex/stdlib-js";
import type { Hex } from "viem";

import type { LazyInitError } from "@bitcodex-sdk-eth/errors";
import type {
  BitcodeXEthWalletInterface,
  BitcodeXEthWalletState,
} from "@bitcodex-sdk-eth/types";
import { publicKeyToEthereumAddress } from "@bitcodex-sdk-eth/utils";

export async function lazyInit(
  bitcodexEthWallet: BitcodeXEthWalletInterface,
): Promise<Result<BitcodeXEthWalletState, LazyInitError>> {
  console.log("[bitcodex-eth] lazy init for bitcodex-eth wallet");

  const bitcodexEthWalletRes =
    await bitcodexEthWallet.bitcodexWallet.waitUntilInitialized;

  if (!bitcodexEthWalletRes.success) {
    return {
      success: false,
      err: { type: "bitcodex_eth_wallet_lazy_init_fail" },
    };
  }

  const bitcodexEthWalletState = bitcodexEthWalletRes.data;

  // Derive ETH address synchronously so it is available as soon as
  // waitUntilInitialized resolves.  The previous approach (fire-and-forget
  // handleAccountsChanged → getEthereumProvider().then()) left a window
  // where state.address was still null.
  if (bitcodexEthWalletState.publicKey) {
    const publicKeyNormalized = normalizeKey(bitcodexEthWalletState.publicKey);
    if (publicKeyNormalized !== null) {
      const publicKeyHex: Hex = `0x${publicKeyNormalized}`;
      bitcodexEthWallet.state = {
        publicKeyRaw: bitcodexEthWalletState.publicKey,
        publicKey: publicKeyHex,
        address: publicKeyToEthereumAddress(publicKeyHex),
      };
    }
  }

  setUpEventHandlers.call(bitcodexEthWallet);

  console.log(
    "[bitcodex-eth] lazy init for bitcodex-eth wallet complete, \
    publicKeyRaw: %s, publicKey: %s, address: %s",
    bitcodexEthWallet.state.publicKeyRaw,
    bitcodexEthWallet.state.publicKey,
    bitcodexEthWallet.state.address,
  );

  return {
    success: true,
    data: bitcodexEthWallet.state,
  };
}

function setUpEventHandlers(this: BitcodeXEthWalletInterface) {
  this.bitcodexWallet.on({
    type: "CORE__accountsChanged",
    handler: (payload) => handleAccountsChanged.call(this, payload.publicKey),
  });
}

function handleAccountsChanged(
  this: BitcodeXEthWalletInterface,
  publicKey: string | null,
) {
  console.log("[bitcodex-eth] detect account change", publicKey);

  const currentPublicKeyRaw = normalizeKey(this.state.publicKeyRaw);
  const publicKeyNormalized = normalizeKey(publicKey);

  const changed = currentPublicKeyRaw !== publicKeyNormalized;

  // only emit `accountsChanged` event if public key changed
  if (changed) {
    console.log(
      "[bitcodex-eth] account change detected, from: %s to: %s",
      currentPublicKeyRaw,
      publicKeyNormalized,
    );

    this.getEthereumProvider().then((provider) => {
      if (publicKeyNormalized === null) {
        this.state = {
          publicKey: null,
          publicKeyRaw: null,
          address: null,
        };

        provider.emit("accountsChanged", []);
        return;
      } else {
        const publicKeyHex: Hex = `0x${publicKeyNormalized}`;
        const nextAddress = publicKeyToEthereumAddress(publicKeyHex);

        this.state = {
          publicKeyRaw: publicKey,
          publicKey: publicKeyHex,
          address: nextAddress,
        };

        provider.emit("accountsChanged", [nextAddress]);
      }
    });
  }
}

function normalizeKey(key: string | null): string | null {
  if (key === null || key === "") {
    return null;
  }

  if (key.toLowerCase().startsWith("0x")) {
    return key.slice(2).toLowerCase();
  } else {
    return key.toLowerCase();
  }
}
