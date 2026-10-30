"use client";

import { getApi, listSubnets, NETWORKS } from "@bitcodex/sdk-bittensor";
import { type FC, useEffect, useRef, useState } from "react";

import styles from "./network_pulse.module.scss";
import { CHAIN_ID, NETWORK_NAME } from "@bitcodex-demo-web/bittensor_network";

interface Pulse {
  block: number;
  subnets: number | null;
  spec: number | null;
  chain: string | null;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Live view of the network this demo runs on: the current block (a real subscription
 * to new heads), the subnet count and the runtime version, all read from the chain.
 * Nothing here is a sample: if the chain cannot be reached it says so.
 */
export const NetworkPulse: FC = () => {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [since, setSince] = useState(0);
  const lastBlockAt = useRef<number>(Date.now());

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const res = await getApi(CHAIN_ID);
      if (!res.success) {
        setError(res.err);
        return;
      }
      const api = res.data;
      const chain = (await api.rpc.system.chain()).toString();
      const spec = api.runtimeVersion.specVersion.toNumber();

      const countSubnets = async (): Promise<number | null> => {
        try {
          const total = api.query.subtensorModule?.totalNetworks;
          if (total) {
            return Number((await total()).toString());
          }
          return (await listSubnets(api)).length;
        } catch {
          return null;
        }
      };

      let subnets = await countSubnets();
      unsub = await api.rpc.chain.subscribeNewHeads((head) => {
        if (cancelled) {
          return;
        }
        lastBlockAt.current = Date.now();
        setSince(0);
        setTick((t) => t + 1);
        setPulse({
          block: head.number.toNumber(),
          subnets,
          spec,
          chain,
        });
        // Refresh the subnet count now and then (registrations change it).
        if (head.number.toNumber() % 50 === 0) {
          countSubnets().then((n) => {
            subnets = n;
          });
        }
      });
    })().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : String(e)),
    );

    const timer = setInterval(
      () => setSince(Math.floor((Date.now() - lastBlockAt.current) / 1000)),
      1000,
    );
    return () => {
      cancelled = true;
      clearInterval(timer);
      unsub?.();
    };
  }, []);

  const rpc = NETWORKS[CHAIN_ID]?.rpcUrl ?? "";

  return (
    <section className={styles.card} aria-live="polite">
      <div className={styles.head}>
        <h3>Live from the chain</h3>
        <span className={styles.live} data-ok={!error}>
          <span key={tick} className={styles.dot} />
          {error ? "offline" : pulse ? "live" : "connecting"}
        </span>
      </div>

      {error ? (
        <p className={styles.err}>
          Could not reach {NETWORK_NAME}. The page needs a live connection to
          show real numbers. ({error})
        </p>
      ) : (
        <dl className={styles.stats}>
          <div>
            <dt>Block</dt>
            <dd>{pulse ? `#${fmt(pulse.block)}` : "…"}</dd>
            <small>{pulse ? `${since}s ago` : "waiting for a block"}</small>
          </div>
          <div>
            <dt>Subnets</dt>
            <dd>{pulse?.subnets != null ? fmt(pulse.subnets) : "…"}</dd>
            <small>registered on chain</small>
          </div>
          <div>
            <dt>Runtime</dt>
            <dd>{pulse?.spec != null ? `spec ${pulse.spec}` : "…"}</dd>
            <small>{pulse?.chain ?? NETWORK_NAME}</small>
          </div>
        </dl>
      )}
      <p className={styles.foot}>
        Read straight from{" "}
        <code>{rpc.replace(/^wss?:\/\//, "").replace(/:443$/, "")}</code>.
        Signing in creates a wallet on this same network.
      </p>
    </section>
  );
};
