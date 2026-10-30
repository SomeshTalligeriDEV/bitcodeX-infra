import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";

import { TAO_DECIMALS } from "./networks";

const UNIT = BigInt(10) ** BigInt(TAO_DECIMALS);
const BPS = BigInt(10_000);

/** "1.5" -> 1500000000 rao. Rejects more than 9 decimals, signs, exponents and junk. */
export function parseUnits(input: string): Result<bigint, string> {
  const s = input.trim();
  const m = /^(\d+)(?:\.(\d*))?$/.exec(s) ?? /^()\.(\d+)$/.exec(s);
  if (!m) {
    return { success: false, err: `not an amount: "${input}"` };
  }
  const [, whole, frac = ""] = m;
  if (frac.length > TAO_DECIMALS) {
    return {
      success: false,
      err: `at most ${TAO_DECIMALS} decimals`,
    };
  }
  return {
    success: true,
    data: BigInt(whole || "0") * UNIT + BigInt(frac.padEnd(TAO_DECIMALS, "0")),
  };
}

export interface Balances {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  /** What can be sent now: free minus the part held by locks/freezes. */
  transferable: bigint;
}

interface AccountInfoLike {
  data: {
    free: { toBigInt(): bigint };
    reserved: { toBigInt(): bigint };
    frozen: { toBigInt(): bigint };
  };
}

export function balancesFrom(info: AccountInfoLike): Balances {
  const free = info.data.free.toBigInt();
  const reserved = info.data.reserved.toBigInt();
  const frozen = info.data.frozen.toBigInt();
  // Freezes overlap reserves (Substrate fungible semantics); only the excess locks free.
  const lockedFree = frozen > reserved ? frozen - reserved : BigInt(0);
  const transferable = free > lockedFree ? free - lockedFree : BigInt(0);
  return { free, reserved, frozen, transferable };
}

export async function getBalances(
  api: ApiPromise,
  address: string,
): Promise<Balances> {
  const info = await api.query.system.account(address);
  return balancesFrom(info as unknown as AccountInfoLike);
}

export interface StakePosition {
  hotkey: string;
  netuid: number;
  /** Stake in alpha (9 decimals). */
  alpha: bigint;
  /** TAO you would get unstaking all of it now (swap simulation, after fees). */
  taoValue: bigint;
}

interface StakeInfoJson {
  hotkey: string;
  netuid: number;
  stake: number | string;
}

/** Every (hotkey, subnet) stake of a coldkey, valued with the chain's own swap simulation. */
export async function getStakes(
  api: ApiPromise,
  coldkey: string,
): Promise<StakePosition[]> {
  const raw = (
    await api.call.stakeInfoRuntimeApi.getStakeInfoForColdkey(coldkey)
  ).toJSON() as unknown as StakeInfoJson[];
  const positions = raw
    .map((s) => ({
      hotkey: s.hotkey,
      netuid: s.netuid,
      alpha: BigInt(s.stake),
    }))
    .filter((s) => s.alpha > BigInt(0));
  return Promise.all(
    positions.map(async (s) => {
      // Root (netuid 0) stake is TAO 1:1, not a swap.
      if (s.netuid === 0) {
        return { ...s, taoValue: s.alpha };
      }
      const sim = (
        await api.call.swapRuntimeApi.simSwapAlphaForTao(s.netuid, s.alpha)
      ).toJSON() as unknown as SimSwapJson;
      return { ...s, taoValue: BigInt(sim.taoAmount) };
    }),
  );
}

interface SimSwapJson {
  taoAmount: number | string;
  alphaAmount: number | string;
  taoFee: number | string;
  alphaFee: number | string;
}

export interface SwapQuote {
  netuid: number;
  /** Spot price now, rao of TAO per 1 alpha. */
  price: bigint;
  /** TAO in (stake) or out (unstake), rao. */
  tao: bigint;
  /** Alpha out (stake) or in (unstake). */
  alpha: bigint;
  /** Swap fee, in rao: TAO for stake, alpha for unstake. */
  fee: bigint;
  /** Average price of this swap, rao of TAO per 1 alpha. */
  averagePrice: bigint;
  /** How far the average price is from spot, in basis points (always >= 0). */
  priceImpactBps: number;
  /**
   * Predicted spot price after this swap. The chain checks `limitPrice` against the
   * price AFTER the swap (localnet, 00-research.md "X05 stake units"). For the
   * constant-product pool the end price is average² / spot, for stake and unstake.
   */
  priceAfter: bigint;
  /** `limitPrice` for the *Limit call: `priceAfter` widened by the slippage. */
  limitPrice: bigint;
  slippageBps: number;
}

export const DEFAULT_SLIPPAGE_BPS = 100;

/** Quote staking `taoRao` into `netuid` with the chain's swap simulation (no signing). */
export async function quoteStake(
  api: ApiPromise,
  netuid: number,
  taoRao: bigint,
  slippageBps: number = DEFAULT_SLIPPAGE_BPS,
): Promise<SwapQuote> {
  const price = await currentPrice(api, netuid);
  const sim = (
    await api.call.swapRuntimeApi.simSwapTaoForAlpha(netuid, taoRao)
  ).toJSON() as unknown as SimSwapJson;
  const alpha = BigInt(sim.alphaAmount);
  const taoSwapped = BigInt(sim.taoAmount);
  const averagePrice =
    alpha > BigInt(0) ? (taoSwapped * UNIT) / alpha : BigInt(0);
  return {
    netuid,
    price,
    tao: taoRao,
    alpha,
    fee: BigInt(sim.taoFee),
    averagePrice,
    priceImpactBps: impactBps(price, averagePrice),
    priceAfter: endPrice(price, averagePrice),
    // Buying alpha: the highest end price you accept.
    limitPrice:
      (endPrice(price, averagePrice) * (BPS + BigInt(slippageBps))) / BPS,
    slippageBps,
  };
}

/** Quote unstaking `alpha` from `netuid`. */
export async function quoteUnstake(
  api: ApiPromise,
  netuid: number,
  alpha: bigint,
  slippageBps: number = DEFAULT_SLIPPAGE_BPS,
): Promise<SwapQuote> {
  const price = await currentPrice(api, netuid);
  const sim = (
    await api.call.swapRuntimeApi.simSwapAlphaForTao(netuid, alpha)
  ).toJSON() as unknown as SimSwapJson;
  const tao = BigInt(sim.taoAmount);
  const alphaSwapped = BigInt(sim.alphaAmount);
  const averagePrice =
    alphaSwapped > BigInt(0) ? (tao * UNIT) / alphaSwapped : BigInt(0);
  return {
    netuid,
    price,
    tao,
    alpha,
    fee: BigInt(sim.alphaFee),
    averagePrice,
    priceImpactBps: impactBps(price, averagePrice),
    priceAfter: endPrice(price, averagePrice),
    // Selling alpha: the lowest end price you accept.
    limitPrice:
      (endPrice(price, averagePrice) * (BPS - BigInt(slippageBps))) / BPS,
    slippageBps,
  };
}

export async function currentPrice(
  api: ApiPromise,
  netuid: number,
): Promise<bigint> {
  return BigInt(
    (await api.call.swapRuntimeApi.currentAlphaPrice(netuid)).toString(),
  );
}

function endPrice(spot: bigint, average: bigint): bigint {
  return spot === BigInt(0) || average === BigInt(0)
    ? spot
    : (average * average) / spot;
}

function impactBps(spot: bigint, average: bigint): number {
  if (spot === BigInt(0) || average === BigInt(0)) {
    return 0;
  }
  const diff = average > spot ? average - spot : spot - average;
  return Number((diff * BPS) / spot);
}

/** "1.10 TAO/α"-style price: rao of TAO per alpha with 4 decimals. */
export function formatPrice(price: bigint): string {
  const whole = price / UNIT;
  const frac = ((price % UNIT) * BigInt(10_000)) / UNIT;
  return `${whole}.${frac.toString().padStart(4, "0")}`;
}

export interface SubnetSummary {
  netuid: number;
  name: string;
  symbol: string;
  ownerHotkey: string;
  /** Spot price, rao of TAO per 1 alpha. */
  price: bigint;
}

interface DynamicInfoJson {
  netuid: number;
  ownerHotkey: string;
  subnetName: number[] | string;
  tokenSymbol: number[] | string;
}

function bytesText(value: number[] | string): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(value),
    );
  } catch {
    return "";
  }
}

/** Live subnets (root, netuid 0, excluded: it is not an alpha pool). */
export async function listSubnets(api: ApiPromise): Promise<SubnetSummary[]> {
  const infos = (
    await api.call.subnetInfoRuntimeApi.getAllDynamicInfo()
  ).toJSON() as unknown as (DynamicInfoJson | null)[];
  const prices = (
    await api.call.swapRuntimeApi.currentAlphaPriceAll()
  ).toJSON() as unknown as { netuid: number; price: number | string }[];
  const priceOf = new Map(prices.map((p) => [p.netuid, BigInt(p.price)]));
  return infos
    .filter((i): i is DynamicInfoJson => i !== null && i.netuid !== 0)
    .map((i) => ({
      netuid: i.netuid,
      name: bytesText(i.subnetName),
      symbol: bytesText(i.tokenSymbol),
      ownerHotkey: i.ownerHotkey,
      price: priceOf.get(i.netuid) ?? BigInt(0),
    }));
}
