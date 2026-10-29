import type { BittensorSignerPayloadJSON } from "@bitcodex/bitcodex-sdk-core";
import {
  type CallCard,
  describeCall,
  formatTaoAmount,
  type PlainCall,
  toPlainCall,
} from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import type { Call } from "@polkadot/types/interfaces";

export interface DecodedExtrinsic {
  /** Plain-English card; calls nested in batch/proxy are in `inner`, never hidden. */
  card: CallCard;
  /** Raw decoded call tree (JSON args), for live lookups such as registration cost. */
  plain: PlainCall;
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
      data: (() => {
        const plain = toPlainCall(call);
        return { card: describeCall(plain), plain, callHex: payload.method };
      })(),
    };
  } catch (err) {
    return { success: false, err: `Cannot decode the call: ${String(err)}` };
  }
}

/** rao -> "1.5 TAO" with up to 9 decimals, trailing zeros trimmed. */
export const formatTao = formatTaoAmount;

const REGISTER_METHODS = new Set(["burnedRegister", "registerLimit"]);

/** Subnets of every hotkey registration in the call tree (batch/proxy included). */
export function registrationNetuids(call: PlainCall): number[] {
  const own =
    call.section === "subtensorModule" &&
    REGISTER_METHODS.has(call.method) &&
    typeof call.args.netuid === "number"
      ? [call.args.netuid]
      : [];
  return [...own, ...call.inner.flatMap(registrationNetuids)];
}

/** Every `proxy.addProxy` in the call tree: who gets which permission. */
export function permissionGrants(
  call: PlainCall,
): { delegate: unknown; proxyType: string }[] {
  const own =
    call.section === "proxy" && call.method === "addProxy"
      ? [
          {
            delegate: call.args.delegate,
            proxyType: String(call.args.proxyType),
          },
        ]
      : [];
  return [...own, ...call.inner.flatMap(permissionGrants)];
}
