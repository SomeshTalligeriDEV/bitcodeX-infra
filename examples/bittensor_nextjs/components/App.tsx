"use client";

import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useBitcodeXBittensor } from "@bitcodex/bitcodex-sdk-react/bittensor";
import { getApi } from "@bitcodex/sdk-bittensor";
import type { ApiPromise } from "@polkadot/api";
import { useEffect, useState } from "react";

const TAO = BigInt(1_000_000_000);

function formatTao(rao: bigint): string {
  const frac = (rao % TAO).toString().padStart(9, "0").replace(/0+$/, "");
  return `${rao / TAO}${frac ? `.${frac}` : ""} TAO`;
}

function parseTao(input: string): bigint {
  const [whole, frac = ""] = input.trim().split(".");
  return BigInt(whole || "0") * TAO + BigInt(frac.padEnd(9, "0").slice(0, 9));
}

export default function App() {
  const { isSignedIn, signIn, signOut } = useBitcodeX();
  const { bittensorWallet, isReady, address } = useBitcodeXBittensor();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApi("bittensor:localnet").then((res) => {
      if (res.success) {
        setApi(res.data);
      } else {
        setError(res.err);
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
      .account(
        address,
        ({ data }: { data: { free: { toBigInt(): bigint } } }) =>
          setBalance(data.free.toBigInt()),
      )
      .then((u) => {
        unsub = u as unknown as () => void;
      });
    return () => unsub?.();
  }, [api, address]);

  async function send() {
    if (!api || !bittensorWallet) {
      return;
    }
    setError(null);
    setStatus("Waiting for your approval…");
    try {
      const tx = api.tx.balances.transferKeepAlive(to, parseTao(amount));
      const res = await bittensorWallet.signAndSend(tx);
      setStatus(`Included: ${res.txHash}`);
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!isSignedIn) {
    return (
      <main>
        <h1>BitcodeX on Bittensor</h1>
        <p>Sign in to get a Bittensor wallet. No seed phrase, no extension.</p>
        <button
          type="button"
          disabled={!isReady}
          onClick={() => signIn("google")}
        >
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>BitcodeX on Bittensor</h1>
      <div className="card">
        <strong>Your coldkey (localnet)</strong>
        <span className="mono">{address ?? "…"}</span>
        <span>Balance: {balance === null ? "…" : formatTao(balance)}</span>
      </div>
      <div className="card">
        <strong>Send TAO</strong>
        <input
          placeholder="Destination address (5…)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          placeholder="Amount in TAO"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="button" disabled={!api || !to || !address} onClick={send}>
          Send
        </button>
        {status && <span className="mono">{status}</span>}
        {error && <span className="error">{error}</span>}
      </div>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  );
}
