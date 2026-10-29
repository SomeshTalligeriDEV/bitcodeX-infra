"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import { type FC, useState } from "react";

import styles from "./demo.module.scss";
import { NETWORK_NAME } from "@bitcodex-demo-web/bittensor_network";
import { ThemeButton } from "@bitcodex-demo-web/components/theme/theme_button";
import { BittensorWidget } from "@bitcodex-demo-web/components/widgets/bittensor_widget/bittensor_widget";

const REPO = "https://github.com/SomeshTalligeriDEV/bitcodeX-infra";

/** BitcodeX demo: an embedded Bittensor wallet in a normal web app. Bittensor only. */
export const DemoPage: FC = () => {
  const { isSignedIn, isReady } = useBitcodeX();
  const { isReady: isBittensorReady } = useBitcodeXBittensor();
  const ready = isReady && isBittensorReady;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          <span className={styles.mark}>B</span>
          BitcodeX
          <span className={styles.tag}>Demo</span>
        </a>
        <span className={styles.tag}>Bittensor · {NETWORK_NAME}</span>
        <span className={styles.spacer} />
        <a
          className={styles.navLink}
          href={REPO}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <ThemeButton />
      </header>
      <main className={styles.main}>
        {!ready ? (
          <div className={styles.loading}>Connecting to BitcodeX…</div>
        ) : isSignedIn ? (
          <BittensorWidget />
        ) : (
          <Landing />
        )}
      </main>
    </div>
  );
};

const Landing: FC = () => {
  const { signIn, openSignInModal } = useBitcodeX();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m !== "Sign in cancelled") {
        setError(m);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.landing}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Embedded wallets for Bittensor</span>
          <h1 className={styles.title}>
            A Bittensor wallet behind a Google login.
          </h1>
          <p className={styles.lead}>
            Sign in and get a coldkey in seconds. No extension, no seed phrase.
            Send TAO, stake to validators, register hotkeys and grant agents
            limited permissions, with every signature approved in a clear popup.
          </p>
          <div className={styles.ctaRow}>
            <Button
              size="lg"
              disabled={busy}
              isLoading={busy}
              onClick={() => go(() => signIn("google"))}
            >
              Continue with Google
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={busy}
              onClick={() => go(() => openSignInModal())}
            >
              Other login options
            </Button>
          </div>
          <ul className={styles.features}>
            <li className={styles.feature}>
              <strong>Never one full key</strong>
              2-of-2 threshold signing (FROST). Your browser and the server each
              hold a share.
            </li>
            <li className={styles.feature}>
              <strong>Readable approvals</strong>
              Every call decoded: amount, destination, subnet, fee.
            </li>
            <li className={styles.feature}>
              <strong>Works with dApps</strong>A polkadot.js signer and an
              injected extension for existing Bittensor apps.
            </li>
          </ul>
        </div>
        <div className={styles.codeCard}>
          <div className={styles.codeHead}>
            <i /> <i /> <i /> <span>app.tsx</span>
          </div>
          <pre className={styles.codeBody}>
            <span className={styles.k}>import</span>{" "}
            {"{ BitcodeXProvider, useBitcodeX }"}{" "}
            <span className={styles.k}>from</span>{" "}
            <span className={styles.s}>"@bitcodex/sdk-react"</span>
            {";\n"}
            <span className={styles.k}>import</span>{" "}
            {"{ useBitcodeXBittensor }"} <span className={styles.k}>from</span>{" "}
            <span className={styles.s}>"@bitcodex/sdk-react/bittensor"</span>
            {";\n\n"}
            {
              "<BitcodeXProvider config={{\n  apiKey, sdkEndpoint,\n  bittensor: { chainId: "
            }
            <span className={styles.s}>"bittensor:testnet"</span>
            {" },\n}}>\n  <App />\n</BitcodeXProvider>\n\n"}
            <span className={styles.k}>function</span> App() {"{\n"}
            {"  const { isSignedIn, signIn } = useBitcodeX();\n"}
            {"  const { bittensorWallet } = useBitcodeXBittensor();\n"}
            {"  "}
            <span className={styles.c}>
              {"// the popup shows amount + fee; the user approves"}
            </span>
            {"\n  const send = () => bittensorWallet.sendTao(to, "}
            <span className={styles.s}>"1.5"</span>
            {");\n}"}
          </pre>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </>
  );
};
