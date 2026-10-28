import type { Result } from "@bitcodex/stdlib-js";
import { hexToU8a, isHex } from "@polkadot/util";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

import { SS58_PREFIX } from "./networks";

/**
 * SS58 address (prefix 42, starts with "5") for a 32-byte ed25519 public key.
 * For ed25519 and sr25519 the AccountId is the raw public key, so this is the coldkey
 * address of a BitcodeX FROST group key (verified on localnet, probe 3b).
 */
export function toAddress(
  publicKey: Uint8Array | string,
): Result<string, string> {
  let bytes: Uint8Array | null = null;
  if (typeof publicKey !== "string") {
    bytes = publicKey;
  } else {
    const hex = publicKey.startsWith("0x") ? publicKey : `0x${publicKey}`;
    bytes = isHex(hex) ? hexToU8a(hex) : null;
  }
  if (!bytes) {
    return { success: false, err: "public key must be bytes or hex" };
  }
  if (bytes.length !== 32) {
    return {
      success: false,
      err: `public key must be 32 bytes, got ${bytes.length}`,
    };
  }
  return { success: true, data: encodeAddress(bytes, SS58_PREFIX) };
}

/** Public key bytes of an SS58 address; fails on a malformed address or checksum. */
export function fromAddress(address: string): Result<Uint8Array, string> {
  try {
    return { success: true, data: decodeAddress(address) };
  } catch (err) {
    return { success: false, err: `invalid address: ${String(err)}` };
  }
}
