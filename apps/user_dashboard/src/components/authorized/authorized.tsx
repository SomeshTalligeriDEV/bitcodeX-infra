"use client";

import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useBitcodeXEth } from "@bitcodex/bitcodex-sdk-react/eth";
import { useRouter } from "next/navigation";
import { type FC, type PropsWithChildren, useEffect } from "react";

import { WholePageLoading } from "@bitcodex-user-dashboard/components/whole_page_loading/whole_page_loading";
import { paths } from "@bitcodex-user-dashboard/paths";

export const Authorized: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { isReady: isCosmosInitialized } = useBitcodeXCosmos();
  const { isReady: isEthInitialized } = useBitcodeXEth();
  const { isSignedIn } = useBitcodeX();

  const { isReady: isBittensorReady } = useBitcodeXBittensor();

  const isSDKReady =
    isCosmosInitialized && isEthInitialized && isBittensorReady;

  useEffect(() => {
    if (isSDKReady && !isSignedIn) {
      router.push(paths.sign_in);
    }
  }, [router, isSignedIn, isSDKReady]);

  if (!isSDKReady || !isSignedIn) {
    return <WholePageLoading />;
  }

  return <>{children}</>;
};
