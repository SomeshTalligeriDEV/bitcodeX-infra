"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import {
  type Balances,
  type BitcodeXBittensorWallet,
  type ColdkeySwapDelays,
  coldkeySwapDelays,
  formatTaoAmount,
  formatUnits,
  type HistoryEntry,
  type HotkeyInfo,
  hotkeySwapCost,
  type ProxyState,
  type StakePosition,
  type SubnetSummary,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import styles from "./bittensor_home.module.scss";
import {
  IS_LOCALNET,
  NETWORK_NAME,
  TESTNET_FUNDING_NOTE,
} from "@bitcodex-user-dashboard/bittensor_network";
import { BITCODEX_API_ENDPOINT } from "@bitcodex-user-dashboard/fetch";
import { useSignOut } from "@bitcodex-user-dashboard/hooks/use_sign_out";
import { useTaoPrice } from "@bitcodex-user-dashboard/hooks/use_tao_price";
import { paths } from "@bitcodex-user-dashboard/paths";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;
const RAO = 1e9;

const Section: FC<{ title: string; badge?: string; children: ReactNode }> = ({
  title,
  badge,
  children,
}) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <Typography size="md" weight="semibold" color="primary">
        {title}
      </Typography>
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
    {children}
  </section>
);

interface ChainState {
  balances: Balances;
  stakes: StakePosition[];
  hotkeys: HotkeyInfo[];
  proxies: ProxyState;
}

/** Everything on this page is read from the chain (or the BitcodeX API), every block. */
function useChainState(
  wallet: BitcodeXBittensorWallet | null,
  api: ApiPromise | null,
) {
  const [state, setState] = useState<ChainState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!wallet) {
      return;
    }
    try {
      const [balances, stakes, hotkeys, proxies] = await Promise.all([
        wallet.getBalances(),
        wallet.getStakes(),
        wallet.getHotkeys(),
        wallet.getProxies(),
      ]);
      setState({ balances, stakes, hotkeys, proxies });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [wallet]);

  useEffect(() => {
    if (!api) {
      return;
    }
    let inFlight = false;
    let unsub: (() => void) | undefined;
    refresh();
    api.rpc.chain
      .subscribeNewHeads(() => {
        if (inFlight) {
          return;
        }
        inFlight = true;
        refresh().finally(() => {
          inFlight = false;
        });
      })
      .then((u) => {
        unsub = u;
      });
    return () => unsub?.();
  }, [api, refresh]);

  return { state, error, refresh };
}

export const BittensorHome: FC = () => {
  const { bittensorWallet: wallet, address } = useBitcodeXBittensor();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [apiErr, setApiErr] = useState<string | null>(null);
  const [subnets, setSubnets] = useState<SubnetSummary[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [delays, setDelays] = useState<ColdkeySwapDelays | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<{ ok: boolean; text: string } | null>(null);
  const [showQr, setShowQr] = useState(false);
  const price = useTaoPrice();
  const signOut = useSignOut();
  const { state, error, refresh } = useChainState(wallet, api);

  useEffect(() => {
    if (!wallet) {
      return;
    }
    wallet
      .api()
      .then((a) => {
        setApi(a);
        coldkeySwapDelays(a).then(setDelays);
      })
      .catch((err: unknown) =>
        setApiErr(err instanceof Error ? err.message : String(err)),
      );
    wallet.listSubnets().then(setSubnets);
    const loadHistory = () => wallet.getHistory().then(setHistory);
    loadHistory();
    wallet.on("historyChanged", loadHistory);
    return () => wallet.off("historyChanged", loadHistory);
  }, [wallet]);

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    try {
      setLog({ ok: true, text: `${label}: ${await fn()}` });
      refresh();
    } catch (err) {
      setLog({
        ok: false,
        text: `${label}: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setBusy(null);
    }
  };

  if (apiErr) {
    return (
      <div className={styles.error}>Cannot reach the network: {apiErr}</div>
    );
  }
  if (!wallet || !address || !api) {
    return <div className={styles.muted}>Loading your Bittensor wallet…</div>;
  }

  const staked =
    state?.stakes.reduce((sum, s) => sum + s.taoValue, BigInt(0)) ?? null;
  const total = state && staked !== null ? state.balances.free + staked : null;
  const usd = (rao: bigint | null) =>
    rao === null || !price
      ? null
      : `$${((Number(rao) / RAO) * price.usd).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`;
  const subnetName = (n: number) => {
    const s = subnets.find((x) => x.netuid === n);
    return s ? `${n}${s.name ? ` · ${s.name}` : ""}` : String(n);
  };
  const sym = (n: number) => subnets.find((x) => x.netuid === n)?.symbol || "α";

  return (
    <div className={styles.page}>
      {log && (
        <div className={log.ok ? styles.logOk : styles.logErr}>{log.text}</div>
      )}
      {error && <div className={styles.error}>Chain read failed: {error}</div>}

      <Section title="Balance" badge={NETWORK_NAME}>
        <div className={styles.big}>
          {total === null ? "…" : formatTaoAmount(total)}
        </div>
        <div className={styles.muted}>
          {usd(total) ?? "USD unavailable (price API unreachable)"}
          {price &&
            ` at $${price.usd} per TAO${price.stale ? " (last known price)" : ""}. Reference only: ${NETWORK_NAME.toLowerCase()} TAO is test money.`}
        </div>
        {state && (
          <div className={styles.grid3}>
            <div>
              <div className={styles.label}>Free</div>
              {formatTaoAmount(state.balances.free)}
            </div>
            <div>
              <div className={styles.label}>Staked (value now)</div>
              {staked === null ? "…" : formatTaoAmount(staked)}
            </div>
            <div>
              <div className={styles.label}>Transferable</div>
              {formatTaoAmount(state.balances.transferable)}
            </div>
          </div>
        )}
      </Section>

      <Section title="Deposit">
        <div className={styles.row}>
          <span className={styles.mono}>{address}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQr((v) => !v)}
          >
            {showQr ? "Hide QR" : "QR"}
          </Button>
          {BITCODEX_API_ENDPOINT && IS_LOCALNET && (
            <Button
              variant="secondary"
              size="sm"
              disabled={!!busy}
              isLoading={busy === "Get test TAO"}
              onClick={() =>
                run("Get test TAO", async () => {
                  const res = await fetch(
                    `${BITCODEX_API_ENDPOINT}/faucet/v1/drip`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ address }),
                    },
                  );
                  const body = await res.json();
                  if (!body.success) {
                    throw new Error(body.msg ?? `faucet error ${res.status}`);
                  }
                  return `${formatTaoAmount(BigInt(body.data.amountRao))} tx=${body.data.txHash}`;
                })
              }
            >
              Get test TAO
            </Button>
          )}
        </div>
        {!IS_LOCALNET && (
          <div className={styles.muted}>{TESTNET_FUNDING_NOTE}</div>
        )}
        {showQr && (
          <div className={styles.qr}>
            <QRCodeSVG value={address} size={160} />
          </div>
        )}
      </Section>

      <Section title="Stake by subnet">
        {state?.stakes.length === 0 && (
          <div className={styles.muted}>No stake.</div>
        )}
        {state && state.stakes.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subnet</th>
                <th>Validator hotkey</th>
                <th>Stake</th>
                <th>Value now</th>
              </tr>
            </thead>
            <tbody>
              {state.stakes.map((s) => (
                <tr key={`${s.netuid}:${s.hotkey}`}>
                  <td>{subnetName(s.netuid)}</td>
                  <td className={styles.mono}>{short(s.hotkey)}</td>
                  <td>
                    {formatUnits(s.alpha)} {sym(s.netuid)}
                  </td>
                  <td>
                    {formatTaoAmount(s.taoValue)}
                    {usd(s.taoValue) ? ` (${usd(s.taoValue)})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Hotkeys I own">
        {state?.hotkeys.length === 0 && (
          <div className={styles.muted}>
            None. Hotkeys are created on your miner/validator machine (
            <code>btcli wallet new-hotkey</code>) and registered from an app.
          </div>
        )}
        {state?.hotkeys.map((h) => (
          <div key={h.hotkey} className={styles.row}>
            <span className={styles.mono}>{h.hotkey}</span>
            <span className={styles.muted}>
              {h.subnets.length === 0
                ? "not registered"
                : h.subnets
                    .map((s) => `subnet ${s.netuid} UID ${s.uid}`)
                    .join(", ")}
            </span>
          </div>
        ))}
      </Section>

      <Section title="App and agent permissions">
        <div className={styles.muted}>
          On-chain proxies: each delegate can act for this wallet within its
          permission type. Revoking returns the deposit.
        </div>
        {state?.proxies.delegations.length === 0 && (
          <div className={styles.muted}>No active permissions.</div>
        )}
        {state?.proxies.delegations.map((p) => (
          <div key={`${p.delegate}:${p.proxyType}`} className={styles.row}>
            <span className={styles.mono}>{short(p.delegate)}</span>
            <span className={styles.badge}>{p.proxyType}</span>
            <span className={styles.muted}>delay {p.delay} blocks</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!!busy}
              isLoading={busy === `Revoke ${p.delegate}`}
              onClick={() =>
                run(`Revoke ${p.delegate}`, async () => {
                  const res = await wallet.revokeProxy({
                    delegate: p.delegate,
                    proxyType: p.proxyType,
                    delayBlocks: p.delay,
                  });
                  return `${p.proxyType} for ${short(p.delegate)} removed tx=${res.txHash}`;
                })
              }
            >
              Revoke
            </Button>
          </div>
        ))}
        {state && state.proxies.deposit > BigInt(0) && (
          <div className={styles.muted}>
            Reserved deposit: {formatTaoAmount(state.proxies.deposit)}
          </div>
        )}
      </Section>

      <Section title="History">
        <div className={styles.muted}>
          Transactions sent from this dashboard (each app keeps its own list).
        </div>
        {history.length === 0 && <div className={styles.muted}>None yet.</div>}
        {history.map((h) => (
          <div key={h.txHash} className={styles.row}>
            <span
              className={
                h.status === "success" ? styles.okText : styles.errText
              }
            >
              {h.status === "success" ? "✓" : "✕"} {h.title}
            </span>
            <span className={styles.mono}>
              block {h.blockNumber ?? "?"} · {short(h.txHash)}
              {h.error ? ` · ${h.error}` : ""}
            </span>
          </div>
        ))}
      </Section>

      <HotkeySwapPreview
        api={api}
        wallet={wallet}
        hotkeys={state?.hotkeys ?? []}
        busy={busy}
        run={run}
      />

      <EvmPreview wallet={wallet} busy={busy} run={run} />

      <Section title="Coldkey swap" badge="Preview">
        <div className={styles.muted}>
          Moves ALL TAO, stake and subnets of this coldkey to a new coldkey, in
          two steps:
        </div>
        <ol className={styles.steps}>
          <li>
            Announce: <code>announceColdkeySwap(hash of new coldkey)</code>.
          </li>
          <li>
            Wait {delays ? `${delays.announcementDelay} blocks` : "…"} (this
            network's delay). The announcement can be disputed in that time.
          </li>
          <li>
            Swap: <code>swapColdkeyAnnounced(new coldkey)</code>.
          </li>
        </ol>
        <div className={styles.muted}>
          Not executed from this screen. Export your key first if you plan to
          move it.
        </div>
      </Section>

      <Section title="Security">
        <div className={styles.row}>
          <Link href={paths.export_private_key}>
            <Button variant="secondary" size="sm">
              Export key
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </Section>
    </div>
  );
};

const HotkeySwapPreview: FC<{
  api: ApiPromise;
  wallet: BitcodeXBittensorWallet;
  hotkeys: HotkeyInfo[];
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}> = ({ api, wallet, hotkeys, busy, run }) => {
  const [oldHk, setOldHk] = useState("");
  const [newHk, setNewHk] = useState("");
  const [scope, setScope] = useState<string>("all");
  const selected = hotkeys.find((h) => h.hotkey === oldHk);
  const netuid = scope === "all" ? null : Number(scope);
  const cost = hotkeySwapCost(api, netuid);
  const localnet = wallet.state.chainId === "bittensor:localnet";

  return (
    <Section title="Hotkey swap" badge="Preview">
      <div className={styles.muted}>
        Replace a hotkey; its registrations and stake move to the new one. Runs
        on localnet only.
      </div>
      <div className={styles.row}>
        <select
          className={styles.input}
          value={oldHk}
          onChange={(e) => setOldHk(e.target.value)}
        >
          <option value="">Old hotkey…</option>
          {hotkeys.map((h) => (
            <option key={h.hotkey} value={h.hotkey}>
              {short(h.hotkey)}
            </option>
          ))}
        </select>
        <select
          className={styles.input}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">All subnets</option>
          {selected?.subnets.map((s) => (
            <option key={s.netuid} value={String(s.netuid)}>
              Subnet {s.netuid} only
            </option>
          ))}
        </select>
      </div>
      <input
        className={styles.input}
        placeholder="New hotkey address (5…)"
        value={newHk}
        onChange={(e) => setNewHk(e.target.value)}
      />
      <div className={styles.row}>
        <span className={styles.muted}>
          Cost: {formatTaoAmount(cost)} + network fee
        </span>
        <Button
          size="sm"
          disabled={!localnet || !oldHk || !newHk || !!busy}
          isLoading={busy === "Swap hotkey"}
          onClick={() =>
            run("Swap hotkey", async () => {
              const res = await wallet.swapHotkey({
                hotkey: oldHk,
                newHotkey: newHk.trim(),
                netuid,
              });
              return `${short(oldHk)} → ${short(newHk.trim())} cost ${formatTaoAmount(res.cost)} tx=${res.txHash}`;
            })
          }
        >
          Swap hotkey
        </Button>
      </div>
    </Section>
  );
};

/**
 * Subtensor EVM (X13, Preview): real address derivation and balance; funding the EVM
 * address is a real Subtensor transfer to its mirror. Signing from the EVM side is not
 * wired yet, so there is no "send from EVM" button.
 */
const EvmPreview: FC<{
  wallet: BitcodeXBittensorWallet;
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}> = ({ wallet, busy, run }) => {
  const [acct, setAcct] = useState<{
    evmAddress: string;
    mirror: string;
    balances: Balances;
  } | null>(null);
  const [amount, setAmount] = useState("1");
  const load = useCallback(() => {
    wallet
      .getEvmAccount()
      .then(setAcct)
      .catch(() => setAcct(null));
  }, [wallet]);
  useEffect(() => {
    load();
  }, [load]);
  if (!acct) {
    return null;
  }
  return (
    <Section title="Subtensor EVM" badge="Preview">
      <div className={styles.muted}>
        Your EVM address (from your BitcodeX secp256k1 key) and the Subtensor
        account that holds its TAO. Sending from the EVM side is coming soon.
      </div>
      <div className={styles.label}>EVM address</div>
      <span className={styles.mono}>{acct.evmAddress}</span>
      <div className={styles.label}>Subtensor mirror</div>
      <span className={styles.mono}>{acct.mirror}</span>
      <div>Balance: {formatTaoAmount(acct.balances.free)}</div>
      <div className={styles.row}>
        <input
          className={styles.input}
          style={{ maxWidth: 120 }}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="TAO"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!!busy}
          isLoading={busy === "Fund EVM"}
          onClick={() =>
            run("Fund EVM", async () => {
              const res = await wallet.sendTao(acct.mirror, amount);
              load();
              return `${amount} TAO to your EVM address (via its mirror) tx=${res.txHash}`;
            })
          }
        >
          Send TAO to my EVM address
        </Button>
      </div>
    </Section>
  );
};
