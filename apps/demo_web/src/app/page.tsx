import styles from "./page.module.scss";
import { BitcodeXProvider } from "@bitcodex-demo-web/components/bitcodex_provider/bitcodex_provider";
import { GlobalHeader } from "@bitcodex-demo-web/components/global_header/global_header";
import { LeftBar } from "@bitcodex-demo-web/components/left_bar/left_bar";
import { PreviewPanel } from "@bitcodex-demo-web/components/preview_panel/preview_panel";
import { QueryClientProvider } from "@bitcodex-demo-web/components/query_client_provider/query_client_provider";

export default function Home() {
  return (
    <BitcodeXProvider>
      <QueryClientProvider>
        <div className={styles.wrapper}>
          <GlobalHeader />
          <div className={styles.body}>
            <LeftBar />
            <PreviewPanel />
          </div>
        </div>
      </QueryClientProvider>
    </BitcodeXProvider>
  );
}
