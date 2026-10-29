/**
 * App/agent permissions = Subtensor proxies. What each ProxyType allows is read from
 * the chain's own `ProxyFilterRuntimeApi.get_proxy_filters`, which the runtime derives
 * from the same call groups its filter enforces (subtensor runtime/src/proxy_filters),
 * so the UI cannot drift from what the chain allows.
 */
import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import { hexToString, isHex } from "@polkadot/util";

import { formatTaoAmount } from "./describe";
import {
  buildProxyCall,
  checkProxyExecuted,
  decodeDispatchError,
  type EventRecordLike,
} from "./proxy";

export interface AllowedCall {
  pallet: string;
  call: string;
  /** e.g. { param: "value", lessThan: 500000000n } for SmallTransfer. */
  constraint: { param: string; lessThan: bigint } | null;
}

export interface ProxyFilter {
  proxyType: string;
  deprecated: boolean;
  /** "allow": only `calls`; "deny": everything except `calls`; "any": everything. */
  mode: "allow" | "deny" | "any";
  calls: AllowedCall[];
}

interface FilterJson {
  name: string;
  deprecated: boolean;
  filterMode: Record<string, unknown>;
}

interface CallJson {
  palletName: string;
  callName: string;
  constraint: {
    paramLessThan?: { paramName: string; limit: number | string };
  } | null;
}

const text = (v: string) => (isHex(v) ? hexToString(v) : v);

/** Every ProxyType's filter, decoded. */
export async function getProxyFilters(api: ApiPromise): Promise<ProxyFilter[]> {
  const raw = (
    await api.call.proxyFilterRuntimeApi.getProxyFilters(null)
  ).toJSON() as unknown as FilterJson[];
  return raw.map((f) => {
    const [modeKey, list] = Object.entries(f.filterMode)[0] ?? ["any", null];
    const calls = Array.isArray(list)
      ? (list as CallJson[]).map((c) => {
          const lt = c.constraint?.paramLessThan;
          return {
            pallet: text(c.palletName),
            call: text(c.callName),
            constraint: lt
              ? { param: text(lt.paramName), lessThan: BigInt(lt.limit) }
              : null,
          };
        })
      : [];
    const mode = modeKey.toLowerCase();
    return {
      proxyType: text(f.name),
      deprecated: f.deprecated,
      mode: mode === "allow" || mode === "deny" ? mode : "any",
      calls,
    };
  });
}

export async function getProxyFilter(
  api: ApiPromise,
  proxyType: string,
): Promise<ProxyFilter | null> {
  return (
    (await getProxyFilters(api)).find((f) => f.proxyType === proxyType) ?? null
  );
}

const FRIENDLY: Record<string, string> = {
  "Balances.transfer_keep_alive": "send TAO",
  "Balances.transfer_allow_death": "send TAO (may close the account)",
  "Balances.transfer_all": "send ALL your TAO",
  "SubtensorModule.add_stake": "stake",
  "SubtensorModule.add_stake_limit": "stake (with price limit)",
  "SubtensorModule.remove_stake": "unstake",
  "SubtensorModule.remove_stake_limit": "unstake (with price limit)",
  "SubtensorModule.remove_stake_full_limit": "unstake everything on a subnet",
  "SubtensorModule.unstake_all": "unstake everything",
  "SubtensorModule.unstake_all_alpha": "unstake all alpha",
  "SubtensorModule.move_stake": "move stake",
  "SubtensorModule.swap_stake": "swap stake between subnets",
  "SubtensorModule.transfer_stake": "give stake to another wallet",
  "SubtensorModule.burned_register": "register hotkeys",
  "SubtensorModule.register_limit": "register hotkeys",
};

/** Plain-English lines for the permission modal, from the chain's filter. */
export function describePermission(filter: ProxyFilter): {
  can: string[];
  broad: boolean;
} {
  if (filter.mode === "any") {
    return {
      can: ["do anything this wallet can, including sending all TAO"],
      broad: true,
    };
  }
  if (filter.mode === "deny") {
    return {
      can: [
        `do anything except ${filter.calls.length} blocked actions (very broad)`,
      ],
      broad: true,
    };
  }
  const can = new Set<string>();
  for (const c of filter.calls) {
    const name = FRIENDLY[`${c.pallet}.${c.call}`] ?? `${c.pallet}.${c.call}`;
    can.add(
      c.constraint
        ? `${name}, only below ${
            c.constraint.param === "alpha_amount"
              ? `${formatTaoAmount(c.constraint.lessThan).replace(" TAO", " alpha")}`
              : formatTaoAmount(c.constraint.lessThan)
          } per call`
        : name,
    );
  }
  return { can: [...can], broad: filter.calls.length > 30 };
}

/** Deposit reserved for one more delegation (returned on removal). */
export function proxyDeposit(
  api: ApiPromise,
  existingDelegations: number,
): bigint {
  const base = BigInt(api.consts.proxy.proxyDepositBase.toString());
  const factor = BigInt(api.consts.proxy.proxyDepositFactor.toString());
  // Base is paid once per account (first delegation); each delegation adds factor.
  return existingDelegations === 0 ? base + factor : factor;
}

export interface ActAsResult {
  txHash: string;
  blockHash: string;
}

/**
 * Agent side: submit `call` as `real` through `proxy.proxy`, signed by the agent's own
 * key. Fails when the outer extrinsic fails OR the inner call fails
 * (`proxy.ProxyExecuted { result: Err }`, which does not fail the outer extrinsic).
 */
export function actAs(
  api: ApiPromise,
  agent: KeyringPair,
  real: string,
  proxyType: string,
  call: SubmittableExtrinsic<"promise">,
): Promise<Result<ActAsResult, string>> {
  const wrapped = buildProxyCall(api, real, proxyType, call);
  if (!wrapped.success) {
    return Promise.resolve(wrapped);
  }
  return new Promise((resolve) => {
    let unsub: (() => void) | undefined;
    wrapped.data
      .signAndSend(
        agent,
        { nonce: -1 },
        ({ status, dispatchError, events, txHash }) => {
          if (!status.isInBlock && !dispatchError) {
            return;
          }
          unsub?.();
          if (dispatchError) {
            resolve({
              success: false,
              err: `extrinsic failed: ${decodeDispatchError(api.registry, dispatchError)}`,
            });
            return;
          }
          const inner = checkProxyExecuted(
            api.registry,
            events as unknown as EventRecordLike[],
          );
          if (!inner.success) {
            resolve(inner);
            return;
          }
          resolve({
            success: true,
            data: {
              txHash: txHash.toHex(),
              blockHash: status.asInBlock.toHex(),
            },
          });
        },
      )
      .then((u) => {
        unsub = u;
      })
      .catch((err: unknown) => resolve({ success: false, err: String(err) }));
  });
}
