import "@rainbow-me/rainbowkit/styles.css";
import "@bitcodex-sandbox-evm/styles/globals.css";

import { ScaffoldEthAppWithProviders } from "@bitcodex-sandbox-evm/components/ScaffoldEthAppWithProviders";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
