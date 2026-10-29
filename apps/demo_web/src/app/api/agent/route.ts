// Demo AI agent (X09): a separate key that acts for a user ONLY through an on-chain
// proxy the user granted. It never sees the user's key. Localnet only.
// The agent key is a public dev URI from DEMO_AGENT_SURI (e.g. //BitcodeXDemoAgent).
import {
  actAs,
  formatTaoAmount,
  getApi,
  getBalances,
  getProxies,
  parseUnits,
} from "@bitcodex/bittensor-chain";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { checkAddress, cryptoWaitReady } from "@polkadot/util-crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

let agentPair: KeyringPair | null = null;

async function agent(): Promise<KeyringPair | null> {
  const suri = process.env.DEMO_AGENT_SURI;
  if (!suri) {
    return null;
  }
  if (!agentPair) {
    await cryptoWaitReady();
    agentPair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromUri(
      suri,
    );
  }
  return agentPair;
}

// PREVIEW: an off-chain policy the agent server applies before acting. The chain only
// enforces the proxy type; this daily cap is enforced here, by the agent, not by the chain.
const spentToday = new Map<string, bigint>();
const dayKey = (user: string) =>
  `${new Date().toISOString().slice(0, 10)}:${user}`;

const fail = (status: number, msg: string) =>
  NextResponse.json({ success: false, msg }, { status });

export async function GET() {
  const pair = await agent();
  if (!pair) {
    return fail(404, "demo agent is off (set DEMO_AGENT_SURI)");
  }
  return NextResponse.json({
    success: true,
    data: { agentAddress: pair.address, network: "bittensor:localnet" },
  });
}

export async function POST(req: Request) {
  const pair = await agent();
  if (!pair) {
    return fail(404, "demo agent is off (set DEMO_AGENT_SURI)");
  }
  const body = (await req.json().catch(() => null)) as {
    user?: string;
    netuid?: number;
    hotkey?: string;
    amountTao?: string;
    dailyLimitTao?: string;
  } | null;
  if (!body?.user || !checkAddress(body.user, 42)[0]) {
    return fail(400, "user must be a Bittensor address");
  }
  if (!body.hotkey || !checkAddress(body.hotkey, 42)[0]) {
    return fail(400, "hotkey must be a Bittensor address");
  }
  if (typeof body.netuid !== "number") {
    return fail(400, "netuid required");
  }
  const amount = parseUnits(body.amountTao ?? "");
  if (!amount.success || amount.data <= BigInt(0)) {
    return fail(400, "amountTao must be a positive decimal");
  }

  // Refuses anything that is not localnet (genesis/chainType check inside getApi).
  const apiRes = await getApi("bittensor:localnet", {
    rpcUrl: process.env.DEMO_AGENT_RPC_URL || undefined,
  });
  if (!apiRes.success) {
    return fail(503, apiRes.err);
  }
  const api = apiRes.data;

  // The agent can only act if the user granted it a Staking permission on chain.
  const granted = (await getProxies(api, body.user)).delegations.some(
    (p) =>
      p.delegate === pair.address &&
      (p.proxyType === "Staking" || p.proxyType === "Any"),
  );
  if (!granted) {
    return fail(403, "no Staking permission from this user on chain");
  }

  if (body.dailyLimitTao) {
    const limit = parseUnits(body.dailyLimitTao);
    if (!limit.success) {
      return fail(400, "dailyLimitTao must be a decimal");
    }
    const spent = spentToday.get(dayKey(body.user)) ?? BigInt(0);
    if (spent + amount.data > limit.data) {
      return fail(
        429,
        `daily limit (Preview, enforced by this agent, not the chain): ${formatTaoAmount(spent)} of ${formatTaoAmount(limit.data)} used today`,
      );
    }
  }

  // The agent pays its own fees: top up from the localnet faucet when low.
  const own = await getBalances(api, pair.address);
  const apiEndpoint = process.env.NEXT_PUBLIC_BITCODEX_API_ENDPOINT;
  if (own.free < BigInt(500_000_000) && apiEndpoint) {
    await fetch(`${apiEndpoint}/faucet/v1/drip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: pair.address }),
    }).catch(() => undefined);
  }

  const res = await actAs(
    api,
    pair,
    body.user,
    "Staking",
    api.tx.subtensorModule.addStake(body.hotkey, body.netuid, amount.data),
  );
  if (!res.success) {
    return fail(502, res.err);
  }
  const key = dayKey(body.user);
  spentToday.set(key, (spentToday.get(key) ?? BigInt(0)) + amount.data);
  return NextResponse.json({
    success: true,
    data: {
      ...res.data,
      agentAddress: pair.address,
      amountRao: amount.data.toString(),
    },
  });
}
