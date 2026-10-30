"use client";

import { type FC, useCallback, useEffect, useState } from "react";

import styles from "./apps_manager.module.scss";
import {
  type AppUser,
  type AppView,
  requestAppUsers,
  requestCreateApp,
  requestListApps,
  requestRotateSecret,
  requestUpdateApp,
} from "@bitcodex-ct-dashboard/fetch/apps";
import { useAppState } from "@bitcodex-ct-dashboard/state";

const METHODS = ["google", "github", "x", "telegram", "discord"] as const;
const METHOD_LABEL: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  x: "X",
  telegram: "Telegram",
  discord: "Discord",
};

/** Privy-style app settings: keys, allowed origins, login methods, appearance. */
export const AppsManager: FC = () => {
  const token = useAppState((s) => s.token);
  const [apps, setApps] = useState<AppView[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secretOnce, setSecretOnce] = useState<{
    apiKey?: string;
    secret: string;
  } | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newOrigin, setNewOrigin] = useState("");

  const reload = useCallback(async () => {
    if (!token) {
      return;
    }
    const res = await requestListApps(token);
    if (res.success) {
      setApps(res.data);
      setSelected((s) => s ?? res.data[0]?.app_id ?? null);
    } else {
      setError(res.msg);
    }
  }, [token]);

  useEffect(() => {
    reload();
  }, [reload]);

  const app = apps.find((a) => a.app_id === selected) ?? null;

  const create = async () => {
    if (!token || !newLabel.trim()) {
      return;
    }
    const origins = newOrigin.trim() ? [newOrigin.trim()] : [];
    const res = await requestCreateApp(token, newLabel.trim(), origins);
    if (!res.success) {
      setError(res.msg);
      return;
    }
    setError(null);
    setNewLabel("");
    setNewOrigin("");
    setSecretOnce({ apiKey: res.data.api_key, secret: res.data.app_secret });
    setSelected(res.data.app.app_id);
    reload();
  };

  const save = async (update: Parameters<typeof requestUpdateApp>[2]) => {
    if (!token || !app) {
      return;
    }
    const res = await requestUpdateApp(token, app.app_id, update);
    if (!res.success) {
      setError(res.msg);
      return;
    }
    setError(null);
    setNotice("Saved. The login modal picks this up within a minute.");
    setApps((list) =>
      list.map((a) => (a.app_id === app.app_id ? res.data : a)),
    );
  };

  const rotate = async () => {
    if (!token || !app) {
      return;
    }
    const res = await requestRotateSecret(token, app.app_id);
    if (res.success) {
      setSecretOnce({ secret: res.data.app_secret });
      reload();
    } else {
      setError(res.msg);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.h2}>Apps</h2>
      {error && <div className={styles.error}>{error}</div>}
      {notice && <div className={styles.notice}>{notice}</div>}

      {secretOnce && (
        <div className={styles.secretBox}>
          <strong>Copy these now. The secret is shown only once.</strong>
          {secretOnce.apiKey && (
            <div>
              API key (public, used in the browser):{" "}
              <code className={styles.mono}>{secretOnce.apiKey}</code>
            </div>
          )}
          <div>
            App secret (server only, never in a browser):{" "}
            <code className={styles.mono}>{secretOnce.secret}</code>
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={() => setSecretOnce(null)}
          >
            I saved it
          </button>
        </div>
      )}

      <div className={styles.row}>
        <select
          className={styles.input}
          value={selected ?? ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {apps.map((a) => (
            <option key={a.app_id} value={a.app_id}>
              {a.label}
            </option>
          ))}
        </select>
        <input
          className={styles.input}
          placeholder="New app name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Origin, e.g. http://localhost:3210"
          value={newOrigin}
          onChange={(e) => setNewOrigin(e.target.value)}
        />
        <button type="button" className={styles.button} onClick={create}>
          Create app
        </button>
      </div>

      {app && (
        <AppSettings
          key={app.app_id}
          app={app}
          token={token}
          onSave={save}
          onRotate={rotate}
        />
      )}
    </div>
  );
};

const AppSettings: FC<{
  app: AppView;
  token: string | null;
  onSave: (u: Parameters<typeof requestUpdateApp>[2]) => Promise<void>;
  onRotate: () => Promise<void>;
}> = ({ app, token, onSave, onRotate }) => {
  const [origins, setOrigins] = useState(app.allowed_origins.join("\n"));
  const [methods, setMethods] = useState<string[]>(app.login_methods);
  const [accent, setAccent] = useState(app.accent_color ?? "");
  const [mode, setMode] = useState(app.theme_mode);
  const [logo, setLogo] = useState(app.logo_url ?? "");
  const [network, setNetwork] = useState(app.network);
  const [users, setUsers] = useState<AppUser[] | null>(null);

  useEffect(() => {
    if (token) {
      requestAppUsers(token, app.app_id).then((r) =>
        setUsers(r.success ? r.data : []),
      );
    }
  }, [token, app.app_id]);

  const toggle = (m: string) =>
    setMethods((list) =>
      list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
    );
  const move = (m: string, dir: -1 | 1) =>
    setMethods((list) => {
      const i = list.indexOf(m);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) {
        return list;
      }
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className={styles.card}>
      <section className={styles.section}>
        <h3 className={styles.h3}>Keys</h3>
        <div>
          App ID: <code className={styles.mono}>{app.app_id}</code>
        </div>
        {app.api_keys.map((k) => (
          <div key={k.key_id}>
            API key: <code className={styles.mono}>{k.api_key}</code>
            {!k.is_active && " (inactive)"}
          </div>
        ))}
        <div className={styles.row}>
          <span>App secret: {app.has_secret ? "set (hidden)" : "not set"}</span>
          <button type="button" className={styles.button} onClick={onRotate}>
            {app.has_secret ? "Rotate secret" : "Create secret"}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.h3}>Allowed origins</h3>
        <p className={styles.muted}>
          One per line. Only these sites can open the BitcodeX modal and request
          signatures with this app's key. Empty allows any site.
        </p>
        <textarea
          className={styles.textarea}
          rows={4}
          value={origins}
          onChange={(e) => setOrigins(e.target.value)}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() =>
            onSave({
              allowed_origins: origins
                .split("\n")
                .map((o) => o.trim())
                .filter(Boolean),
            })
          }
        >
          Save origins
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.h3}>Login methods</h3>
        <p className={styles.muted}>
          Shown in the login modal in this order. Email login is off until a
          self-hosted mail server is configured.
        </p>
        {METHODS.map((m) => (
          <div key={m} className={styles.row}>
            <label>
              <input
                type="checkbox"
                checked={methods.includes(m)}
                onChange={() => toggle(m)}
              />{" "}
              {METHOD_LABEL[m]}
            </label>
            {methods.includes(m) && (
              <>
                <button
                  type="button"
                  className={styles.small}
                  onClick={() => move(m, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.small}
                  onClick={() => move(m, 1)}
                >
                  ↓
                </button>
                <span className={styles.muted}>#{methods.indexOf(m) + 1}</span>
              </>
            )}
          </div>
        ))}
        <button
          type="button"
          className={styles.button}
          disabled={methods.length === 0}
          onClick={() => onSave({ login_methods: methods })}
        >
          Save login methods
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.h3}>Appearance</h3>
        <div className={styles.row}>
          <label>
            Accent colour{" "}
            <input
              className={styles.input}
              placeholder="#6E56CF"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
          </label>
          <label>
            Theme{" "}
            <select
              className={styles.input}
              value={mode}
              onChange={(e) => setMode(e.target.value as AppView["theme_mode"])}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <input
          className={styles.input}
          placeholder="Logo URL (https://…)"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() =>
            onSave({
              accent_color: accent.trim() || null,
              theme_mode: mode,
              logo_url: logo.trim() || null,
            })
          }
        >
          Save appearance
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.h3}>Network</h3>
        <select
          className={styles.input}
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
        >
          <option value="bittensor:localnet">Localnet</option>
          <option value="bittensor:testnet">Testnet</option>
          <option value="bittensor:mainnet" disabled>
            Mainnet (disabled until an external security audit)
          </option>
        </select>
        <button
          type="button"
          className={styles.button}
          onClick={() => onSave({ network })}
        >
          Save network
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.h3}>
          Users <span className={styles.badge}>Preview</span>
        </h3>
        <p className={styles.muted}>
          Everyone who signed in through this account's apps (not yet split per
          app).
        </p>
        {users === null && <div className={styles.muted}>Loading…</div>}
        {users?.length === 0 && (
          <div className={styles.muted}>No users yet.</div>
        )}
        {users && users.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Login</th>
                <th>Coldkey address</th>
                <th>First seen</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.email ?? u.user_id.slice(0, 8)}</td>
                  <td>{u.auth_type ?? "-"}</td>
                  <td className={styles.mono}>{u.address ?? "-"}</td>
                  <td>{new Date(u.connected_at).toLocaleString()}</td>
                  <td>{new Date(u.last_seen_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
