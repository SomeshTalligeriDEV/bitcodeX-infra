import {
  BitcodeXProvider,
  type BitcodeXProviderConfig,
} from "@bitcodex/bitcodex-sdk-react";

import CosmosTransactionForm from "@/components/CosmosTransactionForm";
import Header from "@/components/Header";
import StatusBar from "@/components/StatusBar";
import EvmTransactionForm from "./components/EvmTransactionForm";
import SvmTransactionForm from "./components/SvmTransactionForm";

const bitcodexConfig: BitcodeXProviderConfig = {
  apiKey: import.meta.env.VITE_BITCODEX_API_KEY ?? "",
  sdkEndpoint: import.meta.env.VITE_BITCODEX_SDK_ENDPOINT,
  eth: true,
  cosmos: true,
  svm: { chainId: "solana:devnet" },
};

function App() {
  return (
    <BitcodeXProvider config={bitcodexConfig}>
      <div className="max-w-[920px] mx-auto my-10 p-5">
        <Header />
        <StatusBar />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CosmosTransactionForm />
          <EvmTransactionForm />
          <SvmTransactionForm />
        </div>
      </div>
    </BitcodeXProvider>
  );
}

export default App;
