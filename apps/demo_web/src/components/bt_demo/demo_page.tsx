"use client";

import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import { type FC, useEffect, useState } from "react";

import { type Custom, DEFAULT_CUSTOM } from "./custom";
import styles from "./demo.module.scss";
import { SignedOut } from "./signed_out";
import { NETWORK_NAME } from "@bitcodex-demo-web/bittensor_network";
import { ThemeButton } from "@bitcodex-demo-web/components/theme/theme_button";
import { BittensorWidget } from "@bitcodex-demo-web/components/widgets/bittensor_widget/bittensor_widget";

const REPO = "https://github.com/SomeshTalligeriDEV/bitcodeX-infra";
/** BitcodeX demo: an embedded Bittensor wallet in a normal web app. Bittensor only. */
export const DemoPage: FC = () => {
  const { isSignedIn, isReady } = useBitcodeX();
  const { isReady: isBittensorReady } = useBitcodeXBittensor();
  const [custom, setCustom] = useState<Custom>(DEFAULT_CUSTOM);
  const ready = isReady && isBittensorReady;

  return (
    <div
      className={styles.shell}
      style={
        custom.accent === "mono"
          ? undefined
          : {
              ["--accent" as string]: custom.accent,
              ["--accent-fg" as string]: "#fff",
            }
      }
    >
      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          <span className={styles.mark}>B</span>
          BitcodeX
          <span className={styles.tag}>Demo</span>
        </a>
        <span className={styles.netPill}>
          <span className={styles.dot} />
          Bittensor · {NETWORK_NAME}
        </span>
        <span className={styles.spacer} />
        <a className={styles.navLink} href="/docs">
          Docs
        </a>
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
          <div className={styles.loading}>
            <span className={styles.spinner} /> Connecting to BitcodeX…
          </div>
        ) : isSignedIn ? (
          <SignedIn />
        ) : (
          <SignedOut custom={custom} setCustom={setCustom} />
        )}
      </main>
    </div>
  );
};

/** Signed in with BitcodeX: the user (from a real access token) and the wallet. */
const SignedIn: FC = () => {
  const { wallet, email, authType } = useBitcodeX();
  const { bittensorWallet } = useBitcodeXBittensor();
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenErr, setTokenErr] = useState<string | null>(null);
  const [linked, setLinked] = useState<string[]>([]);
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    // A real access token from the BitcodeX API (EdDSA JWT). Your backend verifies it
    // with verifyAccessToken from @bitcodex/server; here we only read its subject.
    wallet
      ?.getAccessToken()
      .then((t) => {
        if (!t) {
          setTokenErr("no access token");
          return;
        }
        const payload = JSON.parse(
          atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        setUserId(String(payload.sub));
      })
      .catch((e: unknown) =>
        setTokenErr(e instanceof Error ? e.message : String(e)),
      );
  }, [wallet]);

  const linkWallet = async () => {
    if (!bittensorWallet) {
      return;
    }
    setLinking(true);
    setLinkErr(null);
    try {
      const list = await bittensorWallet.listExtensionAccounts("BitcodeX demo");
      if (list.length === 0) {
        throw new Error(
          "No Bittensor wallet extension found (Talisman, SubWallet, Polkadot.js).",
        );
      }
      const r = await bittensorWallet.linkWallet(list[0]);
      setLinked((l) => [...new Set([...l, r.address])]);
    } catch (e) {
      setLinkErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className={styles.signedIn}>
      <aside className={styles.userCol}>
        <div className={styles.userCard}>
          <h2 className={styles.panelTitle}>User</h2>
          <div className={styles.kv}>
            <span>User ID</span>
            <span className={styles.mono}>{userId ?? tokenErr ?? "…"}</span>
          </div>
          <div className={styles.kv}>
            <span>Access token</span>
            <span>
              {userId ? "issued, verifiable with @bitcodex/server" : "…"}
            </span>
          </div>
          <span className={styles.groupLabel}>Linked accounts</span>
          <div className={styles.linkRow}>
            <span className={styles.badge}>{authType ?? "social"}</span>
            <span className={styles.mono}>{email ?? "-"}</span>
          </div>
          {linked.map((a) => (
            <div key={a} className={styles.linkRow}>
              <span className={styles.badge}>wallet</span>
              <span className={styles.mono}>
                {a.slice(0, 10)}…{a.slice(-8)}
              </span>
            </div>
          ))}
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={linking}
            onClick={linkWallet}
          >
            {linking ? "Waiting for your wallet…" : "Link a Bittensor wallet"}
          </button>
          {linkErr && <div className={styles.error}>{linkErr}</div>}
        </div>
      </aside>
      <div className={styles.walletCol}>
        <BittensorWidget />
      </div>
    </div>
  );
};

/** Logged in with an extension wallet (no embedded key): verified address + balance. */
