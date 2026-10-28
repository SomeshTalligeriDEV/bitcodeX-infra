import type { BittensorSignerPayloadJSON } from "@bitcodex/bitcodex-sdk-core";
import { TAO_DECIMALS } from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import type { Call } from "@polkadot/types/interfaces";

/** Pallets the confirm modal knows how to show. Anything else gets the red warning. */
const KNOWN_SECTIONS = new Set([
  "balances",
  "subtensorModule",
  "proxy",
  "utility",
  "system",
]);

export interface DecodedCall {
  section: string;
  method: string;
  args: Record<string, unknown>;
  known: boolean;
  /** Calls nested in utility.batch*, proxy.proxy*, so nothing is hidden. */
  inner: DecodedCall[];
}

function decodeCall(call: Call): DecodedCall {
  const section = call.section;
  const method = call.method;
  const args: Record<string, unknown> = {};
  const inner: DecodedCall[] = [];
  call.meta.args.forEach((meta, i) => {
    const value = call.args[i];
    const name = meta.name.toString();
    const typeName = meta.type.toString();
    if (typeName === "RuntimeCall" || typeName === "Call") {
      inner.push(decodeCall(value as Call));
      args[name] = "(call shown below)";
    } else if (
      typeName.startsWith("Vec<RuntimeCall>") ||
      typeName.startsWith("Vec<Call>")
    ) {
      for (const c of value as unknown as Call[]) {
        inner.push(decodeCall(c));
      }
      args[name] = `(${inner.length} calls shown below)`;
    } else {
      args[name] = value.toHuman();
    }
  });
  const known = KNOWN_SECTIONS.has(section) && inner.every((c) => c.known);
  return { section, method, args, known, inner };
}

export interface DecodedExtrinsic {
  call: DecodedCall;
  callHex: string;
}

/**
 * Check a host-supplied signer payload against the iframe's own chain connection and
 * decode its call. The iframe trusts nothing in the payload that it cannot re-check.
 */
export function decodeSignerPayload(
  api: ApiPromise,
  payload: BittensorSignerPayloadJSON,
  walletAddress: string | null,
): Result<DecodedExtrinsic, string> {
  if (!walletAddress || payload.address !== walletAddress) {
    return {
      success: false,
      err: "This request is for a different account than your BitcodeX wallet.",
    };
  }
  if (payload.genesisHash.toLowerCase() !== api.genesisHash.toHex()) {
    return {
      success: false,
      err: "This request is for a different network than the one BitcodeX is connected to.",
    };
  }
  const spec = api.registry.createType("u32", payload.specVersion).toNumber();
  const txv = api.registry
    .createType("u32", payload.transactionVersion)
    .toNumber();
  if (
    spec !== api.runtimeVersion.specVersion.toNumber() ||
    txv !== api.runtimeVersion.transactionVersion.toNumber()
  ) {
    return {
      success: false,
      err: "This request was built for a different runtime version.",
    };
  }
  try {
    const call = api.registry.createType("Call", payload.method) as Call;
    return {
      success: true,
      data: { call: decodeCall(call), callHex: payload.method },
    };
  } catch (err) {
    return { success: false, err: `Cannot decode the call: ${String(err)}` };
  }
}

/** rao -> "1.5 TAO" with up to 9 decimals, trailing zeros trimmed. */
export function formatTao(rao: bigint): string {
  const base = BigInt(10) ** BigInt(TAO_DECIMALS);
  const whole = rao / base;
  const frac = (rao % base)
    .toString()
    .padStart(TAO_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${whole}${frac ? `.${frac}` : ""} TAO`;
}
