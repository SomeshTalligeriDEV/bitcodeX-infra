import {
  BitcodeXCosmosWallet,
  type BitcodeXCosmosWalletInterface,
} from "@bitcodex/bitcodex-sdk-cosmos";
import {
  BitcodeXEthWallet,
  type BitcodeXEthWalletInterface,
} from "@bitcodex/bitcodex-sdk-eth";
import { create } from "zustand";
import { combine } from "zustand/middleware";

interface SDKState {
  bitcodex_eth: BitcodeXEthWalletInterface | null;
  bitcodex_cosmos: BitcodeXCosmosWalletInterface | null;
  isEthInitializing: boolean;
  isCosmosInitializing: boolean;
}

interface SDKActions {
  initBitcodeXEth: () => BitcodeXEthWalletInterface | null;
  initBitcodeXCosmos: () => BitcodeXCosmosWalletInterface | null;
}

export const useSDKState = create(
  combine<SDKState, SDKActions>(
    {
      bitcodex_eth: null,
      bitcodex_cosmos: null,
      isEthInitializing: false,
      isCosmosInitializing: false,
    },
    (set, get) => ({
      initBitcodeXEth: () => {
        const state = get();

        if (state.bitcodex_eth || state.isEthInitializing) {
          console.log(
            "ETH SDK already initialized or initializing, skipping...",
          );
          return state.bitcodex_eth;
        }

        console.log("Initializing ETH SDK...");
        set({ isEthInitializing: true });

        const initRes = BitcodeXEthWallet.init({
          api_key:
            "72bd2afd04374f86d563a40b814b7098e5ad6c7f52d3b8f84ab0c3d05f73ac6c",
          sdk_endpoint: import.meta.env.VITE_BITCODEX_SDK_ENDPOINT,
        });

        if (initRes.success) {
          console.log("Eth sdk initialized");

          set({
            bitcodex_eth: initRes.data,
            isEthInitializing: false,
          });

          return initRes.data;
        } else {
          console.error("sdk init fail, err: %s", initRes.err);
          set({ isEthInitializing: false });

          return null;
        }
      },
      initBitcodeXCosmos: () => {
        const state = get();

        if (state.bitcodex_cosmos || state.isCosmosInitializing) {
          console.log(
            "Cosmos SDK already initialized or initializing, skipping...",
          );
          return state.bitcodex_cosmos;
        }

        console.log("Initializing Cosmos SDK...");
        set({ isCosmosInitializing: true });

        const initRes = BitcodeXCosmosWallet.init({
          api_key:
            "72bd2afd04374f86d563a40b814b7098e5ad6c7f52d3b8f84ab0c3d05f73ac6c",
          sdk_endpoint: import.meta.env.VITE_BITCODEX_SDK_ENDPOINT,
        });

        if (initRes.success) {
          console.log("Cosmos SDK initialized");

          const cosmosSDK = initRes.data;

          set({
            bitcodex_cosmos: cosmosSDK,
            isCosmosInitializing: false,
          });

          cosmosSDK.on({
            type: "accountsChanged",
            handler: (payload) => {
              console.log("ev - accountsChanged", payload);
            },
          });

          return initRes.data;
        } else {
          console.error("Cosmos sdk init fail, err: %s", initRes.err);

          set({ isCosmosInitializing: false });

          return null;
        }
      },
    }),
  ),
);
