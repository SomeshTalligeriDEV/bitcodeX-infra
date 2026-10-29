/**
 * Hotkeys and subnet registration. BitcodeX never creates hotkeys: they are made on
 * the miner/validator machine (`btcli wallet new-hotkey -w <coldkey> -H <hotkey>`) and
 * only their public address is used here.
 *
 * Registration cost (verified to the rao on localnet, 00-research.md "X08 registration
 * cost"): every block, `on_initialize` decays the burn before extrinsics run:
 *   burn' = clamp((burn × f) >> 32, MinBurn, MaxBurn),  f = decay_factor_q32(BurnHalfLife)
 * so a registration included in the next block is charged `nextBurn(burn)`, not the
 * stored `Burn`. Ported from subtensor `utils/misc.rs` (mul_by_q32, pow_q32,
 * decay_factor_q32) and `subnets/registration.rs` (decayed_registration_price).
 */
import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import { checkAddress, encodeAddress } from "@polkadot/util-crypto";

import { SS58_PREFIX } from "./networks";

const Q32_ONE = BigInt(1) << BigInt(32);
const U64_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);

export function mulByQ32(value: bigint, factorQ32: bigint): bigint {
  const shifted = (value * factorQ32) >> BigInt(32);
  return shifted > U64_MAX ? U64_MAX : shifted;
}

export function powQ32(baseQ32: bigint, exp: number): bigint {
  let result = Q32_ONE;
  let factor = baseQ32;
  let power = exp;
  while (power > 0) {
    if ((power & 1) === 1) {
      result = mulByQ32(result, factor);
    }
    power >>= 1;
    if (power > 0) {
      factor = mulByQ32(factor, factor);
    }
  }
  return result;
}

/** Per-block decay factor in Q32: the largest f with f^halfLife <= 0.5. */
export function decayFactorQ32(halfLife: number): bigint {
  if (halfLife === 0) {
    return Q32_ONE;
  }
  const half = Q32_ONE >> BigInt(1);
  let lo = BigInt(0);
  let hi = Q32_ONE;
  while (lo + BigInt(1) < hi) {
    const mid = lo + ((hi - lo) >> BigInt(1));
    if (powQ32(mid, halfLife) > half) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return lo;
}

export interface BurnParams {
  halfLife: number;
  minBurn: bigint;
  maxBurn: bigint;
}

/** Burn after `blocks` block starts (no registrations in between). */
export function decayedBurn(
  burn: bigint,
  params: BurnParams,
  blocks = 1,
): bigint {
  // The chain only decays when BurnHalfLife > 0.
  const factor = params.halfLife > 0 ? decayFactorQ32(params.halfLife) : null;
  let v = burn;
  for (let i = 0; i < blocks; i++) {
    if (factor !== null) {
      v = mulByQ32(v, factor);
    }
    if (v < params.minBurn) {
      v = params.minBurn;
    }
    if (v > params.maxBurn) {
      v = params.maxBurn;
    }
  }
  return v;
}

export interface RegistrationQuote {
  netuid: number;
  /** Stored `Burn` at the best block. */
  storedBurn: bigint;
  /** What a registration in the next block is charged (rao). Excludes the tx fee. */
  cost: bigint;
  params: BurnParams;
  maxRegistrationsPerBlock: number;
  /** Raw `CollateralLockShare`; 0 means the whole cost is burned/recycled. */
  collateralLockShare: string;
}

export async function quoteRegistration(
  api: ApiPromise,
  netuid: number,
): Promise<RegistrationQuote> {
  const q = api.query.subtensorModule;
  const [burn, halfLife, minBurn, maxBurn, maxRegs, lockShare] =
    await Promise.all([
      q.burn(netuid),
      q.burnHalfLife(netuid),
      q.minBurn(netuid),
      q.maxBurn(netuid),
      q.maxRegistrationsPerBlock(netuid),
      q.collateralLockShare(netuid),
    ]);
  const params: BurnParams = {
    halfLife: Number(halfLife.toString()),
    minBurn: BigInt(minBurn.toString()),
    maxBurn: BigInt(maxBurn.toString()),
  };
  const storedBurn = BigInt(burn.toString());
  return {
    netuid,
    storedBurn,
    cost: decayedBurn(storedBurn, params, 1),
    params,
    maxRegistrationsPerBlock: Number(maxRegs.toString()),
    collateralLockShare: lockShare.toString(),
  };
}

export interface HotkeySubnet {
  netuid: number;
  uid: number;
}

export interface HotkeyInfo {
  hotkey: string;
  /** Owning coldkey, or null if no coldkey has claimed it yet. */
  owner: string | null;
  subnets: HotkeySubnet[];
}

/** The all-zero account: `Owner` returns it for a hotkey nobody owns. */
const ZERO_ACCOUNT = encodeAddress(new Uint8Array(32), SS58_PREFIX);

export async function getHotkeyInfo(
  api: ApiPromise,
  hotkey: string,
): Promise<HotkeyInfo> {
  const q = api.query.subtensorModule;
  const owner = (await q.owner(hotkey)).toString();
  const netuids = (await q.networksAdded.keys()).map((k) =>
    Number(k.args[0].toString()),
  );
  const subnets: HotkeySubnet[] = [];
  await Promise.all(
    netuids.map(async (netuid) => {
      const uid = (await q.uids(netuid, hotkey)) as unknown as {
        isSome: boolean;
        unwrap(): { toNumber(): number };
      };
      if (uid.isSome) {
        subnets.push({ netuid, uid: uid.unwrap().toNumber() });
      }
    }),
  );
  subnets.sort((a, b) => a.netuid - b.netuid);
  return {
    hotkey,
    owner: owner === ZERO_ACCOUNT ? null : owner,
    subnets,
  };
}

/** Hotkeys the chain records as owned by `coldkey` (`OwnedHotkeys`). */
export async function getOwnedHotkeys(
  api: ApiPromise,
  coldkey: string,
): Promise<string[]> {
  const list = (await api.query.subtensorModule.ownedHotkeys(
    coldkey,
  )) as unknown as { toString(): string }[];
  return list.map((h) => h.toString());
}

/** Refuse what the chain would refuse, before asking the user to sign. */
export async function checkRegistration(
  api: ApiPromise,
  coldkey: string,
  netuid: number,
  hotkey: string,
): Promise<Result<RegistrationQuote, string>> {
  const [valid, reason] = checkAddress(hotkey, SS58_PREFIX);
  if (!valid) {
    return {
      success: false,
      err: `not a Bittensor hotkey address: ${reason ?? hotkey}`,
    };
  }
  if (hotkey === coldkey) {
    return {
      success: false,
      err: "a coldkey cannot be its own hotkey; use the hotkey's address",
    };
  }
  if (netuid === 0) {
    return { success: false, err: "registration is not allowed on root" };
  }
  const info = await getHotkeyInfo(api, hotkey);
  if (info.owner !== null && info.owner !== coldkey) {
    return {
      success: false,
      err: "this hotkey is owned by a different coldkey",
    };
  }
  if (info.subnets.some((s) => s.netuid === netuid)) {
    return {
      success: false,
      err: `this hotkey is already registered on subnet ${netuid}`,
    };
  }
  return { success: true, data: await quoteRegistration(api, netuid) };
}
