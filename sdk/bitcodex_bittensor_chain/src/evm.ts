/**
 * Subtensor EVM (X13). The runtime maps an EVM address to a Subtensor account with
 * pallet_evm::HashedAddressMapping<BlakeTwo256>: account = blake2_256("evm:" ++ h160).
 * Verified 2026-10-29 against the chain's own address-mapping precompile (0x…080c) on
 * testnet (00-research.md "Subtensor EVM"). TAO sent to that SS58 "mirror" is the EVM
 * address's balance.
 */
import {
  hexToU8a,
  isHex,
  stringToU8a,
  u8aConcat,
  u8aToHex,
} from "@polkadot/util";
import {
  blake2AsU8a,
  encodeAddress,
  ethereumEncode,
} from "@polkadot/util-crypto";

import { SS58_PREFIX } from "./networks";

const EVM_PREFIX = stringToU8a("evm:");

/** The Subtensor account (SS58, prefix 42) that holds an EVM address's TAO. */
export function evmMirrorAddress(h160: string): string {
  if (!isHex(h160) || hexToU8a(h160).length !== 20) {
    throw new Error("h160 must be a 20-byte 0x address");
  }
  return encodeAddress(
    blake2AsU8a(u8aConcat(EVM_PREFIX, hexToU8a(h160)), 256),
    SS58_PREFIX,
  );
}

/** EIP-55 EVM address of a secp256k1 public key (33-byte compressed or 65-byte). */
export function evmAddressFromSecp256k1(
  publicKey: string | Uint8Array,
): string {
  const bytes =
    typeof publicKey === "string"
      ? hexToU8a(publicKey.startsWith("0x") ? publicKey : `0x${publicKey}`)
      : publicKey;
  if (bytes.length !== 33 && bytes.length !== 65) {
    throw new Error("secp256k1 public key must be 33 or 65 bytes");
  }
  return ethereumEncode(bytes);
}

export function mirrorPublicKey(h160: string): string {
  return u8aToHex(blake2AsU8a(u8aConcat(EVM_PREFIX, hexToU8a(h160)), 256));
}
