import type { BitcodeXWalletInterface } from "@bitcodex/bitcodex-sdk-core";
import type { BitcodeXSvmWalletInterface } from "@bitcodex/bitcodex-sdk-svm";
import { create } from "zustand";

interface SdkState {
  bitcodexWallet: BitcodeXWalletInterface | null;
  bitcodexSvmWallet: BitcodeXSvmWalletInterface | null;
  isInitialized: boolean;
  isConnected: boolean;
  publicKey: string | null;
  setBitcodeXWallet: (wallet: BitcodeXWalletInterface) => void;
  setBitcodeXSvmWallet: (wallet: BitcodeXSvmWalletInterface) => void;
  setInitialized: (initialized: boolean) => void;
  setConnected: (connected: boolean, publicKey: string | null) => void;
}

export const useSdkStore = create<SdkState>((set) => ({
  bitcodexWallet: null,
  bitcodexSvmWallet: null,
  isInitialized: false,
  isConnected: false,
  publicKey: null,
  setBitcodeXWallet: (wallet) => set({ bitcodexWallet: wallet }),
  setBitcodeXSvmWallet: (wallet) => set({ bitcodexSvmWallet: wallet }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setConnected: (connected, publicKey) =>
    set({ isConnected: connected, publicKey }),
}));
