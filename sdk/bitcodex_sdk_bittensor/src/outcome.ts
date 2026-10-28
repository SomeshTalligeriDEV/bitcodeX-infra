import {
  checkProxyExecuted,
  decodeDispatchError,
  type EventRecordLike,
} from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import type { Registry } from "@polkadot/types/types";

const PROXY_METHODS = new Set(["proxy", "proxyAnnounced"]);

/** True for `proxy.proxy` / `proxy.proxyAnnounced`, whose inner result is only an event. */
export function isProxyCall(call: {
  section: string;
  method: string;
}): boolean {
  return call.section === "proxy" && PROXY_METHODS.has(call.method);
}

interface DispatchErrorLike {
  isModule: boolean;
  asModule: unknown;
  toString(): string;
}

/**
 * Final outcome of an included extrinsic. A proxy call only succeeds when every
 * `proxy.ProxyExecuted` result is Ok: a failed inner call does not fail the outer
 * extrinsic on Subtensor (00-research.md, probe 3e).
 */
export function extrinsicOutcome(
  registry: Pick<Registry, "findMetaError">,
  call: { section: string; method: string },
  dispatchError: DispatchErrorLike | undefined,
  events: EventRecordLike[],
): Result<void, string> {
  if (dispatchError) {
    return {
      success: false,
      err: `extrinsic failed: ${decodeDispatchError(registry, dispatchError)}`,
    };
  }
  if (isProxyCall(call)) {
    return checkProxyExecuted(registry, events);
  }
  return { success: true, data: undefined };
}
