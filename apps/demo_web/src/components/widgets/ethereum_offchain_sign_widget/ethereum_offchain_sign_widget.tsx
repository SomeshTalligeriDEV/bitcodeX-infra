import { EthereumBlueIcon } from "@bitcodex/bitcodex-common-ui/icons/ethereum_blue_icon";
import { useBitcodeXEth } from "@bitcodex/bitcodex-sdk-react/eth";
import { isAddressEqual, recoverMessageAddress } from "viem";

import { SignWidget } from "@bitcodex-demo-web/components/widgets/sign_widget/sign_widget";

export const EthereumOffchainSignWidget = () => {
  const { ethWallet: bitcodexEth } = useBitcodeXEth();

  const handleClickEthOffchainSign = async () => {
    if (bitcodexEth === null) {
      throw new Error("bitcodexEth is not initialized");
    }

    const message = "Welcome to BitcodeX! 🚀 Try generating an MPC signature.";

    const signature = await bitcodexEth.sign(message);

    const address = await bitcodexEth.getAddress();
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });

    if (!isAddressEqual(recoveredAddress, address)) {
      throw new Error("Recovered address is not equal to the address");
    }
  };

  return (
    <SignWidget
      chain="Ethereum"
      chainIcon={<EthereumBlueIcon />}
      signType="offchain"
      signButtonOnClick={handleClickEthOffchainSign}
    />
  );
};
