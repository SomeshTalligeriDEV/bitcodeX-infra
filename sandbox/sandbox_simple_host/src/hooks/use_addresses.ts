import { useEffect, useState } from "react";

import { useSDKState } from "@/state/sdk";
import { useUserInfoState } from "@/state/user_info";

export function useAddresses() {
  const bitcodexCosmos = useSDKState((state) => state.bitcodex_cosmos);
  const bitcodexEth = useSDKState((state) => state.bitcodex_eth);
  const { isSignedIn } = useUserInfoState();

  const [cosmosAddress, setCosmosAddress] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState<string | null>(null);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const promises = [];

        if (bitcodexCosmos) {
          promises.push(
            bitcodexCosmos
              .getKey("cosmoshub-4")
              .then((key) => setCosmosAddress(key?.bech32Address || null)),
          );
        }

        if (bitcodexEth) {
          promises.push(
            bitcodexEth.getAddress().then((addr) => setEthAddress(addr)),
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    };

    if (isSignedIn) {
      loadAddresses();
    }

    if (!isSignedIn) {
      if (cosmosAddress) {
        setCosmosAddress(null);
      }

      if (ethAddress) {
        setEthAddress(null);
      }
    }
  }, [isSignedIn, bitcodexCosmos, bitcodexEth]);

  return { cosmosAddress, ethAddress };
}
