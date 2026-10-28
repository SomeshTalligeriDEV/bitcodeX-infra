import type { NextPage } from "next";

import { SigningPlayground } from "@bitcodex-sandbox-evm/app/playground/_components/SigningPlayground";
import { getMetadata } from "@bitcodex-sandbox-evm/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Signing Playground",
  description: "Test personal signing and EIP-712 permit signing with BitcodeX",
});

const Playground: NextPage = () => {
  return <SigningPlayground />;
};

export default Playground;
