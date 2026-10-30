"use client";

import { type FC, useState } from "react";

import styles from "./testnet_funding.module.scss";
import { FAUCET_URL } from "@bitcodex-demo-web/components/bt_demo/custom";

/**
 * Testnet TAO has no automatic public faucet: the official docs list none. The card
 * says so, lets the user copy their address, and links a faucet website when the
 * operator configured one (NEXT_PUBLIC_TESTNET_FAUCET_URL). The balance above updates
 * by itself once TAO arrives.
 */
export const TestnetFunding: FC<{
  address: string;
  balance: string | null;
}> = ({ address, balance }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // the address is also shown above to copy by hand
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h3>Fund this wallet with testnet TAO</h3>
        <span className={styles.badge}>Testnet</span>
      </div>
      <ol className={styles.steps}>
        <li>
          <span className={styles.n}>1</span>
          <div>
            <strong>Copy your address</strong>
            <code className={styles.addr}>{address}</code>
            <button type="button" className={styles.btn} onClick={copy}>
              {copied ? "Copied ✓" : "Copy address"}
            </button>
          </div>
        </li>
        <li>
          <span className={styles.n}>2</span>
          <div>
            <strong>Request testnet TAO</strong>
            <p>
              {FAUCET_URL
                ? "Open the faucet, paste your address and request TAO."
                : "No automatic faucet is listed in the official Bittensor docs. Testnet TAO comes from the Bittensor community; ask there and send it to this address."}
            </p>
            {FAUCET_URL && (
              <a
                className={styles.btn}
                href={FAUCET_URL}
                target="_blank"
                rel="noreferrer"
              >
                Open faucet →
              </a>
            )}
            <a
              className={styles.link}
              href="https://bittensor.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              Official Bittensor docs →
            </a>
          </div>
        </li>
        <li>
          <span className={styles.n}>3</span>
          <div>
            <strong>Wait for it to arrive</strong>
            <p>
              The balance updates by itself every block (about 12 seconds).
              Current balance: <b>{balance ?? "…"}</b>. Testnet TAO has no real
              value.
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
};
