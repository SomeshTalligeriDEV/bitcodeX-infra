"use client";

import {
  BitcodeXProvider as BitcodeXSDKProvider,
  useBitcodeX,
} from "@bitcodex/bitcodex-sdk-react";
import { type FC, type PropsWithChildren, useEffect } from "react";

import {
  BITCODEX_SDK_API_KEY,
  BITCODEX_SDK_ENDPOINT,
} from "@bitcodex-user-dashboard/fetch";
import { useChains } from "@bitcodex-user-dashboard/hooks/queries";
import { useChainStore } from "@bitcodex-user-dashboard/state/chains";
import { SOLANA_MAINNET_CHAIN_ID } from "@bitcodex-user-dashboard/utils/chain";

if (!BITCODEX_SDK_API_KEY) {
  throw new Error("BITCODEX_SDK_API_KEY is not set");
}

const bitcodexConfig = {
  apiKey: BITCODEX_SDK_API_KEY,
  sdkEndpoint: BITCODEX_SDK_ENDPOINT,
  eth: true as const,
  cosmos: true as const,
  svm: { chainId: SOLANA_MAINNET_CHAIN_ID },
  // Bittensor is the only chain shown; the others stay initialised (login and
  // connected-apps code depends on them) but have no UI.
  bittensor: { chainId: "bittensor:localnet" as const },
};

const InnerProvider: FC<PropsWithChildren> = ({ children }) => {
  useChains();

  const setActiveUser = useChainStore((state) => state.setActiveUser);
  const clearActiveUser = useChainStore((state) => state.clearActiveUser);
  const { authType, publicKey } = useBitcodeX();

  useEffect(() => {
    if (publicKey && authType) {
      setActiveUser(authType, publicKey);
      return;
    }

    clearActiveUser();
  }, [publicKey, authType, setActiveUser, clearActiveUser]);

  return <>{children}</>;
};

export const BitcodeXProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <BitcodeXSDKProvider config={bitcodexConfig}>
      <InnerProvider>{children}</InnerProvider>
    </BitcodeXSDKProvider>
  );
};
