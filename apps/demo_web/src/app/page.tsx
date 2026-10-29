import { BitcodeXProvider } from "@bitcodex-demo-web/components/bitcodex_provider/bitcodex_provider";
import { DemoPage } from "@bitcodex-demo-web/components/bt_demo/demo_page";
import { QueryClientProvider } from "@bitcodex-demo-web/components/query_client_provider/query_client_provider";

export default function Home() {
  return (
    <BitcodeXProvider>
      <QueryClientProvider>
        <DemoPage />
      </QueryClientProvider>
    </BitcodeXProvider>
  );
}
