import { CosmosIcon } from "@bitcodex/bitcodex-common-ui/icons/cosmos_icon";
import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useCallback } from "react";

import { SignWidget } from "@bitcodex-demo-web/components/widgets/sign_widget/sign_widget";
import { COSMOS_CHAIN_ID } from "@bitcodex-demo-web/constants/cosmos";

export const CosmosOffChainSignWidget = () => {
  const { cosmosWallet: bitcodexCosmos } = useBitcodeXCosmos();

  const handleClickCosmosArbitrarySign = useCallback(async () => {
    console.log("handleClickCosmosArbitrarySign()");

    if (bitcodexCosmos === null) {
      throw new Error("bitcodexCosmos is not initialized");
    }

    const account = await bitcodexCosmos.getKey(COSMOS_CHAIN_ID);
    const address = account?.bech32Address;
    console.log("account", account);

    if (!address) {
      throw new Error("Address is not found");
    }

    const result = await bitcodexCosmos.signArbitrary(
      COSMOS_CHAIN_ID,
      address,
      "Welcome to BitcodeX! 🚀 Try generating an MPC signature.",
    );

    console.log("SignDirect result:", result);
  }, [bitcodexCosmos]);

  return (
    <SignWidget
      chain="Cosmos Hub"
      chainIcon={<CosmosIcon />}
      signType="offchain"
      signButtonOnClick={handleClickCosmosArbitrarySign}
    />
  );
};
