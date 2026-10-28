"use client";

import { useSDKState } from "@/state/sdk";

export const useBitcodeX = () => {
  const bitcodexCosmos = useSDKState((state) => state.bitcodex_cosmos);
  const bitcodexEth = useSDKState((state) => state.bitcodex_eth);

  return {
    bitcodexCosmos,
    bitcodexEth,
  };
};
