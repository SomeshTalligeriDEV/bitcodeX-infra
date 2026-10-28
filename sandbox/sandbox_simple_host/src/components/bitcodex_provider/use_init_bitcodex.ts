import { useEffect } from "react";

import { useSDKState } from "@/state/sdk";
import { useUserInfoState } from "@/state/user_info";

function setupCosmosListener() {
  const bitcodexCosmos = useSDKState.getState().bitcodex_cosmos;
  const setUserInfo = useUserInfoState.getState().setUserInfo;

  if (bitcodexCosmos) {
    bitcodexCosmos.on({
      type: "accountsChanged",
      handler: ({ email, publicKey }) => {
        setUserInfo({
          email: email || null,
          publicKey: publicKey ? Buffer.from(publicKey).toString("hex") : null,
        });
      },
    });
  }
}

export function useInitBitcodeX() {
  const initBitcodeXCosmos = useSDKState((state) => state.initBitcodeXCosmos);
  const initBitcodeXEth = useSDKState((state) => state.initBitcodeXEth);

  const isInitialized = useSDKState(
    (state) => state.bitcodex_cosmos !== null && state.bitcodex_eth !== null,
  );

  useEffect(() => {
    initBitcodeXCosmos();
    initBitcodeXEth();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setupCosmosListener();
    }
  }, [isInitialized]);

  return { isInitialized };
}
