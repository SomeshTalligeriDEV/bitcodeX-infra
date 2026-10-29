import type { ApiPromise } from "@polkadot/api";

/**
 * Key swap parameters read from the chain (verified on localnet 2026-10-29: a swap on
 * all subnets charged exactly `KeySwapCost`, one subnet exactly `KeySwapOnSubnetCost`).
 */
export function hotkeySwapCost(api: ApiPromise, netuid: number | null): bigint {
  const c = api.consts.subtensorModule;
  return BigInt(
    (netuid === null ? c.keySwapCost : c.keySwapOnSubnetCost).toString(),
  );
}

export interface ColdkeySwapDelays {
  /** Blocks between `announceColdkeySwap` and when `swapColdkeyAnnounced` may run. */
  announcementDelay: number;
  /** Blocks before an announcement may be replaced or cleared. */
  reannouncementDelay: number;
}

export async function coldkeySwapDelays(
  api: ApiPromise,
): Promise<ColdkeySwapDelays> {
  const q = api.query.subtensorModule;
  const [a, r] = await Promise.all([
    q.coldkeySwapAnnouncementDelay(),
    q.coldkeySwapReannouncementDelay(),
  ]);
  return {
    announcementDelay: Number(a.toString()),
    reannouncementDelay: Number(r.toString()),
  };
}
