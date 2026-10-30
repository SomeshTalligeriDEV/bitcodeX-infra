"use client";

import { GoogleIcon } from "@bitcodex/bitcodex-common-ui/icons/google_icon";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { type FC, useState } from "react";

import {
  ACCENTS,
  type Custom,
  exportSnippet,
  GITHUB_ENABLED,
  type Method,
  SOON_PROVIDERS,
} from "./custom";
import { NetworkPulse } from "./network_pulse";
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
  onChange?: () => void;
  soon?: boolean;
}> = ({ label, hint, checked, onChange, soon }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-disabled={soon}
    disabled={soon}
    className={styles.switchRow}
    data-soon={soon}
    onClick={onChange}
  >
    <span>
      <strong>{label}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </span>
    {soon ? (
      <span className={styles.soonTag}>Soon</span>
    ) : (
      <span className={styles.track} data-on={checked}>
        <span className={styles.thumb} />
      </span>
    )}
  </button>
);

/** Privy-style demo: settings on the left, the real login window in the middle. */
export const SignedOut: FC<{
  custom: Custom;
  setCustom: (c: Custom) => void;
}> = ({ custom, setCustom }) => {
  const { signIn } = useBitcodeX();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
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
  const none = !has("google") && !(GITHUB_ENABLED && has("github"));

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
        <Switch
          label="GitHub"
          hint={GITHUB_ENABLED ? undefined : "Needs a GitHub OAuth app"}
          checked={GITHUB_ENABLED && has("github")}
          onChange={() => toggle("github")}
          soon={!GITHUB_ENABLED}
        />
        {SOON_PROVIDERS.map((p) => (
          <Switch key={p.id} label={p.label} checked={false} soon />
        ))}

        <h3 className={styles.sectionTitle}>Network</h3>
        <div className={styles.network}>
          <span className={styles.netName}>
            <span className={styles.netDot} />
            Bittensor · {NETWORK_NAME}
          </span>
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
            {GITHUB_ENABLED ? (
              has("github") && (
                <button
                  type="button"
                  className={styles.method}
                  disabled={!!busy}
                  onClick={() => run("github", () => signIn("github"))}
                >
                  <span className={styles.badge}>GH</span>
                  <span>
                    {busy === "github" ? "Opening GitHub…" : "GitHub"}
                  </span>
                </button>
              )
            ) : (
              <button
                type="button"
                className={styles.method}
                disabled
                data-soon="true"
              >
                <span className={styles.badge}>GH</span>
                <span>GitHub</span>
                <span className={styles.soonTag}>Soon</span>
              </button>
            )}
            <button
              type="button"
              className={styles.method}
              disabled
              data-soon="true"
            >
              <span className={styles.badge}>DC</span>
              <span>Discord</span>
              <span className={styles.soonTag}>Soon</span>
            </button>
            <div
              className={styles.chips}
              aria-label="More sign-in options, coming soon"
            >
              {SOON_PROVIDERS.filter((p) => p.id !== "discord").map((p) => (
                <span
                  key={p.id}
                  className={styles.chip}
                  title={`${p.label}: coming soon`}
                >
                  {p.mark}
                </span>
              ))}
              <span className={styles.chipsNote}>More socials soon</span>
            </div>
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
        <NetworkPulse />
      </aside>
    </div>
  );
};
