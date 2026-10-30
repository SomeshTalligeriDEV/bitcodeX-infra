import { TAO_DECIMALS } from "./networks";

/**
 * A call as plain JSON (`codec.toJSON()` per argument), with nested calls already split
 * out into `inner` (utility.batch*, proxy.proxy*, utility.asDerivative).
 */
export interface PlainCall {
  section: string;
  method: string;
  args: Record<string, unknown>;
  inner: PlainCall[];
}

export interface CardRow {
  label: string;
  value: string;
  /** Addresses and hashes: render monospace. */
  mono?: boolean;
}

export interface CallCard {
  section: string;
  method: string;
  /** Plain-English title, e.g. "Send TAO". */
  title: string;
  rows: CardRow[];
  /** Red warning text for calls that can move all funds or hand over control. */
  danger: string | null;
  /** False for any call this decoder does not describe: the modal shows it raw, in red. */
  known: boolean;
  inner: CallCard[];
}

const RAO_PER_UNIT = BigInt(10) ** BigInt(TAO_DECIMALS);

/** A u64/Compact JSON value (number, decimal string or hex string) as bigint. */
export function toBigIntValue(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^(0x[0-9a-fA-F]+|\d+)$/.test(value)) {
    return BigInt(value);
  }
  return null;
}

/** rao -> "1.5" with up to 9 decimals, trailing zeros trimmed. */
export function formatUnits(rao: bigint): string {
  const negative = rao < BigInt(0);
  const abs = negative ? -rao : rao;
  const whole = abs / RAO_PER_UNIT;
  const frac = (abs % RAO_PER_UNIT)
    .toString()
    .padStart(TAO_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

export function formatTaoAmount(rao: bigint): string {
  return `${formatUnits(rao)} TAO`;
}

function amount(value: unknown, unit: string): string {
  const big = toBigIntValue(value);
  return big === null ? String(value) : `${formatUnits(big)} ${unit}`;
}

/** AccountId32 JSON is the SS58 string; MultiAddress JSON is `{ id: "5…" }` (or other variants). */
function address(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1) {
      const [variant, inner] = entries[0];
      return variant === "id" ? String(inner) : `${variant}: ${String(inner)}`;
    }
  }
  return JSON.stringify(value);
}

function subnet(value: unknown): string {
  return `Subnet ${String(value)}`;
}

function option(value: unknown, render: (v: unknown) => string): string {
  return value === null || value === undefined ? "none" : render(value);
}

function bool(value: unknown): string {
  return value === true ? "yes" : "no";
}

/** Bytes JSON is hex; show it as text when it decodes to printable UTF-8. */
export function bytesToText(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("0x")) {
    return String(value);
  }
  const hex = value.slice(2);
  if (hex.length % 2 !== 0) {
    return value;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
    return /[\u0000-\u0008\u000e-\u001f\u007f]/.test(text) ? value : text;
  } catch {
    return value;
  }
}

/** Limit prices are rao of TAO per 1 alpha (u64, 9 decimals). */
function price(value: unknown): string {
  return `${amount(value, "TAO")} per alpha`;
}

type Describer = (args: Record<string, unknown>) => {
  title: string;
  rows: CardRow[];
  danger?: string;
};

const DESCRIBERS: Record<string, Describer> = {
  "balances.transferKeepAlive": (a) => ({
    title: "Send TAO",
    rows: [
      { label: "To", value: address(a.dest), mono: true },
      { label: "Amount", value: amount(a.value, "TAO") },
    ],
  }),
  "balances.transferAllowDeath": (a) => ({
    title: "Send TAO (may close account)",
    rows: [
      { label: "To", value: address(a.dest), mono: true },
      { label: "Amount", value: amount(a.value, "TAO") },
    ],
    danger:
      "If your balance falls below the minimum, this account is closed and the rest is lost.",
  }),
  "balances.transferAll": (a) => ({
    title: "Send ALL TAO",
    rows: [
      { label: "To", value: address(a.dest), mono: true },
      { label: "Keep account open", value: bool(a.keepAlive) },
    ],
    danger: "This sends your entire free balance.",
  }),

  "subtensorModule.addStake": (a) => ({
    title: "Stake TAO",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "Amount", value: amount(a.amountStaked, "TAO") },
    ],
  }),
  "subtensorModule.addStakeLimit": (a) => ({
    title: "Stake TAO (with price limit)",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "Amount", value: amount(a.amountStaked, "TAO") },
      { label: "Limit price", value: price(a.limitPrice) },
      { label: "Allow partial fill", value: bool(a.allowPartial) },
    ],
  }),
  "subtensorModule.removeStake": (a) => ({
    title: "Unstake",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "Amount", value: amount(a.amountUnstaked, "alpha") },
    ],
  }),
  "subtensorModule.removeStakeLimit": (a) => ({
    title: "Unstake (with price limit)",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "Amount", value: amount(a.amountUnstaked, "alpha") },
      { label: "Limit price", value: price(a.limitPrice) },
      { label: "Allow partial fill", value: bool(a.allowPartial) },
    ],
  }),
  "subtensorModule.removeStakeFullLimit": (a) => ({
    title: "Unstake everything on a subnet",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "Limit price", value: option(a.limitPrice, price) },
    ],
  }),
  "subtensorModule.unstakeAll": (a) => ({
    title: "Unstake everything",
    rows: [{ label: "Validator hotkey", value: address(a.hotkey), mono: true }],
    danger: "Removes all your stake from this hotkey on every subnet.",
  }),
  "subtensorModule.unstakeAllAlpha": (a) => ({
    title: "Unstake all alpha",
    rows: [{ label: "Validator hotkey", value: address(a.hotkey), mono: true }],
    danger: "Removes all your alpha stake from this hotkey.",
  }),
  "subtensorModule.moveStake": (a) => ({
    title: "Move stake",
    rows: [
      { label: "From hotkey", value: address(a.originHotkey), mono: true },
      { label: "From subnet", value: subnet(a.originNetuid) },
      { label: "To hotkey", value: address(a.destinationHotkey), mono: true },
      { label: "To subnet", value: subnet(a.destinationNetuid) },
      { label: "Amount", value: amount(a.alphaAmount, "alpha") },
    ],
  }),
  "subtensorModule.swapStake": (a) => ({
    title: "Swap stake between subnets",
    rows: [
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "From subnet", value: subnet(a.originNetuid) },
      { label: "To subnet", value: subnet(a.destinationNetuid) },
      { label: "Amount", value: amount(a.alphaAmount, "alpha") },
    ],
  }),
  "subtensorModule.transferStake": (a) => ({
    title: "Give stake to another wallet",
    rows: [
      {
        label: "To wallet",
        value: address(a.destinationColdkey),
        mono: true,
      },
      { label: "Validator hotkey", value: address(a.hotkey), mono: true },
      { label: "From subnet", value: subnet(a.originNetuid) },
      { label: "To subnet", value: subnet(a.destinationNetuid) },
      { label: "Amount", value: amount(a.alphaAmount, "alpha") },
    ],
    danger: "The stake leaves your wallet and belongs to the other wallet.",
  }),
  "subtensorModule.burnedRegister": (a) => ({
    title: "Register a hotkey on a subnet",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Hotkey", value: address(a.hotkey), mono: true },
      {
        label: "Cost",
        value: "the subnet's current burn (charged in TAO)",
      },
    ],
  }),
  "subtensorModule.registerLimit": (a) => ({
    title: "Register a hotkey on a subnet",
    rows: [
      { label: "Subnet", value: subnet(a.netuid) },
      { label: "Hotkey", value: address(a.hotkey), mono: true },
      { label: "Cost (at most)", value: amount(a.limitPrice, "TAO") },
    ],
  }),
  "subtensorModule.registerNetwork": (a) => ({
    title: "Create a subnet",
    rows: [
      { label: "Owner hotkey", value: address(a.hotkey), mono: true },
      { label: "Cost", value: "the current subnet lock cost (in TAO)" },
    ],
  }),
  "subtensorModule.registerNetworkWithIdentity": (a) => ({
    title: "Create a subnet",
    rows: [
      { label: "Owner hotkey", value: address(a.hotkey), mono: true },
      {
        label: "Identity",
        value: a.identity ? "included" : "none",
      },
      { label: "Cost", value: "the current subnet lock cost (in TAO)" },
    ],
  }),
  "subtensorModule.swapHotkey": (a) => ({
    title: "Replace a hotkey",
    rows: [
      { label: "Old hotkey", value: address(a.hotkey), mono: true },
      { label: "New hotkey", value: address(a.newHotkey), mono: true },
      { label: "Subnet", value: option(a.netuid, subnet) },
    ],
    danger: "Registrations and stake move to the new hotkey.",
  }),
  "subtensorModule.scheduleSwapColdkey": (a) => ({
    title: "Move this wallet to a new coldkey",
    rows: [{ label: "New coldkey", value: address(a.newColdkey), mono: true }],
    danger:
      "After the delay, ALL your TAO, stake and subnets move to the new coldkey. Only approve if you control it.",
  }),
  "subtensorModule.swapColdkey": (a) => ({
    title: "Swap coldkey",
    rows: [
      { label: "Old coldkey", value: address(a.oldColdkey), mono: true },
      { label: "New coldkey", value: address(a.newColdkey), mono: true },
      { label: "Swap cost", value: amount(a.swapCost, "TAO") },
    ],
    danger: "ALL your TAO, stake and subnets move to the new coldkey.",
  }),

  "proxy.addProxy": (a) => ({
    title: "Give an app or agent permission",
    rows: [
      { label: "Delegate", value: address(a.delegate), mono: true },
      { label: "Permission", value: String(a.proxyType) },
      { label: "Delay (blocks)", value: String(a.delay) },
      { label: "Deposit", value: "reserved from your balance until removed" },
    ],
    danger:
      a.proxyType === "Any" || a.proxyType === "NonTransfer"
        ? `"${String(a.proxyType)}" lets the delegate act broadly on your behalf.`
        : undefined,
  }),
  "proxy.removeProxy": (a) => ({
    title: "Remove a permission",
    rows: [
      { label: "Delegate", value: address(a.delegate), mono: true },
      { label: "Permission", value: String(a.proxyType) },
      { label: "Delay (blocks)", value: String(a.delay) },
    ],
  }),
  "proxy.removeProxies": () => ({
    title: "Remove all permissions",
    rows: [],
  }),
  "proxy.proxy": (a) => ({
    title: "Act on behalf of another wallet",
    rows: [
      { label: "On behalf of", value: address(a.real), mono: true },
      {
        label: "Permission used",
        value: option(a.forceProxyType, String),
      },
    ],
  }),

  "utility.batch": () => ({
    title: "Several actions (stops at the first failure)",
    rows: [],
  }),
  "utility.batchAll": () => ({
    title: "Several actions (all or nothing)",
    rows: [],
  }),
  "utility.forceBatch": () => ({
    title: "Several actions (continues past failures)",
    rows: [],
  }),

  "system.remark": (a) => ({
    title: "On-chain note",
    rows: [{ label: "Text", value: bytesToText(a.remark) }],
  }),
  "system.remarkWithEvent": (a) => ({
    title: "On-chain note",
    rows: [{ label: "Text", value: bytesToText(a.remark) }],
  }),
};

/** Plain-English card for a call and every call nested in it; unknown calls stay raw. */
export function describeCall(call: PlainCall): CallCard {
  const inner = call.inner.map(describeCall);
  const describe = DESCRIBERS[`${call.section}.${call.method}`];
  if (!describe) {
    return {
      section: call.section,
      method: call.method,
      title: `${call.section}.${call.method}`,
      rows: Object.entries(call.args).map(([label, value]) => ({
        label,
        value: typeof value === "string" ? value : JSON.stringify(value),
        mono: true,
      })),
      danger: "Unknown call: BitcodeX cannot explain it. Check it carefully.",
      known: false,
      inner,
    };
  }
  const { title, rows, danger } = describe(call.args);
  // A known wrapper around an unknown call is still unknown.
  const known = inner.every((c) => c.known);
  return {
    section: call.section,
    method: call.method,
    title,
    rows,
    danger: danger ?? null,
    known,
    inner,
  };
}

/** Every call in the tree, depth first (e.g. a transfer hidden inside a batch). */
export function flattenCards(card: CallCard): CallCard[] {
  return [card, ...card.inner.flatMap(flattenCards)];
}
