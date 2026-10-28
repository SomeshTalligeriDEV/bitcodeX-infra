"use client";

import {
  BitcodeXSvmWallet,
  registerWalletStandard,
  type WalletStandardConfig,
} from "@bitcodex/bitcodex-sdk-svm";
import {
  SOLANA_CHAINS,
  SOLANA_DEVNET_CHAIN,
  SOLANA_MAINNET_CHAIN,
  SOLANA_TESTNET_CHAIN,
} from "@solana/wallet-standard-chains";
import {
  SolanaSignAndSendTransaction,
  SolanaSignIn,
  SolanaSignMessage,
  SolanaSignTransaction,
} from "@solana/wallet-standard-features";
import type { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";

import { useSdkStore } from "@/store/sdk";

const SOLANA_CONFIG: WalletStandardConfig = {
  chains: SOLANA_CHAINS,
  features: {
    signIn: SolanaSignIn,
    signMessage: SolanaSignMessage,
    signTransaction: SolanaSignTransaction,
    signAndSendTransaction: SolanaSignAndSendTransaction,
  },
  rpcEndpoints: {
    [SOLANA_MAINNET_CHAIN]: "https://api.mainnet-beta.solana.com",
    [SOLANA_DEVNET_CHAIN]: "https://api.devnet.solana.com",
    [SOLANA_TESTNET_CHAIN]: "https://api.testnet.solana.com",
  },
};

export function useBitcodeXSvm() {
  const {
    bitcodexWallet,
    bitcodexSvmWallet,
    isInitialized,
    isConnected,
    publicKey,
    setBitcodeXWallet,
    setBitcodeXSvmWallet,
    setInitialized,
    setConnected,
  } = useSdkStore();

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    if (isInitialized || isInitializing) {
      return;
    }

    const initSdk = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // chain_id format: "namespace:genesisHash"
        const svmWalletResult = BitcodeXSvmWallet.init({
          api_key: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
          sdk_endpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT,
          chain_id: SOLANA_DEVNET_CHAIN,
        });

        if (!svmWalletResult.success) {
          throw new Error(
            `Failed to init BitcodeXSvmWallet: ${JSON.stringify(svmWalletResult.err)}`,
          );
        }

        const svmWallet = svmWalletResult.data;
        setBitcodeXSvmWallet(svmWallet);

        // Get the internal BitcodeXWallet instance
        const wallet = svmWallet.bitcodexWallet;
        setBitcodeXWallet(wallet);

        // Register wallet-standard
        registerWalletStandard(svmWallet, [SOLANA_CONFIG]);

        await svmWallet.waitUntilInitialized;
        console.log(
          "[sandbox_sol] BitcodeX wallet initialized and registered with wallet-standard",
        );

        setInitialized(true);
        console.log("[sandbox_sol] SDK initialized");

        // Check for existing Ed25519 key (Solana uses Ed25519, not secp256k1)
        const existingEd25519Pubkey =
          await svmWallet.bitcodexWallet.getPublicKeyEd25519();
        if (existingEd25519Pubkey) {
          await svmWallet.connect();
          console.log(
            "[sandbox_sol] Reconnected:",
            svmWallet.publicKey?.toBase58(),
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("[sandbox_sol] Failed to initialize SDK:", message);
      } finally {
        setIsInitializing(false);
      }
    };

    initSdk();
  }, [
    isInitialized,
    isInitializing,
    setBitcodeXWallet,
    setBitcodeXSvmWallet,
    setInitialized,
  ]);

  useEffect(() => {
    if (!bitcodexSvmWallet) {
      return;
    }

    const handleAccountChanged = (pk: PublicKey | null) => {
      const pubkeyStr = pk?.toBase58() ?? null;
      setConnected(!!pk, pubkeyStr);
      console.log("[sandbox_sol] accountChanged event:", pubkeyStr);
    };

    const handleConnect = (pk: PublicKey) => {
      setConnected(true, pk.toBase58());
      console.log("[sandbox_sol] connect event:", pk.toBase58());
    };

    const handleDisconnect = () => {
      setConnected(false, null);
      console.log("[sandbox_sol] disconnect event");
    };

    bitcodexSvmWallet.on("accountChanged", handleAccountChanged);
    bitcodexSvmWallet.on("connect", handleConnect);
    bitcodexSvmWallet.on("disconnect", handleDisconnect);

    return () => {
      bitcodexSvmWallet.off("accountChanged", handleAccountChanged);
      bitcodexSvmWallet.off("connect", handleConnect);
      bitcodexSvmWallet.off("disconnect", handleDisconnect);
    };
  }, [bitcodexSvmWallet, setConnected]);

  const connect = useCallback(async () => {
    if (!bitcodexSvmWallet) {
      setError("SDK not initialized");
      return;
    }

    try {
      setError(null);

      // Check if user is signed in
      const existingPubkey =
        await bitcodexSvmWallet.bitcodexWallet.getPublicKey();
      if (!existingPubkey) {
        // Not signed in - open provider select modal
        await bitcodexSvmWallet.bitcodexWallet.openSignInModal();
      }

      // connect() internally handles Ed25519 key creation if needed
      await bitcodexSvmWallet.connect();
      console.log(
        "[sandbox_sol] Connected:",
        bitcodexSvmWallet.publicKey?.toBase58(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[sandbox_sol] Failed to connect:", message);
    }
  }, [bitcodexSvmWallet]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!bitcodexSvmWallet) {
      return;
    }

    try {
      await bitcodexSvmWallet.disconnect();
      console.log("[sandbox_sol] Disconnected");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[sandbox_sol] Failed to disconnect:", message);
    }
  }, [bitcodexSvmWallet]);

  return {
    bitcodexWallet,
    bitcodexSvmWallet,
    isInitialized,
    isInitializing,
    isConnected,
    publicKey,
    error,
    connect,
    disconnect,
  };
}
