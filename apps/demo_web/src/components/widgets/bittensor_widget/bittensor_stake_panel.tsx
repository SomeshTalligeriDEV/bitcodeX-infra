"use client";

import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import {
  type BitcodeXBittensorWallet,
  formatPrice,
  formatUnits,
  type HistoryEntry,
  type StakePosition,
  type SubnetSummary,
  type SwapQuote,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { type FC, useCallback, useEffect, useState } from "react";

import styles from "./bittensor_widget.module.scss";
import { Btn as Button } from "@bitcodex-demo-web/components/bt_demo/btn";

interface Props {
  api: ApiPromise;
  wallet: BitcodeXBittensorWallet;
  address: string;
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;
const pct = (bps: number) => `${(bps / 100).toFixed(2)}%`;

export const BittensorStakePanel: FC<Props> = ({
  api,
  wallet,
  address,
  busy,
  run,
}) => {
  const [subnets, setSubnets] = useState<SubnetSummary[]>([]);
  const [netuid, setNetuid] = useState<number | null>(null);
  const [hotkey, setHotkey] = useState("");
  const [amount, setAmount] = useState("10");
  const [slippage, setSlippage] = useState("1");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [unstakeAmt, setUnstakeAmt] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const slippageBps = Math.round(Number(slippage) * 100);
  const slippageOk =
    Number.isFinite(slippageBps) && slippageBps >= 0 && slippageBps <= 5000;

  // Live subnets; default to the first one and its owner hotkey as validator.
  useEffect(() => {
    wallet.listSubnets().then((list) => {
      setSubnets(list);
      if (list.length > 0) {
        setNetuid((n) => n ?? list[list.length - 1].netuid);
        setHotkey((h) => h || list[list.length - 1].ownerHotkey);
      }
    });
  }, [wallet]);

  // Stakes refresh on every new block (throttled to one read in flight).
  const refreshStakes = useCallback(() => {
    wallet
      .getStakes()
      .then(setStakes)
      .catch(() => undefined);
  }, [wallet]);

  useEffect(() => {
    let inFlight = false;
    let unsub: (() => void) | undefined;
    refreshStakes();
    api.rpc.chain
      .subscribeNewHeads(() => {
        if (inFlight) {
          return;
        }
        inFlight = true;
        wallet
          .getStakes()
          .then(setStakes)
          .catch(() => undefined)
          .finally(() => {
            inFlight = false;
          });
      })
      .then((u) => {
        unsub = u;
      });
    return () => unsub?.();
  }, [api, wallet, refreshStakes]);

  useEffect(() => {
    const load = () => wallet.getHistory().then(setHistory);
    load();
    wallet.on("historyChanged", load);
    return () => wallet.off("historyChanged", load);
  }, [wallet]);

  // Quote from the chain's own swap simulation whenever the inputs change.
  useEffect(() => {
    if (netuid === null || !slippageOk) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      wallet
        .quoteStake({ netuid, amountTao: amount, slippageBps })
        .then((q) => {
          if (!cancelled) {
            setQuote(q);
            setQuoteErr(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setQuote(null);
            setQuoteErr(err instanceof Error ? err.message : String(err));
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [wallet, netuid, amount, slippageBps, slippageOk]);

  const subnet = subnets.find((s) => s.netuid === netuid);

  const stake = () =>
    run("Stake", async () => {
      if (netuid === null) {
        throw new Error("pick a subnet");
      }
      const res = await wallet.stake({
        netuid,
        hotkey: hotkey.trim(),
        amountTao: amount,
        slippageBps,
      });
      refreshStakes();
      return `${amount} TAO on subnet ${netuid} (limit ${formatPrice(res.quote.limitPrice)} TAO/α) tx=${res.txHash}`;
    });

  const unstake = (pos: StakePosition) =>
    run("Unstake", async () => {
      const key = `${pos.netuid}:${pos.hotkey}`;
      const amt = unstakeAmt[key] ?? formatUnits(pos.alpha / BigInt(2));
      const res = await wallet.unstake({
        netuid: pos.netuid,
        hotkey: pos.hotkey,
        amountAlpha: amt,
        slippageBps,
      });
      refreshStakes();
      return `${amt} α from subnet ${pos.netuid} → ≈${formatUnits(res.quote.tao)} TAO tx=${res.txHash}`;
    });

  return (
    <>
      <div className={styles.subsection}>
        <Typography size="sm" weight="semibold" color="primary">
          Stake
        </Typography>
        <div className={styles.row}>
          <select
            className={styles.input}
            value={netuid ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              setNetuid(n);
              const s = subnets.find((x) => x.netuid === n);
              if (s) {
                setHotkey(s.ownerHotkey);
              }
            }}
          >
            {subnets.map((s) => (
              <option key={s.netuid} value={s.netuid}>
                {s.netuid}: {s.name || "subnet"} {s.symbol} ·{" "}
                {formatPrice(s.price)} TAO/{s.symbol || "α"}
              </option>
            ))}
          </select>
        </div>
        <input
          className={styles.input}
          placeholder="Validator hotkey (5…)"
          value={hotkey}
          onChange={(e) => setHotkey(e.target.value)}
        />
        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="TAO"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className={styles.input}
            style={{ maxWidth: 110 }}
            aria-label="Slippage %"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
          />
          <Typography size="xs" color="tertiary">
            % slippage
          </Typography>
          <Button
            size="sm"
            disabled={!quote || !hotkey || !!busy}
            isLoading={busy === "Stake"}
            onClick={stake}
          >
            Stake
          </Button>
        </div>
        {quote && (
          <div className={styles.quote}>
            <span>
              Estimated: {formatUnits(quote.alpha)} {subnet?.symbol || "α"}
            </span>
            <span>Swap fee: {formatUnits(quote.fee)} TAO</span>
            <span>
              Price {formatPrice(quote.price)} → {formatPrice(quote.priceAfter)}{" "}
              TAO/α (impact {pct(quote.priceImpactBps)})
            </span>
            <span>
              Fails if the price after the swap is above{" "}
              {formatPrice(quote.limitPrice)}
            </span>
          </div>
        )}
        {quoteErr && <span className={styles.logErr}>{quoteErr}</span>}
        {!slippageOk && (
          <span className={styles.logErr}>Slippage must be 0–50%</span>
        )}
      </div>

      <div className={styles.subsection}>
        <Typography size="sm" weight="semibold" color="primary">
          Your stake
        </Typography>
        {stakes.length === 0 && (
          <Typography size="xs" color="tertiary">
            No stake yet.
          </Typography>
        )}
        {stakes.map((pos) => {
          const key = `${pos.netuid}:${pos.hotkey}`;
          const sym =
            subnets.find((s) => s.netuid === pos.netuid)?.symbol || "α";
          return (
            <div key={key} className={styles.row}>
              <span className={styles.mono}>
                Subnet {pos.netuid} · {short(pos.hotkey)} ·{" "}
                {formatUnits(pos.alpha)} {sym} (≈{formatUnits(pos.taoValue)}{" "}
                TAO)
              </span>
              <input
                className={styles.input}
                style={{ maxWidth: 120 }}
                placeholder={formatUnits(pos.alpha / BigInt(2))}
                value={unstakeAmt[key] ?? ""}
                onChange={(e) =>
                  setUnstakeAmt((m) => ({ ...m, [key]: e.target.value }))
                }
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={!!busy || !slippageOk}
                isLoading={busy === "Unstake"}
                onClick={() => unstake(pos)}
              >
                Unstake
              </Button>
            </div>
          );
        })}
      </div>

      <div className={styles.subsection}>
        <Typography size="sm" weight="semibold" color="primary">
          History
        </Typography>
        <Typography size="xs" color="tertiary">
          Transactions sent from this browser for {short(address)}.
        </Typography>
        {history.map((h) => (
          <div key={h.txHash} className={styles.historyRow}>
            <span
              className={h.status === "success" ? styles.logOk : styles.logErr}
            >
              {h.status === "success" ? "✓" : "✕"} {h.title}
            </span>
            <span className={styles.mono}>
              {h.rows
                .filter((r) => !r.mono)
                .map((r) => `${r.label}: ${r.value}`)
                .join(" · ")}
              {h.error ? ` · ${h.error}` : ""}
            </span>
            <span className={styles.mono}>
              block {h.blockNumber ?? "?"} · {short(h.txHash)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
