import { BitcodeXProvider } from "@/components/bitcodex_provider/bitcodex_provider";
import { PreviewPanel } from "@/components/preview_panel/preview_panel";

export const Home = () => {
  return (
    <BitcodeXProvider>
      <PreviewPanel />
    </BitcodeXProvider>
  );
};
