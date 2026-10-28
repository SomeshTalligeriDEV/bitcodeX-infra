import type {
  KeyPackageRaw,
  PublicKeyPackageRaw,
} from "@bitcodex/bitcodex-types/teddsa";
import type { Bytes32 } from "@bitcodex/bytes";

export interface TeddsaKeygenOutputBytes {
  key_package: KeyPackageRaw;
  public_key_package: PublicKeyPackageRaw;
  identifier: Uint8Array;
  public_key: Bytes32;
}

export interface TeddsaKeygenResult {
  keygen_1: TeddsaKeygenOutputBytes;
  keygen_2: TeddsaKeygenOutputBytes;
}
