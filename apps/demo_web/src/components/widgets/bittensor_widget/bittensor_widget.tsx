"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import {
  getApi,
  INJECTED_NAME,
  injectWeb3,
  verifySiwb,
} from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { signatureVerify } from "@polkadot/util-crypto";
import { QRCodeSVG } from "qrcode.react";
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";

import { BittensorAgentPanel } from "./bittensor_agent_panel";
import { BittensorHotkeysPanel } from "./bittensor_hotkeys_panel";
import { BittensorStakePanel } from "./bittensor_stake_panel";
import styles from "./bittensor_widget.module.scss";
import {
  CHAIN_ID,
  IS_LOCALNET,
  NETWORK_NAME,
  TESTNET_FUNDING_NOTE,
} from "@bitcodex-demo-web/bittensor_network";

const TAO = BigInt(1_000_000_000);
const API_ENDPOINT = process.env.NEXT_PUBLIC_BITCODEX_API_ENDPOINT;

interface FaucetStatus {
  amountTao: number;
  faucetBalanceRao: string;
}

async function faucetRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ENDPOINT}/faucet/v1${path}`, init);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.msg ?? `faucet error ${res.status}`);
  }
  return body.data as T;
}

function formatTao(rao: bigint): string {
  const frac = (rao % TAO).toString().padStart(9, "0").replace(/0+$/, "");
  return `${rao / TAO}${frac ? `.${frac}` : ""} TAO`;
}

interface LogLine {
  ok: boolean;
  text: string;
}

export const BittensorWidget: FC = () => {
  const { bittensorWallet, address } = useBitcodeXBittensor();
  const { email, signOut } = useBitcodeX();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [faucet, setFaucet] = useState<FaucetStatus | null>(null);
  const [showQr, setShowQr] = useState(false);
  const injectedRef = useRef(false);

  const push = (ok: boolean, text: string) => {
    // Every SDK call and result is shown here (never key material).
    console.log(`[bittensor demo] ${ok ? "ok" : "error"}: ${text}`);
    setLog((prev) => [{ ok, text }, ...prev]);
  };

  useEffect(() => {
    getApi(CHAIN_ID).then((res) => {
      if (res.success) {
        setApi(res.data);
      } else {
        push(false, `localnet: ${res.err}`);
      }
    });
  }, []);

  useEffect(() => {
    // Only shown on localnet, when the API's faucet is running and checks out as localnet.
    if (!API_ENDPOINT || !IS_LOCALNET) {
      return;
    }
    faucetRequest<FaucetStatus>("/status")
      .then(setFaucet)
      .catch(() => setFaucet(null));
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

  const getTestTao = () =>
    run("Get test TAO", async () => {
      if (!address) {
        throw new Error("not signed in");
      }
      const data = await faucetRequest<{ amountRao: string; txHash: string }>(
        "/drip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        },
      );
      return `${formatTao(BigInt(data.amountRao))} from the localnet faucet tx=${data.txHash}`;
    });

  const sendTao = () =>
    run("Send TAO", async () => {
      if (!api || !bittensorWallet) {
        throw new Error("not ready");
      }
      const res = await bittensorWallet.sendTao(to.trim(), amount);
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

  const signInWithBittensor = () =>
    run("Sign in with Bittensor", async () => {
      if (!api || !bittensorWallet) {
        throw new Error("not ready");
      }
      // A real app gets the nonce from its server and runs verifySiwb there.
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const res = await bittensorWallet.signInWithBittensor({
        nonce,
        statement: "Sign in to the BitcodeX demo.",
      });
      const check = verifySiwb(res.message, res.signature, {
        domain: window.location.host,
        nonce,
        genesisHash: api.genesisHash.toHex(),
      });
      if (!check.success) {
        throw new Error(`verifySiwb failed: ${check.err}`);
      }
      return `verified=true crypto=${check.data.crypto} chain=${res.fields.chainId} nonce=${nonce}`;
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
    <div className={styles.page}>
      <section className={styles.accountCard}>
        <div className={styles.accountTop}>
          <div className={styles.avatar} aria-hidden="true">
            {(email ?? "B").slice(0, 1).toUpperCase()}
          </div>
          <div className={styles.accountWho}>
            <Typography size="lg" weight="semibold" color="primary">
              Your Bittensor wallet
            </Typography>
            <Typography size="sm" color="tertiary">
              {email ? `Signed in as ${email}` : "Signed in"} · coldkey secured
              by a 2-of-2 threshold key
            </Typography>
          </div>
          <span className={styles.networkPill}>
            <span className={styles.dot} />
            {NETWORK_NAME}
          </span>
        </div>

        <div className={styles.accountBody}>
          <div className={styles.balanceBlock}>
            <span className={styles.caption}>Balance</span>
            <span className={styles.balance}>
              {balance === null ? "…" : formatTao(balance)}
            </span>
            {!IS_LOCALNET && (
              <span className={styles.note}>{TESTNET_FUNDING_NOTE}</span>
            )}
          </div>
          <div className={styles.addressBlock}>
            <span className={styles.caption}>Coldkey address</span>
            <span className={styles.address} title={address ?? ""}>
              {address ?? "…"}
            </span>
            <div className={styles.row}>
              {address && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(address)}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowQr((v) => !v)}
                  >
                    {showQr ? "Hide QR" : "Receive"}
                  </Button>
                </>
              )}
              {faucet && address && (
                <Button
                  size="sm"
                  disabled={!!busy}
                  isLoading={busy === "Get test TAO"}
                  onClick={getTestTao}
                >
                  Get {faucet.amountTao} test TAO
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          </div>
          {address && showQr && (
            <div className={styles.qr}>
              <QRCodeSVG value={address} size={148} />
            </div>
          )}
        </div>
      </section>

      <div className={styles.grid}>
        <Card
          title="Send TAO"
          desc="A transfer signed by the user's coldkey. The BitcodeX popup shows the amount, destination and fee before anything is signed."
          code={`await bittensorWallet.sendTao("${to.trim() || "5F…"}", "${amount}");`}
        >
          <input
            className={styles.input}
            placeholder="Destination address (5…)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <div className={styles.row}>
            <input
              className={styles.input}
              style={{ maxWidth: 120 }}
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
        </Card>

        <Card
          title="Sign and verify"
          desc="Messages, Sign-In with Bittensor (CAIP-122) and a >256-byte transaction, all approved in the popup."
          code={`const sig = await bittensorWallet.signMessage("hello");
const { message, signature } =
  await bittensorWallet.signInWithBittensor({ nonce });
// server: verifySiwb(message, signature, { domain, nonce, genesisHash })`}
        >
          <div className={styles.actions}>
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
              isLoading={busy === "Sign in with Bittensor"}
              onClick={signInWithBittensor}
            >
              Sign in with Bittensor
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!api || !!busy}
              isLoading={busy === "Long payload"}
              onClick={signLongPayload}
            >
              Sign long transaction
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!api || !!busy}
              isLoading={busy === "web3Enable"}
              onClick={web3EnableTest}
            >
              Works with dApps (web3Enable)
            </Button>
          </div>
        </Card>
      </div>

      {api && bittensorWallet && address && (
        <div className={styles.grid}>
          <BittensorStakePanel
            api={api}
            wallet={bittensorWallet}
            address={address}
            busy={busy}
            run={run}
          />
          <BittensorHotkeysPanel
            api={api}
            wallet={bittensorWallet}
            address={address}
            busy={busy}
            run={run}
          />
          <BittensorAgentPanel
            api={api}
            wallet={bittensorWallet}
            address={address}
            busy={busy}
            run={run}
          />
          <section className={styles.subsection}>
            <Typography size="md" weight="semibold" color="primary">
              Activity
            </Typography>
            <Typography size="xs" color="tertiary">
              Every call and its on-chain result. Never key material.
            </Typography>
            {log.length === 0 && (
              <span className={styles.note}>
                Nothing yet. Try an action above.
              </span>
            )}
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
          </section>
        </div>
      )}
    </div>
  );
};

const Card: FC<{
  title: string;
  desc: string;
  code: string;
  children: ReactNode;
}> = ({ title, desc, code, children }) => {
  const [showCode, setShowCode] = useState(false);
  return (
    <section className={styles.subsection}>
      <div className={styles.cardHead}>
        <Typography size="md" weight="semibold" color="primary">
          {title}
        </Typography>
        <button
          type="button"
          className={styles.codeToggle}
          onClick={() => setShowCode((v) => !v)}
        >
          {showCode ? "Hide code" : "Show code"}
        </button>
      </div>
      <Typography size="xs" color="tertiary">
        {desc}
      </Typography>
      {showCode ? <pre className={styles.code}>{code}</pre> : children}
    </section>
  );
};
