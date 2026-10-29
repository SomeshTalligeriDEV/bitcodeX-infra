"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import {
  type BitcodeXBittensorWallet,
  formatTaoAmount,
  type HotkeyInfo,
  type SubnetSummary,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { checkAddress } from "@polkadot/util-crypto";
import { type FC, useEffect, useState } from "react";

import styles from "./bittensor_widget.module.scss";

interface Props {
  api: ApiPromise;
  wallet: BitcodeXBittensorWallet;
  address: string;
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}

// Labels and not-yet-registered hotkeys are a local address book; ownership, subnets
// and UIDs always come from the chain.
const bookKey = (coldkey: string) => `bitcodex:demo:hotkeys:${coldkey}`;

function loadBook(coldkey: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(bookKey(coldkey)) ?? "{}");
  } catch {
    return {};
  }
}

function saveBook(coldkey: string, book: Record<string, string>) {
  try {
    localStorage.setItem(bookKey(coldkey), JSON.stringify(book));
  } catch {
    // labels are a convenience; ignore storage errors
  }
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;

export const BittensorHotkeysPanel: FC<Props> = ({
  api,
  wallet,
  address,
  busy,
  run,
}) => {
  const [book, setBook] = useState<Record<string, string>>({});
  const [infos, setInfos] = useState<HotkeyInfo[]>([]);
  const [newHotkey, setNewHotkey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [subnets, setSubnets] = useState<SubnetSummary[]>([]);
  const [regHotkey, setRegHotkey] = useState("");
  const [regNetuid, setRegNetuid] = useState<number | null>(null);
  const [cost, setCost] = useState<bigint | null>(null);
  const [fee, setFee] = useState<bigint | null>(null);

  useEffect(() => {
    setBook(loadBook(address));
    wallet.listSubnets().then((list) => {
      setSubnets(list);
      setRegNetuid((n) => n ?? list[list.length - 1]?.netuid ?? null);
    });
  }, [wallet, address]);

  // Chain state for owned + address-book hotkeys, refreshed every block.
  useEffect(() => {
    let inFlight = false;
    let unsub: (() => void) | undefined;
    const refresh = async () => {
      if (inFlight) {
        return;
      }
      inFlight = true;
      try {
        const owned = await wallet.getHotkeys();
        const extra = Object.keys(book).filter(
          (h) => !owned.some((o) => o.hotkey === h),
        );
        const more = await Promise.all(
          extra.map((h) => wallet.getHotkeyInfo(h)),
        );
        setInfos([...owned, ...more]);
      } catch {
        // keep the last good state
      } finally {
        inFlight = false;
      }
    };
    refresh();
    api.rpc.chain
      .subscribeNewHeads(() => {
        refresh();
      })
      .then((u) => {
        unsub = u;
      });
    return () => unsub?.();
  }, [api, wallet, book]);

  // Registration cost for the next block, recomputed every block; tx fee from paymentInfo.
  useEffect(() => {
    if (regNetuid === null) {
      return;
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    api.rpc.chain
      .subscribeNewHeads(() => {
        wallet
          .quoteRegistration(regNetuid)
          .then(async (q) => {
            if (cancelled) {
              return;
            }
            setCost(q.cost);
            const hk = checkAddress(regHotkey.trim(), 42)[0]
              ? regHotkey.trim()
              : address;
            const info = await api.tx.subtensorModule
              .registerLimit(regNetuid, hk, q.cost)
              .paymentInfo(address);
            if (!cancelled) {
              setFee(info.partialFee.toBigInt());
            }
          })
          .catch(() => undefined);
      })
      .then((u) => {
        unsub = u;
      });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [api, wallet, address, regNetuid, regHotkey]);

  const addToBook = () => {
    const hk = newHotkey.trim();
    const [ok, why] = checkAddress(hk, 42);
    if (!ok) {
      run("Add hotkey", async () => {
        throw new Error(`not a Bittensor address: ${why ?? hk}`);
      });
      return;
    }
    if (hk === address) {
      run("Add hotkey", async () => {
        throw new Error("that is your coldkey, not a hotkey");
      });
      return;
    }
    const next = { ...book, [hk]: newLabel.trim() || short(hk) };
    setBook(next);
    saveBook(address, next);
    setNewHotkey("");
    setNewLabel("");
    setRegHotkey(hk);
  };

  const register = () =>
    run("Register", async () => {
      if (regNetuid === null) {
        throw new Error("pick a subnet");
      }
      const res = await wallet.registerHotkey({
        netuid: regNetuid,
        hotkey: regHotkey.trim(),
      });
      return `hotkey ${short(regHotkey.trim())} on subnet ${regNetuid}: charged ${formatTaoAmount(res.charged)} (shown max ${formatTaoAmount(res.quotedMax)}) tx=${res.txHash}`;
    });

  return (
    <div className={styles.subsection}>
      <Typography size="sm" weight="semibold" color="primary">
        Hotkeys
      </Typography>
      <Typography size="xs" color="tertiary">
        Create hotkeys on your miner or validator machine, never here:{" "}
        <code>btcli wallet new-hotkey -w my_coldkey -H my_hotkey</code>, then{" "}
        <code>btcli wallet show</code> to copy its address.
      </Typography>

      {infos.length === 0 && (
        <Typography size="xs" color="tertiary">
          No hotkeys yet.
        </Typography>
      )}
      {infos.map((h) => (
        <div key={h.hotkey} className={styles.historyRow}>
          <span className={styles.mono}>
            {book[h.hotkey] ? `${book[h.hotkey]} · ` : ""}
            {h.hotkey}
          </span>
          <span className={styles.mono}>
            {h.owner === null
              ? "not owned yet"
              : h.owner === address
                ? "owned by this wallet"
                : `owned by ${short(h.owner)}`}
            {" · "}
            {h.subnets.length === 0
              ? "not registered"
              : h.subnets
                  .map((s) => `subnet ${s.netuid} UID ${s.uid}`)
                  .join(", ")}
          </span>
        </div>
      ))}

      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Hotkey address (5…)"
          value={newHotkey}
          onChange={(e) => setNewHotkey(e.target.value)}
        />
        <input
          className={styles.input}
          style={{ maxWidth: 140 }}
          placeholder="Label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!newHotkey}
          onClick={addToBook}
        >
          Add
        </Button>
      </div>

      <Typography size="xs" weight="semibold" color="secondary">
        Register a hotkey on a subnet
      </Typography>
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Hotkey address (5…)"
          value={regHotkey}
          onChange={(e) => setRegHotkey(e.target.value)}
        />
        <select
          className={styles.input}
          style={{ maxWidth: 200 }}
          value={regNetuid ?? ""}
          onChange={(e) => setRegNetuid(Number(e.target.value))}
        >
          {subnets.map((s) => (
            <option key={s.netuid} value={s.netuid}>
              {s.netuid}: {s.name || "subnet"}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!regHotkey || cost === null || !!busy}
          isLoading={busy === "Register"}
          onClick={register}
        >
          Register
        </Button>
      </div>
      {cost !== null && (
        <div className={styles.quote}>
          <span>
            Cost if included in the next block: {formatTaoAmount(cost)} (drops
            each block; never charged more)
          </span>
          <span>Network fee: {fee === null ? "…" : formatTaoAmount(fee)}</span>
        </div>
      )}
    </div>
  );
};
