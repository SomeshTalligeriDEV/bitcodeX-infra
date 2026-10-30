"use client";

import { GoogleIcon } from "@bitcodex/bitcodex-common-ui/icons/google_icon";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import type {
  ExtensionAccount,
  WalletLoginResult,
} from "@bitcodex/sdk-bittensor";
import { type FC, useState } from "react";

import {
  ACCENTS,
  type Custom,
  exportSnippet,
  GITHUB_ENABLED,
  type Method,
} from "./custom";
import styles from "./signed_out.module.scss";
import { NETWORK_NAME } from "@bitcodex-demo-web/bittensor_network";

const THEMES: { id: Custom["theme"]; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

const Switch: FC<{
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, hint, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={styles.switchRow}
    onClick={onChange}
  >
    <span>
      <strong>{label}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </span>
    <span className={styles.track} data-on={checked}>
      <span className={styles.thumb} />
    </span>
  </button>
);

/** Privy-style demo: settings on the left, the real login window in the middle. */
export const SignedOut: FC<{
  custom: Custom;
  setCustom: (c: Custom) => void;
  onWalletLogin: (s: WalletLoginResult) => void;
}> = ({ custom, setCustom, onWalletLogin }) => {
  const { signIn } = useBitcodeX();
  const { bittensorWallet } = useBitcodeXBittensor();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ExtensionAccount[] | null>(null);
  const [copied, setCopied] = useState(false);

  const has = (m: Method) => custom.methods.includes(m);
  const toggle = (m: Method) =>
    setCustom({
      ...custom,
      methods: has(m)
        ? custom.methods.filter((x) => x !== m)
        : [...custom.methods, m],
    });

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportSnippet(custom));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed: select the code in the docs and copy it by hand.");
    }
  };

  const accent =
    custom.accent === "mono"
      ? undefined
      : {
          ["--accent" as string]: custom.accent,
          ["--accent-fg" as string]: "#fff",
        };
  // The card previews the chosen look; "system" follows the page theme.
  const cardTheme = custom.theme === "system" ? undefined : custom.theme;
  const none =
    !has("google") && !(GITHUB_ENABLED && has("github")) && !has("wallet");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sideTitle}>Customize</h2>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Background</span>
          <div className={styles.swatches}>
            {THEMES.map((t) => (
              <button
                type="button"
                key={t.id}
                title={t.label}
                aria-label={`${t.label} background`}
                className={styles.swatch}
                data-active={custom.theme === t.id}
                data-kind={t.id}
                onClick={() => setCustom({ ...custom, theme: t.id })}
              />
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Accent</span>
          <div className={styles.swatches}>
            {ACCENTS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={`Accent ${c === "mono" ? "black and white" : c}`}
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

        <input
          className={styles.input}
          placeholder="Logo image URL (https://…)"
          value={custom.logoUrl}
          onChange={(e) => setCustom({ ...custom, logoUrl: e.target.value })}
        />

        <h3 className={styles.sectionTitle}>Authentication</h3>
        <Switch
          label="Google"
          hint="Embedded coldkey on first login"
          checked={has("google")}
          onChange={() => toggle("google")}
        />
        {GITHUB_ENABLED && (
          <Switch
            label="GitHub"
            checked={has("github")}
            onChange={() => toggle("github")}
          />
        )}
        <Switch
          label="Bittensor wallet"
          hint="Talisman, SubWallet, Polkadot.js"
          checked={has("wallet")}
          onChange={() => toggle("wallet")}
        />

        <h3 className={styles.sectionTitle}>Network</h3>
        <div className={styles.network}>
          <span className={styles.netDot} />
          Bittensor · {NETWORK_NAME}
          <span className={styles.hint}>Mainnet stays off until an audit.</span>
        </div>
      </aside>

      <section className={styles.center}>
        <div
          className={styles.card}
          data-theme-preview={cardTheme}
          style={accent}
        >
          {custom.logoUrl.trim() ? (
            <img className={styles.logo} src={custom.logoUrl.trim()} alt="" />
          ) : (
            <div className={styles.logoMark}>
              <span>B</span> BitcodeX
            </div>
          )}
          <h1 className={styles.cardTitle}>Log in or sign up</h1>

          <div className={styles.methods}>
            {has("google") && (
              <button
                type="button"
                className={styles.method}
                data-primary="true"
                disabled={!!busy}
                onClick={() => run("google", () => signIn("google"))}
              >
                <GoogleIcon width={18} height={18} />
                <span>{busy === "google" ? "Opening Google…" : "Google"}</span>
              </button>
            )}
            {GITHUB_ENABLED && has("github") && (
              <button
                type="button"
                className={styles.method}
                disabled={!!busy}
                onClick={() => run("github", () => signIn("github"))}
              >
                <span className={styles.badge}>GH</span>
                <span>{busy === "github" ? "Opening GitHub…" : "GitHub"}</span>
              </button>
            )}
            {has("wallet") && !accounts && (
              <button
                type="button"
                className={styles.method}
                disabled={!!busy}
                onClick={findWallets}
              >
                <span className={styles.badge}>τ</span>
                <span>
                  {busy === "wallets"
                    ? "Looking for wallets…"
                    : "Continue with a wallet"}
                </span>
              </button>
            )}
            {has("wallet") &&
              accounts?.map((a) => (
                <button
                  type="button"
                  key={`${a.source}:${a.address}`}
                  className={styles.method}
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
                  <span className={styles.badge}>τ</span>
                  <span className={styles.accountText}>
                    <strong>{a.name ?? "Account"}</strong>
                    <small>
                      {a.address.slice(0, 8)}…{a.address.slice(-6)} · {a.source}
                    </small>
                  </span>
                </button>
              ))}
            {none && (
              <p className={styles.empty}>
                Turn on a login method on the left to see it here.
              </p>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}
          <p className={styles.protected}>Protected by BitcodeX</p>
        </div>
        <p className={styles.caption}>
          This is the real login window. It follows the settings on the left.
          Signing in creates a real Bittensor {NETWORK_NAME.toLowerCase()}{" "}
          coldkey for you.
        </p>
      </section>

      <aside className={styles.right}>
        <div className={styles.infoCard} data-highlight="true">
          <h3>Explore BitcodeX</h3>
          <p>The easiest way to onboard users to Bittensor.</p>
          <p className={styles.sub}>
            Install the SDK, wrap your app, and your users get wallets.
          </p>
          <a className={styles.cta} href="/docs">
            Explore the Docs →
          </a>
        </div>
        <div className={styles.infoCard}>
          <h3>Export this configuration</h3>
          <p>
            Copy the provider and login code for the settings you chose, and
            paste it into your app.
          </p>
          <button type="button" className={styles.cta} onClick={copy}>
            {copied ? "Copied ✓" : "Copy to Clipboard"}
          </button>
        </div>
      </aside>
    </div>
  );
};
