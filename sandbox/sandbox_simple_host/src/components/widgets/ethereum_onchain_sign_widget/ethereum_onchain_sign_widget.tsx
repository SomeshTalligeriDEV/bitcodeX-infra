import { publicKeyToEthereumAddress } from "@bitcodex/bitcodex-sdk-eth";
import {
  encodeFunctionData,
  isAddressEqual,
  keccak256,
  parseAbi,
  parseTransaction,
  parseUnits,
  recoverPublicKey,
  type Signature,
  serializeTransaction,
} from "viem";

import { SignWidget } from "@/components/widgets/sign_widget/sign_widget";
import { useBitcodeX } from "@/hooks/use_bitcodex";

export const EthereumOnchainSignWidget = () => {
  const { bitcodexEth } = useBitcodeX();

  const handleClickEthOnchainSign = async () => {
    if (bitcodexEth === null) {
      throw new Error("bitcodexEth is not initialized");
    }

    const provider = await bitcodexEth.getEthereumProvider();
    const address = await bitcodexEth.getAddress();

    const toAddress = "0xbb6B34131210C091cb2890b81fCe7103816324a5"; // dogemos.eth
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const transferAmount = parseUnits("1", 6);

    const abi = parseAbi([
      "function transfer(address to, uint256 amount) public returns (bool)",
    ]);
    const data = encodeFunctionData({
      abi,
      functionName: "transfer",
      args: [toAddress, transferAmount],
    });

    const signedTx = await provider.request({
      method: "eth_signTransaction",
      params: [
        {
          type: "0x2",
          from: address,
          to: usdcAddress,
          data,
          value: "0x0",
        },
      ],
    });

    const parsedTx = parseTransaction(signedTx);

    const signature: Signature = {
      r: parsedTx.r!,
      s: parsedTx.s!,
      v: parsedTx.v!,
      yParity: parsedTx.yParity,
    };

    const txWithoutSignature = {
      ...parsedTx,
      r: undefined,
      s: undefined,
      v: undefined,
      yParity: undefined,
    };

    const txHash = keccak256(serializeTransaction(txWithoutSignature));

    const recoveredPublicKey = await recoverPublicKey({
      hash: txHash,
      signature,
    });

    const recoveredAddress = publicKeyToEthereumAddress(recoveredPublicKey);

    const isRecoveredAddressEqual = isAddressEqual(recoveredAddress, address);

    if (!isRecoveredAddressEqual) {
      throw new Error("Recovered address is not equal to the address");
    }
  };
  return (
    <SignWidget
      chain="Ethereum"
      signType="onchain"
      signButtonOnClick={handleClickEthOnchainSign}
    />
  );
};
