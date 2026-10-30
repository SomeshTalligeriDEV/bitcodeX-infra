"use client";

import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import {
  type BitcodeXBittensorWallet,
  chainProxyTypes,
  type ProxyDelegation,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { checkAddress } from "@polkadot/util-crypto";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";

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
// Offered first; the full list comes from the chain's own metadata.
const COMMON = ["Staking", "SmallTransfer"];

/**
 * App and agent permissions (Privy's "signers and policies", Bittensor style): the user
 * lets another account act for them through an on-chain proxy. The chain enforces the
 * permission type and the user can revoke it. Works on testnet and the local chain.
 * The built-in demo agent (a public dev key) exists only on the local chain, so that
 * part appears only when the server runs it.
 */
export const BittensorAgentPanel: FC<Props> = ({
  api,
  wallet,
  address,
  busy,
  run,
}) => {
  const [delegate, setDelegate] = useState("");
  const [proxyType, setProxyType] = useState("Staking");
  const [grants, setGrants] = useState<ProxyDelegation[]>([]);
  const [demoAgent, setDemoAgent] = useState<string | null>(null);
  const [amount, setAmount] = useState("1");
  const [target, setTarget] = useState<{
    netuid: number;
    hotkey: string;
  } | null>(null);

  const types = useMemo(() => {
    const res = chainProxyTypes(api);
    const all = res.success ? res.data : COMMON;
    return [
      ...COMMON.filter((t) => all.includes(t)),
      ...all.filter((t) => !COMMON.includes(t)),
    ];
  }, [api]);

  // Demo agent: answers only on the local chain. A 404 just means "not available here".
  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((b) => b.success && setDemoAgent(b.data.agentAddress))
      .catch(() => undefined);
    wallet.listSubnets().then((list) => {
      const s = list[list.length - 1];
      if (s) {
        setTarget({ netuid: s.netuid, hotkey: s.ownerHotkey });
      }
    });
  }, [wallet]);

  const refresh = useCallback(() => {
    wallet
      .getProxies()
      .then((p) => setGrants(p.delegations))
      .catch(() => undefined);
  }, [wallet]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    refresh();
    api.rpc.chain
      .subscribeNewHeads(() => refresh())
      .then((u) => {
        unsub = u;
      });
    return () => unsub?.();
  }, [api, refresh]);

  const target58 = delegate.trim();
  const validDelegate = checkAddress(target58, 42)[0] && target58 !== address;
  const demoGrants = grants.filter((g) => g.delegate === demoAgent);
  const hasStaking = demoGrants.some((g) => g.proxyType === "Staking");

  return (
    <section className={styles.subsection}>
      <Typography size="md" weight="semibold" color="primary">
        App &amp; agent permissions
      </Typography>
      <Typography size="xs" color="tertiary">
        Let another account (an app, a bot or an AI agent) act for you without
        handing over your key. You choose what it may do, the chain enforces it,
        and you can take it back at any time.
      </Typography>

      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Agent address (5…)"
          value={delegate}
          onChange={(e) => setDelegate(e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <select
          className={styles.input}
          value={proxyType}
          onChange={(e) => setProxyType(e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "SmallTransfer" ? "SmallTransfer (under 0.5 TAO)" : t}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!validDelegate || !!busy}
          isLoading={busy === "Grant permission"}
          onClick={() =>
            run("Grant permission", async () => {
              const res = await wallet.grantProxy({
                delegate: target58,
                proxyType,
              });
              setDelegate("");
              return `${proxyType} granted to ${short(target58)} tx=${res.txHash}`;
            })
          }
        >
          Grant
        </Button>
      </div>

      <Typography size="xs" weight="semibold" color="secondary">
        Permissions you have granted
      </Typography>
      {grants.length === 0 && (
        <Typography size="xs" color="tertiary">
          None yet. Paste an address above and grant one.
        </Typography>
      )}
      {grants.map((g) => (
        <div key={`${g.delegate}:${g.proxyType}`} className={styles.row}>
          <span className={styles.badge}>{g.proxyType}</span>
          <span className={styles.mono}>{short(g.delegate)}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!!busy}
            isLoading={busy === `Revoke ${g.proxyType}`}
            onClick={() =>
              run(`Revoke ${g.proxyType}`, async () => {
                const res = await wallet.revokeProxy({
                  delegate: g.delegate,
                  proxyType: g.proxyType,
                  delayBlocks: g.delay,
                });
                return `${g.proxyType} revoked from ${short(g.delegate)} tx=${res.txHash}`;
              })
            }
          >
            Revoke
          </Button>
        </div>
      ))}

      {demoAgent && (
        <>
          <Typography size="xs" weight="semibold" color="secondary">
            Try it with the demo agent (local chain only)
          </Typography>
          <Typography size="xs" color="tertiary">
            A built-in test agent with a public dev key, available only on the
            local chain.{" "}
            <button
              type="button"
              className={styles.codeToggle}
              onClick={() => setDelegate(demoAgent)}
            >
              Use its address
            </button>
          </Typography>
          <div className={styles.row}>
            <input
              className={styles.input}
              style={{ maxWidth: 90 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="TAO"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={!target || !!busy || !hasStaking}
              isLoading={busy === "Agent stakes"}
              onClick={() =>
                run("Agent stakes", async () => {
                  const res = await fetch("/api/agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user: address,
                      netuid: target?.netuid,
                      hotkey: target?.hotkey,
                      amountTao: amount,
                    }),
                  });
                  const b = await res.json();
                  if (!b.success) {
                    throw new Error(b.msg);
                  }
                  return `agent staked ${amount} TAO for you on subnet ${target?.netuid} (no popup) tx=${b.data.txHash}`;
                })
              }
            >
              Ask agent to stake {amount} TAO
            </Button>
            {!hasStaking && (
              <Typography size="xs" color="tertiary">
                Grant it Staking first.
              </Typography>
            )}
          </div>
        </>
      )}
    </section>
  );
};
