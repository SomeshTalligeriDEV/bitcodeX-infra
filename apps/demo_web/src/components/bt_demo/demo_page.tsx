"use client";

import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import {
  type ExtensionAccount,
  formatTaoAmount,
  getApi,
  getBalances,
  type WalletLoginResult,
} from "@bitcodex/sdk-bittensor";
import { type FC, useEffect, useMemo, useState } from "react";

import styles from "./demo.module.scss";
import { CHAIN_ID, NETWORK_NAME } from "@bitcodex-demo-web/bittensor_network";
import { Btn as Button } from "@bitcodex-demo-web/components/bt_demo/btn";
import { ThemeButton } from "@bitcodex-demo-web/components/theme/theme_button";
import { BittensorWidget } from "@bitcodex-demo-web/components/widgets/bittensor_widget/bittensor_widget";

const REPO = "https://github.com/SomeshTalligeriDEV/bitcodeX-infra";

type Method = "google" | "github" | "wallet";
const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: "google", label: "Google", hint: "Embedded coldkey on first login" },
  {
    id: "github",
    label: "GitHub",
    hint: "Needs a GitHub OAuth app on the server",
  },
  {
    id: "wallet",
    label: "Bittensor wallet",
    hint: "Talisman, SubWallet or Polkadot.js via Sign-In with Bittensor",
  },
];
// "mono" = black-and-white (the BitcodeX default); the rest preview an app's brand colour.
const ACCENTS = ["mono", "#7F56D9", "#2E90FA", "#12B76A", "#ED6B25"];

interface Custom {
  methods: Method[];
  accent: string;
  theme: "light" | "dark" | "system";
  logoUrl: string;
}

/** BitcodeX demo: an embedded Bittensor wallet in a normal web app. Bittensor only. */
export const DemoPage: FC = () => {
  const { isSignedIn, isReady } = useBitcodeX();
  const { isReady: isBittensorReady } = useBitcodeXBittensor();
  const [walletSession, setWalletSession] = useState<WalletLoginResult | null>(
    null,
  );
  const [custom, setCustom] = useState<Custom>({
    methods: ["google", "wallet"],
    accent: ACCENTS[0],
    theme: "system",
    logoUrl: "",
  });
  const ready = isReady && isBittensorReady;

  return (
    <div
      className={styles.shell}
      style={{ ["--accent" as string]: custom.accent }}
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
        ) : walletSession ? (
          <WalletSessionView
            session={walletSession}
            onExit={() => setWalletSession(null)}
          />
        ) : (
          <SignedOut
            custom={custom}
            setCustom={setCustom}
            onWalletLogin={setWalletSession}
          />
        )}
      </main>
    </div>
  );
};

const SignedOut: FC<{
  custom: Custom;
  setCustom: (c: Custom) => void;
  onWalletLogin: (s: WalletLoginResult) => void;
}> = ({ custom, setCustom, onWalletLogin }) => {
  const { openSignInModal, signIn } = useBitcodeX();
  const { bittensorWallet } = useBitcodeXBittensor();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ExtensionAccount[] | null>(null);

  const social = custom.methods.filter(
    (m): m is "google" | "github" => m !== "wallet",
  );

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m !== "Sign in cancelled") {
        setError(m);
      }
    } finally {
      setBusy(null);
    }
  };

  const login = () =>
    run("login", async () => {
      if (social.length === 1) {
        await signIn(social[0]);
        return;
      }
      await openSignInModal({
        loginMethods: social,
        accentColor: custom.accent === "mono" ? null : custom.accent,
        logoUrl: custom.logoUrl.trim() || null,
        theme: custom.theme,
      });
    });

  const findWallets = () =>
    run("wallets", async () => {
      if (!bittensorWallet) {
        throw new Error("BitcodeX is not ready");
      }
      const list = await bittensorWallet.listExtensionAccounts("BitcodeX demo");
      if (list.length === 0) {
        throw new Error(
          "No Bittensor wallet extension found. Install Talisman, SubWallet or the Polkadot.js extension and allow this site.",
        );
      }
      setAccounts(list);
    });

  const toggle = (m: Method) =>
    setCustom({
      ...custom,
      methods: custom.methods.includes(m)
        ? custom.methods.filter((x) => x !== m)
        : [...custom.methods, m],
    });

  const code = useMemo(() => {
    const lines = [
      `<BitcodeXProvider`,
      `  config={{`,
      `    apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY,`,
      `    sdkEndpoint: "https://wallet.your-domain.com",`,
      `    bittensor: { chainId: "${CHAIN_ID}" },`,
      `  }}`,
      `>`,
      `  <App />`,
      `</BitcodeXProvider>`,
      ``,
      `// Login methods, theme, accent and logo are app settings`,
      `// (developer dashboard → Apps). This page previews them:`,
      `openSignInModal({`,
      `  loginMethods: ${JSON.stringify(social)},`,
      custom.accent === "mono"
        ? "  // accent: black and white (default)"
        : `  accentColor: "${custom.accent}",`,
      `  theme: "${custom.theme}",${custom.logoUrl.trim() ? `\n  logoUrl: "${custom.logoUrl.trim()}",` : ""}`,
      `});`,
    ];
    if (custom.methods.includes("wallet")) {
      lines.push(
        ``,
        `// Bittensor wallet login (extension + Sign-In with Bittensor)`,
        `const [account] = await bittensorWallet.listExtensionAccounts();`,
        `const { accessToken } = await bittensorWallet.loginWithWallet(account);`,
      );
    }
    return lines.join("\n");
  }, [custom, social]);

  return (
    <div className={styles.split}>
      <aside className={styles.customize}>
        <h2 className={styles.panelTitle}>Customize</h2>
        <p className={styles.muted}>
          Changes apply to the real login on this page.
        </p>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Login methods</span>
          {METHODS.map((m) => (
            <label key={m.id} className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={custom.methods.includes(m.id)}
                onChange={() => toggle(m.id)}
              />
              <span>
                <strong>{m.label}</strong>
                <span className={styles.hint}>{m.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Accent colour</span>
          <div className={styles.swatches}>
            {ACCENTS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={c}
                className={styles.swatch}
                data-active={custom.accent === c}
                style={{
                  background:
                    c === "mono"
                      ? "linear-gradient(135deg, #000 50%, #fff 50%)"
                      : c,
                }}
                onClick={() => setCustom({ ...custom, accent: c })}
              />
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Login modal theme</span>
          <div className={styles.segmented}>
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                type="button"
                key={t}
                data-active={custom.theme === t}
                onClick={() => setCustom({ ...custom, theme: t })}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Logo URL (optional)</span>
          <input
            className={styles.input}
            placeholder="https://…/logo.png"
            value={custom.logoUrl}
            onChange={(e) => setCustom({ ...custom, logoUrl: e.target.value })}
          />
        </div>
      </aside>

      <section className={styles.previewCol}>
        <div className={styles.loginCard}>
          <span className={styles.eyebrow}>Embedded wallets for Bittensor</span>
          <h1 className={styles.title}>Log in to see your Bittensor wallet</h1>
          <p className={styles.lead}>
            A coldkey is created on first login, split 2-of-2 between this
            browser and the BitcodeX server. No extension, no seed phrase. Every
            signature is approved in a readable popup.
          </p>
          <div className={styles.ctaCol}>
            {social.length > 0 && (
              <button
                type="button"
                className={styles.primary}
                disabled={!!busy}
                onClick={login}
              >
                {busy === "login"
                  ? "Opening…"
                  : social.length === 1
                    ? `Continue with ${social[0] === "google" ? "Google" : "GitHub"}`
                    : "Log in"}
              </button>
            )}
            {custom.methods.includes("wallet") && !accounts && (
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={!!busy}
                onClick={findWallets}
              >
                {busy === "wallets"
                  ? "Looking for wallets…"
                  : "Continue with a Bittensor wallet"}
              </button>
            )}
            {accounts?.map((a) => (
              <button
                type="button"
                key={`${a.source}:${a.address}`}
                className={styles.accountBtn}
                disabled={!!busy}
                onClick={() =>
                  run("wallet-login", async () => {
                    if (!bittensorWallet) {
                      throw new Error("BitcodeX is not ready");
                    }
                    onWalletLogin(await bittensorWallet.loginWithWallet(a));
                  })
                }
              >
                <strong>{a.name ?? "Account"}</strong>
                <span className={styles.mono}>
                  {a.address.slice(0, 10)}…{a.address.slice(-8)} · {a.source}
                </span>
              </button>
            ))}
            {custom.methods.length === 0 && (
              <span className={styles.muted}>
                Turn on at least one login method.
              </span>
            )}
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.codeCard}>
          <div className={styles.codeHead}>
            <i /> <i /> <i /> <span>app.tsx: updates as you customize</span>
          </div>
          <pre className={styles.codeBody}>{code}</pre>
        </div>
      </section>
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
const WalletSessionView: FC<{
  session: WalletLoginResult;
  onExit: () => void;
}> = ({ session, onExit }) => {
  const [balance, setBalance] = useState<string | null>(null);
  useEffect(() => {
    getApi(CHAIN_ID).then(async (r) => {
      if (r.success) {
        setBalance(
          formatTaoAmount((await getBalances(r.data, session.address)).free),
        );
      }
    });
  }, [session.address]);
  return (
    <div className={styles.walletSession}>
      <div className={styles.userCard}>
        <h2 className={styles.panelTitle}>Signed in with your wallet</h2>
        <p className={styles.muted}>
          You proved control of this address with Sign-In with Bittensor.
          Signing stays in your extension ({session.source}).
        </p>
        <div className={styles.kv}>
          <span>Address</span>
          <span className={styles.mono}>{session.address}</span>
        </div>
        <div className={styles.kv}>
          <span>Balance</span>
          <span>{balance ?? "…"}</span>
        </div>
        <div className={styles.kv}>
          <span>User</span>
          <span className={styles.mono}>{session.userId}</span>
        </div>
        <div className={styles.kv}>
          <span>Access token</span>
          <span>issued by BitcodeX, verify with @bitcodex/server</span>
        </div>
        <Button variant="secondary" size="sm" onClick={onExit}>
          Sign out
        </Button>
      </div>
    </div>
  );
};
