import type { NextPage } from "next";

import { DebugContracts } from "./_components/DebugContracts";
import { getMetadata } from "@bitcodex-sandbox-evm/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return <DebugContracts />;
};

export default Debug;
