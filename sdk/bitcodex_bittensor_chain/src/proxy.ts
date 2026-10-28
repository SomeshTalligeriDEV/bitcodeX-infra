import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Registry } from "@polkadot/types/types";

/**
 * Proxy types come from the chain's metadata, never from polkadot.js's built-in
 * `ProxyType` (which only knows Any/NonTransfer/Governance/Staking). On Subtensor the type
 * is `SubtensorRuntimeCommonProxyProxyType` with 21 variants (00-research.md, probe 3e).
 */
export function chainProxyTypes(
  api: Pick<ApiPromise, "tx" | "registry">,
): Result<string[], string> {
  const addProxy = api.tx.proxy?.addProxy;
  if (!addProxy) {
    return { success: false, err: "chain has no proxy.addProxy call" };
  }
  const args = addProxy.meta.args;
  const arg = args.find((a) => a.name.toString() === "proxyType") ?? args[1];
  if (!arg) {
    return { success: false, err: "proxy.addProxy has no proxyType argument" };
  }
  const typeName = arg.type.toString();
  let variants: string[] | undefined;
  try {
    variants = (
      api.registry.createType(typeName) as unknown as { defKeys?: string[] }
    ).defKeys;
  } catch (err) {
    return {
      success: false,
      err: `cannot build proxy type ${typeName}: ${String(err)}`,
    };
  }
  if (!variants || variants.length === 0) {
    return { success: false, err: `proxy type ${typeName} has no variants` };
  }
  return { success: true, data: variants };
}

/** Check a proxy type name against the chain's own list (case-sensitive, as in metadata). */
export function validateProxyType(
  api: Pick<ApiPromise, "tx" | "registry">,
  proxyType: string,
): Result<string, string> {
  const typesRes = chainProxyTypes(api);
  if (!typesRes.success) {
    return typesRes;
  }
  if (!typesRes.data.includes(proxyType)) {
    return {
      success: false,
      err: `unknown proxy type "${proxyType}"; chain supports: ${typesRes.data.join(", ")}`,
    };
  }
  return { success: true, data: proxyType };
}

/** `proxy.addProxy(delegate, proxyType, delay)` with the type checked against metadata. */
export function buildAddProxy(
  api: ApiPromise,
  delegate: string,
  proxyType: string,
  delayBlocks = 0,
): Result<SubmittableExtrinsic<"promise">, string> {
  const typeRes = validateProxyType(api, proxyType);
  if (!typeRes.success) {
    return typeRes;
  }
  return {
    success: true,
    data: api.tx.proxy.addProxy(delegate, proxyType, delayBlocks),
  };
}

/** `proxy.removeProxy(delegate, proxyType, delay)` with the type checked against metadata. */
export function buildRemoveProxy(
  api: ApiPromise,
  delegate: string,
  proxyType: string,
  delayBlocks = 0,
): Result<SubmittableExtrinsic<"promise">, string> {
  const typeRes = validateProxyType(api, proxyType);
  if (!typeRes.success) {
    return typeRes;
  }
  return {
    success: true,
    data: api.tx.proxy.removeProxy(delegate, proxyType, delayBlocks),
  };
}

/** `proxy.proxy(real, Some(proxyType), call)`, signed by the delegate (app/agent) key. */
export function buildProxyCall(
  api: ApiPromise,
  real: string,
  proxyType: string,
  call: SubmittableExtrinsic<"promise">,
): Result<SubmittableExtrinsic<"promise">, string> {
  const typeRes = validateProxyType(api, proxyType);
  if (!typeRes.success) {
    return typeRes;
  }
  return { success: true, data: api.tx.proxy.proxy(real, proxyType, call) };
}

/** Minimal shape of an event record; matches polkadot.js `EventRecord` and test mocks. */
export interface EventRecordLike {
  event: {
    section: string;
    method: string;
    data: unknown;
  };
}

interface DispatchErrorLike {
  isModule: boolean;
  asModule: unknown;
  toString(): string;
}

interface ResultLike {
  isErr: boolean;
  asErr: DispatchErrorLike;
}

/** "pallet.ErrorName" for module errors, else the error's string form. */
export function decodeDispatchError(
  registry: Pick<Registry, "findMetaError">,
  error: DispatchErrorLike,
): string {
  if (error.isModule) {
    try {
      const { section, name } = registry.findMetaError(
        error.asModule as Parameters<Registry["findMetaError"]>[0],
      );
      return `${section}.${name}`;
    } catch {
      return error.toString();
    }
  }
  return error.toString();
}

function proxyResult(data: unknown): ResultLike | null {
  const d = data as { result?: ResultLike; [index: number]: ResultLike };
  return d?.result ?? d?.[0] ?? null;
}

/**
 * Outcome of a `proxy.proxy` (or `proxyAnnounced`) extrinsic from its events.
 *
 * A failed inner call does NOT fail the outer extrinsic: it shows up only as
 * `proxy.ProxyExecuted { result: Err(..) }` (verified on localnet, probe 3e: a transfer
 * through a Staking proxy is `system.CallFiltered` while the extrinsic itself succeeds).
 * So: any Err result is a failure, and a missing ProxyExecuted event is a failure too.
 */
export function checkProxyExecuted(
  registry: Pick<Registry, "findMetaError">,
  events: EventRecordLike[],
): Result<void, string> {
  const failed = events.find(
    ({ event }) =>
      event.section === "system" && event.method === "ExtrinsicFailed",
  );
  if (failed) {
    const data = failed.event.data as {
      dispatchError?: DispatchErrorLike;
      0?: DispatchErrorLike;
    };
    const dispatchError = data.dispatchError ?? data[0];
    return {
      success: false,
      err: `extrinsic failed: ${dispatchError ? decodeDispatchError(registry, dispatchError) : "unknown"}`,
    };
  }

  const executed = events.filter(
    ({ event }) =>
      event.section === "proxy" && event.method === "ProxyExecuted",
  );
  if (executed.length === 0) {
    return {
      success: false,
      err: "no proxy.ProxyExecuted event: the proxied call did not run",
    };
  }
  for (const { event } of executed) {
    const result = proxyResult(event.data);
    if (!result) {
      return { success: false, err: "proxy.ProxyExecuted event has no result" };
    }
    if (result.isErr) {
      return {
        success: false,
        err: `proxy inner call failed: ${decodeDispatchError(registry, result.asErr)}`,
      };
    }
  }
  return { success: true, data: undefined };
}
