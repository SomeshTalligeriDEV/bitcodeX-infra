/**
 * Sign-In with Bittensor: a CAIP-122 ("Sign-In with X") profile for Subtensor.
 *
 * CAIP-122 defines the message template and data model and asks each namespace to
 * define a profile. The Polkadot namespace has none (checked 2026-10-29), so this is
 * BitcodeX's profile, built only from published pieces:
 * - template and field rules: CAIP-122;
 * - chain id: CAIP-2 `polkadot:<first 32 hex chars of the genesis hash, lowercase>`;
 * - account: CAIP-10 Polkadot account address = SS58, here prefix 42;
 * - signing input: the message bytes wrapped in `<Bytes>…</Bytes>` (polkadot.js
 *   `u8aWrapBytes`), which is what every Substrate wallet signs for a raw message;
 * - verification: `@polkadot/util-crypto` `signatureVerify` (ed25519, sr25519, ecdsa).
 * See bitcodex-docs/00-research.md "Sign-In with Bittensor".
 */
import type { Result } from "@bitcodex/stdlib-js";
import { stringToU8a, u8aToHex, u8aWrapBytes } from "@polkadot/util";
import { checkAddress, signatureVerify } from "@polkadot/util-crypto";

import { SS58_PREFIX } from "./networks";

export const SIWB_BLOCKCHAIN = "Bittensor";
export const SIWB_VERSION = "1";

export interface SiwbFields {
  /** RFC 4501 authority, e.g. "app.example.com" or "localhost:3200". */
  domain: string;
  /** SS58 address, prefix 42. */
  address: string;
  statement?: string;
  /** RFC 3986 URI the sign-in is for. */
  uri: string;
  version: string;
  /** CAIP-2 chain id, `polkadot:<32 lowercase hex>`. */
  chainId: string;
  nonce?: string;
  /** RFC 3339. */
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/** CAIP-2 chain id for a genesis hash: `polkadot:` + first 16 bytes, lowercase hex. */
export function caip2ChainId(genesisHash: string): string {
  const hex = genesisHash.toLowerCase().replace(/^0x/, "");
  return `polkadot:${hex.slice(0, 32)}`;
}

const CHAIN_ID = /^polkadot:[0-9a-f]{32}$/;
const RFC3339 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const NONCE = /^[A-Za-z0-9]{8,}$/;

function validate(f: SiwbFields): string | null {
  if (!f.domain || /[\s/]/.test(f.domain)) {
    return "domain must be a host[:port] without spaces or slashes";
  }
  const [okAddr, why] = checkAddress(f.address, SS58_PREFIX);
  if (!okAddr) {
    return `address is not a Bittensor (SS58 42) address: ${why ?? ""}`;
  }
  if (f.statement !== undefined && /[\r\n]/.test(f.statement)) {
    return "statement must not contain a newline";
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(f.uri)) {
    return "uri must be an absolute RFC 3986 URI";
  }
  if (f.version !== SIWB_VERSION) {
    return `version must be "${SIWB_VERSION}"`;
  }
  if (!CHAIN_ID.test(f.chainId)) {
    return "chainId must be polkadot:<32 lowercase hex>";
  }
  if (f.nonce !== undefined && !NONCE.test(f.nonce)) {
    return "nonce must be at least 8 alphanumeric characters";
  }
  for (const [name, v] of [
    ["issuedAt", f.issuedAt],
    ["expirationTime", f.expirationTime],
    ["notBefore", f.notBefore],
  ] as const) {
    if (v !== undefined && !RFC3339.test(v)) {
      return `${name} must be an RFC 3339 timestamp`;
    }
  }
  for (const r of f.resources ?? []) {
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\S*$/.test(r)) {
      return `resource is not a URI: ${r}`;
    }
  }
  return null;
}

/** The CAIP-122 message text, line for line. */
export function createSiwbMessage(f: SiwbFields): Result<string, string> {
  const err = validate(f);
  if (err) {
    return { success: false, err };
  }
  const lines = [
    `${f.domain} wants you to sign in with your ${SIWB_BLOCKCHAIN} account:`,
    f.address,
    "",
  ];
  if (f.statement !== undefined) {
    lines.push(f.statement, "");
  }
  lines.push(`URI: ${f.uri}`, `Version: ${f.version}`);
  if (f.nonce !== undefined) {
    lines.push(`Nonce: ${f.nonce}`);
  }
  if (f.issuedAt !== undefined) {
    lines.push(`Issued At: ${f.issuedAt}`);
  }
  if (f.expirationTime !== undefined) {
    lines.push(`Expiration Time: ${f.expirationTime}`);
  }
  if (f.notBefore !== undefined) {
    lines.push(`Not Before: ${f.notBefore}`);
  }
  if (f.requestId !== undefined) {
    lines.push(`Request ID: ${f.requestId}`);
  }
  lines.push(`Chain ID: ${f.chainId}`);
  if (f.resources && f.resources.length > 0) {
    lines.push("Resources:", ...f.resources.map((r) => `- ${r}`));
  }
  return { success: true, data: lines.join("\n") };
}

const TAGS: [string, keyof SiwbFields][] = [
  ["Nonce: ", "nonce"],
  ["Issued At: ", "issuedAt"],
  ["Expiration Time: ", "expirationTime"],
  ["Not Before: ", "notBefore"],
  ["Request ID: ", "requestId"],
];

/** Parse a message produced by `createSiwbMessage`; null if it is not one. */
export function parseSiwbMessage(text: string): SiwbFields | null {
  const lines = text.split("\n");
  const head = /^(\S+) wants you to sign in with your Bittensor account:$/.exec(
    lines[0] ?? "",
  );
  if (!head || lines[2] !== "") {
    return null;
  }
  const f: Partial<SiwbFields> & { domain: string; address: string } = {
    domain: head[1],
    address: lines[1] ?? "",
  };
  let i = 3;
  if (lines[i] !== undefined && !lines[i].startsWith("URI: ")) {
    f.statement = lines[i];
    if (lines[i + 1] !== "") {
      return null;
    }
    i += 2;
  }
  const take = (prefix: string): string | undefined => {
    if (lines[i]?.startsWith(prefix)) {
      return lines[i++].slice(prefix.length);
    }
    return undefined;
  };
  f.uri = take("URI: ");
  f.version = take("Version: ");
  for (const [prefix, key] of TAGS) {
    const v = take(prefix);
    if (v !== undefined) {
      (f as Record<string, unknown>)[key] = v;
    }
  }
  f.chainId = take("Chain ID: ");
  if (lines[i] === "Resources:") {
    i++;
    f.resources = [];
    while (lines[i]?.startsWith("- ")) {
      f.resources.push(lines[i++].slice(2));
    }
  }
  if (i !== lines.length || !f.uri || !f.version || !f.chainId) {
    return null;
  }
  const fields = f as SiwbFields;
  // Round-trip: only messages this profile would produce are accepted.
  const again = createSiwbMessage(fields);
  return again.success && again.data === text ? fields : null;
}

export interface VerifySiwbExpect {
  domain: string;
  /** The nonce the server issued for this sign-in (required: replay protection). */
  nonce: string;
  /** Genesis hash of the chain the server accepts. */
  genesisHash: string;
  /** Defaults to now. */
  now?: Date;
}

export interface VerifiedSiwb {
  fields: SiwbFields;
  /** "ed25519" for BitcodeX wallets; "sr25519"/"ecdsa" for other Substrate wallets. */
  crypto: string;
}

/**
 * Server-side check: message shape, domain, nonce, chain, time window, and the
 * signature over `<Bytes>message</Bytes>` by `fields.address`.
 */
export function verifySiwb(
  message: string,
  signature: string,
  expect: VerifySiwbExpect,
): Result<VerifiedSiwb, string> {
  const fields = parseSiwbMessage(message);
  if (!fields) {
    return { success: false, err: "not a Sign-In with Bittensor message" };
  }
  if (fields.domain !== expect.domain) {
    return {
      success: false,
      err: `domain mismatch: ${fields.domain} != ${expect.domain}`,
    };
  }
  if (fields.nonce !== expect.nonce) {
    return { success: false, err: "nonce mismatch" };
  }
  if (fields.chainId !== caip2ChainId(expect.genesisHash)) {
    return { success: false, err: `wrong chain: ${fields.chainId}` };
  }
  const now = (expect.now ?? new Date()).getTime();
  if (fields.expirationTime && Date.parse(fields.expirationTime) <= now) {
    return { success: false, err: "message expired" };
  }
  if (fields.notBefore && Date.parse(fields.notBefore) > now) {
    return { success: false, err: "message not valid yet" };
  }
  const res = signatureVerify(
    u8aWrapBytes(stringToU8a(message)),
    signature,
    fields.address,
  );
  if (!res.isValid) {
    return { success: false, err: "bad signature" };
  }
  return { success: true, data: { fields, crypto: res.crypto } };
}

/** Hex of the message as the SDK sends it to the iframe (which adds the <Bytes> wrap). */
export function siwbMessageHex(message: string): string {
  return u8aToHex(stringToU8a(message));
}
