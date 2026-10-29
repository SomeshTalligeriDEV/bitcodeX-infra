"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type {
  BitcodeXBittensorWallet,
  ProxyDelegation,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { type FC, useCallback, useEffect, useState } from "react";

import styles from "./bittensor_widget.module.scss";

interface Props {
  api: ApiPromise;
  wallet: BitcodeXBittensorWallet;
  address: string;
  busy: string | null;
  run: (label: string, fn: () => Promise<string>) => Promise<void>;
}

/**
 * Privy "signers + policies" on Bittensor: the user grants a demo agent an on-chain
 * proxy; the agent (server route /api/agent, its own key) then stakes for the user
 * with no user popup. The chain enforces the permission type.
 */
export const BittensorAgentPanel: FC<Props> = ({
  api,
  wallet,
  address,
  busy,
  run,
}) => {
  const [agent, setAgent] = useState<string | null>(null);
  const [agentErr, setAgentErr] = useState<string | null>(null);
  const [grants, setGrants] = useState<ProxyDelegation[]>([]);
  const [proxyType, setProxyType] = useState("Staking");
  const [amount, setAmount] = useState("1");
  const [dailyLimit, setDailyLimit] = useState("");
  const [target, setTarget] = useState<{
    netuid: number;
    hotkey: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((b) =>
        b.success ? setAgent(b.data.agentAddress) : setAgentErr(b.msg),
      )
      .catch((e: unknown) => setAgentErr(String(e)));
    wallet.listSubnets().then((list) => {
      const s = list[list.length - 1];
      if (s) {
        setTarget({ netuid: s.netuid, hotkey: s.ownerHotkey });
      }
    });
  }, [wallet]);

  const refresh = useCallback(() => {
    if (!agent) {
      return;
    }
    wallet
      .getProxies()
      .then((p) => setGrants(p.delegations.filter((d) => d.delegate === agent)))
      .catch(() => undefined);
  }, [wallet, agent]);

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

  if (agentErr) {
    return (
      <div className={styles.subsection}>
        <Typography size="sm" weight="semibold" color="primary">
          Agent permissions
        </Typography>
        <span className={styles.logErr}>{agentErr}</span>
      </div>
    );
  }

  const hasStaking = grants.some((g) => g.proxyType === "Staking");

  return (
    <div className={styles.subsection}>
      <Typography size="sm" weight="semibold" color="primary">
        Agent permissions
      </Typography>
      <Typography size="xs" color="tertiary">
        Demo agent <span className={styles.mono}>{agent ?? "…"}</span> has its
        own key and can act for you only within a permission you grant on chain.
      </Typography>

      <div className={styles.row}>
        <select
          className={styles.input}
          style={{ maxWidth: 180 }}
          value={proxyType}
          onChange={(e) => setProxyType(e.target.value)}
        >
          <option value="Staking">Staking</option>
          <option value="SmallTransfer">SmallTransfer (&lt; 0.5 TAO)</option>
        </select>
        <Button
          size="sm"
          disabled={!agent || !!busy}
          isLoading={busy === "Grant permission"}
          onClick={() =>
            run("Grant permission", async () => {
              const res = await wallet.grantProxy({
                delegate: agent as string,
                proxyType,
              });
              return `${proxyType} granted to the agent tx=${res.txHash}`;
            })
          }
        >
          Grant
        </Button>
      </div>

      {grants.length === 0 && (
        <Typography size="xs" color="tertiary">
          The agent has no permission from you.
        </Typography>
      )}
      {grants.map((g) => (
        <div key={g.proxyType} className={styles.row}>
          <span className={styles.badge}>{g.proxyType}</span>
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
                return `${g.proxyType} revoked tx=${res.txHash}`;
              })
            }
          >
            Revoke
          </Button>
        </div>
      ))}

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
          disabled={!target || !!busy}
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
                  dailyLimitTao: dailyLimit || undefined,
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
            (fails until you grant Staking)
          </Typography>
        )}
      </div>

      <div className={styles.row}>
        <span className={styles.badge}>Preview</span>
        <input
          className={styles.input}
          style={{ maxWidth: 140 }}
          placeholder="Daily limit TAO"
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
        />
        <Typography size="xs" color="tertiary">
          Off-chain policy: enforced by the agent's server, not by the chain.
        </Typography>
      </div>
    </div>
  );
};
