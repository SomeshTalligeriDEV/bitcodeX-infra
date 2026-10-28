import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useBitcodeXEth } from "@bitcodex/bitcodex-sdk-react/eth";
import { useBitcodeXSvm } from "@bitcodex/bitcodex-sdk-react/svm";
import type { BitcodeXSvmWalletInterface } from "@bitcodex/bitcodex-sdk-svm";
import type { Result } from "@bitcodex/stdlib-js";
import { useEffect, useRef, useState } from "react";

import { COSMOS_CHAIN_ID } from "@bitcodex-demo-web/constants/cosmos";

export function useAddresses() {
  const { cosmosWallet: bitcodexCosmos } = useBitcodeXCosmos();
  const { ethWallet: bitcodexEth } = useBitcodeXEth();
  const { svmWallet: bitcodexSvm } = useBitcodeXSvm();
  const { isSignedIn } = useBitcodeX();
  const isSignedRef = useRef(isSignedIn);
  isSignedRef.current = isSignedIn;

  const [cosmosAddress, setCosmosAddress] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      if (cosmosAddress) {
        setCosmosAddress(null);
      }

      if (ethAddress) {
        setEthAddress(null);
      }

      if (solanaAddress) {
        setSolanaAddress(null);
      }
      return;
    }

    const loadAddresses = async () => {
      try {
        const promises: Promise<any>[] = [];

        if (bitcodexCosmos) {
          promises.push(
            bitcodexCosmos.getKey(COSMOS_CHAIN_ID).then((key) => {
              if (isSignedRef.current) {
                setCosmosAddress(key.bech32Address);
              }
            }),
          );
        }

        if (bitcodexEth) {
          promises.push(
            bitcodexEth.getAddress().then((addr) => {
              if (isSignedRef.current) {
                setEthAddress(addr);
              }
            }),
          );
        }

        if (bitcodexSvm) {
          promises.push(
            new Promise((resolve, reject) => {
              connectSol(bitcodexSvm, isSignedRef.current, setSolanaAddress)
                .then(resolve)
                .catch(reject);
            }),
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
  }, [
    isSignedIn,
    bitcodexCosmos,
    bitcodexEth,
    bitcodexSvm,
    cosmosAddress,
    ethAddress,
    solanaAddress,
  ]);

  return { cosmosAddress, ethAddress, solanaAddress };
}

async function connectSol(
  bitcodexSvm: BitcodeXSvmWalletInterface,
  isSignedRef: boolean,
  setSolanaAddress: (pk: string) => void,
): Promise<Result<void, any>> {
  try {
    // this might have been done in lazyInit()
    if (!bitcodexSvm.connected) {
      await bitcodexSvm.connect();
    }

    if (bitcodexSvm.publicKey && isSignedRef) {
      setSolanaAddress(bitcodexSvm.publicKey.toBase58());
    }

    return { success: true, data: void 0 };
  } catch (err: any) {
    console.error("Failed to get Solana address:", err);
    return { success: false, err };
  }
}
