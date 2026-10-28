"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import { getApi, INJECTED_NAME, injectWeb3 } from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { signatureVerify } from "@polkadot/util-crypto";
import { type FC, useEffect, useRef, useState } from "react";

import styles from "./bittensor_widget.module.scss";
import { Widget } from "@bitcodex-demo-web/components/widgets/widget_components";

const TAO = BigInt(1_000_000_000);

function formatTao(rao: bigint): string {
  const frac = (rao % TAO).toString().padStart(9, "0").replace(/0+$/, "");
  return `${rao / TAO}${frac ? `.${frac}` : ""} TAO`;
}

function parseTao(input: string): bigint {
  const [whole, frac = ""] = input.trim().split(".");
  return BigInt(whole || "0") * TAO + BigInt(frac.padEnd(9, "0").slice(0, 9));
}

interface LogLine {
  ok: boolean;
  text: string;
}

export const BittensorWidget: FC = () => {
  const { bittensorWallet, address } = useBitcodeXBittensor();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const injectedRef = useRef(false);

  const push = (ok: boolean, text: string) => {
    // Every SDK call and result is shown here (never key material).
    console.log(`[bittensor demo] ${ok ? "ok" : "error"}: ${text}`);
    setLog((prev) => [{ ok, text }, ...prev]);
  };

  useEffect(() => {
    getApi("bittensor:localnet").then((res) => {
      if (res.success) {
        setApi(res.data);
      } else {
        push(false, `localnet: ${res.err}`);
      }
    });
  }, []);

  useEffect(() => {
    if (!api || !address) {
      setBalance(null);
      return;
    }
    let unsub: (() => void) | undefined;
    api.query.system
      .account(address, (info: { data: { free: { toBigInt(): bigint } } }) =>
        setBalance(info.data.free.toBigInt()),
      )
      .then((u) => {
        unsub = u as unknown as () => void;
      });
    return () => unsub?.();
  }, [api, address]);

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(label);
    try {
      push(true, `${label}: ${await fn()}`);
    } catch (err) {
      push(
        false,
        `${label}: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(null);
    }
  }

  const sendTao = () =>
    run("Send TAO", async () => {
      if (!api || !bittensorWallet) {
        throw new Error("not ready");
      }
      const res = await bittensorWallet.signAndSend(
        api.tx.balances.transferKeepAlive(to.trim(), parseTao(amount)),
      );
      return `${amount} TAO to ${to.trim()} tx=${res.txHash} block=${res.blockHash}`;
    });

  const signLongPayload = () =>
    run("Long payload", async () => {
      if (!api || !bittensorWallet) {
        throw new Error("not ready");
      }
      const tx = api.tx.utility.batchAll(
        Array.from({ length: 10 }, (_, i) =>
          api.tx.system.remark(
            `bitcodex demo long payload ${i} `.padEnd(40, "x"),
          ),
        ),
      );
      const callBytes = tx.method.encodedLength;
      const res = await bittensorWallet.signAndSend(tx);
      return `utility.batchAll(10 x remark), call ${callBytes} bytes (>256, signed as blake2_256) tx=${res.txHash}`;
    });

  const signMessage = () =>
    run("Sign message", async () => {
      if (!bittensorWallet || !address) {
        throw new Error("not ready");
      }
      const message = `Sign in to BitcodeX demo at ${new Date().toISOString()}`;
      const signature = await bittensorWallet.signMessage(message);
      const verified = signatureVerify(message, signature, address);
      return `verified=${verified.isValid} crypto=${verified.crypto} sig=${signature.slice(0, 18)}…`;
    });

  const web3EnableTest = () =>
    run("web3Enable", async () => {
      if (!api || !bittensorWallet) {
        throw new Error("not ready");
      }
      if (!injectedRef.current) {
        injectWeb3(bittensorWallet);
        injectedRef.current = true;
      }
      // Exactly what a third-party dApp does with @polkadot/extension-dapp.
      const { web3Accounts, web3Enable, web3FromSource } = await import(
        "@polkadot/extension-dapp"
      );
      const extensions = await web3Enable("BitcodeX web3Enable test");
      const names = extensions.map((e) => e.name);
      if (!names.includes(INJECTED_NAME)) {
        throw new Error(
          `BitcodeX not listed; extensions: ${names.join(", ") || "none"}`,
        );
      }
      const accounts = (await web3Accounts()).filter(
        (a) => a.meta.source === INJECTED_NAME,
      );
      const account = accounts[0];
      if (!account) {
        throw new Error("BitcodeX listed but no account");
      }
      const injector = await web3FromSource(INJECTED_NAME);
      const hash = await new Promise<string>((resolve, reject) => {
        api.tx.system
          .remark("signed via web3FromSource('bitcodex')")
          .signAndSend(
            account.address,
            { signer: injector.signer },
            ({ status, dispatchError, txHash }) => {
              if (dispatchError) {
                reject(new Error(dispatchError.toString()));
              } else if (status.isInBlock) {
                resolve(txHash.toHex());
              }
            },
          )
          .catch(reject);
      });
      return `extensions=[${names.join(", ")}] account=${account.address} (${account.type}) remark tx=${hash}`;
    });

  return (
    <Widget>
      <div className={styles.container}>
        <div className={styles.header}>
          <Typography size="md" weight="semibold" color="primary">
            Bittensor wallet
          </Typography>
          <span className={styles.badge}>Localnet</span>
        </div>

        <div>
          <Typography size="xs" color="tertiary">
            Coldkey address
          </Typography>
          <div className={styles.row}>
            <span className={styles.mono}>{address ?? "…"}</span>
            {address && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(address)}
              >
                Copy
              </Button>
            )}
          </div>
          <Typography size="sm" color="secondary">
            Balance: {balance === null ? "…" : formatTao(balance)}
          </Typography>
        </div>

        <div className={styles.row}>
          <input
            className={styles.input}
            placeholder="Destination (5…)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className={styles.input}
            style={{ maxWidth: 110 }}
            placeholder="TAO"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!api || !to || !!busy}
            isLoading={busy === "Send TAO"}
            onClick={sendTao}
          >
            Send TAO
          </Button>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!api || !!busy}
            isLoading={busy === "Long payload"}
            onClick={signLongPayload}
          >
            Sign long payload
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!!busy}
            isLoading={busy === "Sign message"}
            onClick={signMessage}
          >
            Sign message
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!api || !!busy}
            isLoading={busy === "web3Enable"}
            onClick={web3EnableTest}
          >
            web3Enable test
          </Button>
        </div>

        {log.length > 0 && (
          <div className={styles.log}>
            {log.map((line, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: append-only log
                key={i}
                className={`${styles.mono} ${line.ok ? styles.logOk : styles.logErr}`}
              >
                {line.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
};
