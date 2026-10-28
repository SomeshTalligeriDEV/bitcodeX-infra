import type { Result } from "@bitcodex/stdlib-js";
import { u8aConcat, u8aToHex } from "@polkadot/util";

/** MultiSignature variant index for Ed25519. */
export const MULTISIG_ED25519 = 0x00;

/**
 * Wrap a 64-byte ed25519 signature as a SCALE MultiSignature::Ed25519 (0x00 || sig),
 * the form a polkadot.js `Signer.signPayload` must return.
 */
export function wrapEd25519(
  signature: Uint8Array,
): Result<`0x${string}`, string> {
  if (signature.length !== 64) {
    return {
      success: false,
      err: `ed25519 signature must be 64 bytes, got ${signature.length}`,
    };
  }
  return {
    success: true,
    data: u8aToHex(u8aConcat(new Uint8Array([MULTISIG_ED25519]), signature)),
  };
}
