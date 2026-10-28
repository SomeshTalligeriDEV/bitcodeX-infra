import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useBitcodeXEth } from "@bitcodex/bitcodex-sdk-react/eth";
import { useBitcodeXSvm } from "@bitcodex/bitcodex-sdk-react/svm";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { resetSDKStates } from "@bitcodex-user-dashboard/utils/sdk";

export function useSignOut() {
  const { wallet } = useBitcodeX();
  const { ethWallet } = useBitcodeXEth();
  const { cosmosWallet } = useBitcodeXCosmos();
  const { svmWallet } = useBitcodeXSvm();
  const queryClient = useQueryClient();

  const signOut = useCallback(async () => {
    if (!wallet) {
      console.error("bitcodexWallet is not initialized");
      return;
    }

    try {
      await wallet.signOut();
    } finally {
      resetSDKStates(ethWallet, cosmosWallet, svmWallet);
      queryClient.clear();
    }
  }, [wallet, ethWallet, cosmosWallet, svmWallet, queryClient]);

  return signOut;
}
