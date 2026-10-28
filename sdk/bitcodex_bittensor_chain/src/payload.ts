import type { Registry, SignerPayloadJSON } from "@polkadot/types/types";
import { blake2AsU8a } from "@polkadot/util-crypto";

/** Substrate rule: payloads longer than 256 bytes are signed as blake2_256(payload). */
export const MAX_RAW_PAYLOAD = 256;

/** The exact bytes a signer must sign for a SCALE-encoded signer payload. */
export function signingBytes(encodedPayload: Uint8Array): Uint8Array {
  return encodedPayload.length > MAX_RAW_PAYLOAD
    ? blake2AsU8a(encodedPayload, 256)
    : encodedPayload;
}

/** SCALE-encode a polkadot.js signer payload with the chain's registry. */
export function encodePayload(
  registry: Registry,
  payload: SignerPayloadJSON,
): Uint8Array {
  return registry
    .createType("ExtrinsicPayload", payload, { version: payload.version })
    .toU8a({ method: true });
}

/**
 * Bytes to sign for a signer payload. The iframe must compute this itself from the
 * payload it displays; it must never sign bytes supplied by the host app.
 */
export function payloadBytes(
  registry: Registry,
  payload: SignerPayloadJSON,
): Uint8Array {
  return signingBytes(encodePayload(registry, payload));
}
