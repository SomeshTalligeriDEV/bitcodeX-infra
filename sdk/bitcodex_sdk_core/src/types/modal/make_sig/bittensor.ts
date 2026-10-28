import type { MakeSigError } from "./common";

export interface MakeBittensorSigModalResult {
  chain_type: "bittensor";
  sig_result: MakeBittensorSigResult;
}

export type MakeBittensorSigData =
  | MakeBittensorExtrinsicSignData
  | MakeBittensorRawSignData;

export interface MakeBittensorExtrinsicSignData {
  chain_type: "bittensor";
  sign_type: "extrinsic";
  payload: BittensorExtrinsicSignPayload;
}

export interface MakeBittensorRawSignData {
  chain_type: "bittensor";
  sign_type: "raw";
  payload: BittensorRawSignPayload;
}

/**
 * polkadot.js `SignerPayloadJSON`, as sent by `Signer.signPayload`. Kept as plain JSON
 * here so sdk-core does not depend on @polkadot/types.
 *
 * The iframe derives the bytes to sign from this payload itself (SCALE-encode with the
 * chain's registry, blake2_256 when > 256 bytes) and checks `genesisHash` and `address`.
 * No pre-computed "message to sign" is ever accepted from the host.
 */
export interface BittensorSignerPayloadJSON {
  address: string;
  blockHash: string;
  blockNumber: string;
  era: string;
  genesisHash: string;
  method: string;
  nonce: string;
  signedExtensions: string[];
  specVersion: string;
  tip: string;
  transactionVersion: string;
  version: number;
  assetId?: string | number | object;
  metadataHash?: string;
  mode?: number;
  withSignedTransaction?: boolean;
}

export interface BittensorExtrinsicSignPayload {
  origin: string;
  /** SS58 address of the signing coldkey. */
  signer: string;
  chain_id: string;
  data: {
    signer_payload: BittensorSignerPayloadJSON;
  };
}

export interface BittensorRawSignPayload {
  origin: string;
  signer: string;
  chain_id: string;
  data: {
    /**
     * Hex of the message bytes. The iframe signs `<Bytes>` + message + `</Bytes>`
     * (polkadot.js `u8aWrapBytes`), so a raw signature can never authorize an extrinsic.
     */
    message: string;
  };
}

export type MakeBittensorSigResult =
  /** Extrinsic: MultiSignature hex, `0x00` + 64-byte ed25519 signature. */
  | { type: "multi_signature"; signature: string }
  /** Raw message: plain 64-byte ed25519 signature hex, as polkadot.js `signRaw` returns. */
  | { type: "signature"; signature: string };

export type MakeBittensorSigError =
  | { type: "unknown_error"; error: any }
  | { type: "network_refused"; error: string }
  | { type: "signer_mismatch"; error: string }
  | MakeSigError;
