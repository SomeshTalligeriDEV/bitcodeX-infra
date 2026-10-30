import { internalKsnUrl } from "@bitcodex/admin-api/ks_node_internal_url";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type { CurveType } from "@bitcodex/bitcodex-types/crypto";
import type { Bytes32, Bytes33 } from "@bitcodex/bytes";
import type { CheckKeyShareResponse } from "@bitcodex/ksn-interface/key_share";

// @TODO: remove after ksn_interface is updated
export interface CheckKeyShareV2Response {
  secp256k1?: { exists: boolean };
  ed25519?: { exists: boolean };
}

export async function requestCheckKeyShare(
  ksNodeURI: string,
  userEmail: string,
  publicKey: Bytes32 | Bytes33,
  auth_type: AuthType,
  curve_type: CurveType,
) {
  const res = await fetch(`${internalKsnUrl(ksNodeURI)}/keyshare/v1/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_auth_id: userEmail,
      auth_type,
      curve_type,
      public_key: publicKey.toHex(),
    }),
  });
  return (await res.json()) as BitcodeXApiResponse<CheckKeyShareResponse>;
}

export async function requestCheckKeyShareV2(
  ksNodeURI: string,
  userEmail: string,
  auth_type: AuthType,
  wallets: {
    secp256k1?: Bytes33;
    ed25519?: Bytes32;
  },
) {
  const walletsPayload: { secp256k1?: string; ed25519?: string } = {};
  if (wallets.secp256k1) {
    walletsPayload.secp256k1 = wallets.secp256k1.toHex();
  }
  if (wallets.ed25519) {
    walletsPayload.ed25519 = wallets.ed25519.toHex();
  }

  const res = await fetch(`${internalKsnUrl(ksNodeURI)}/keyshare/v2/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_auth_id: userEmail,
      auth_type,
      wallets: walletsPayload,
    }),
  });
  return (await res.json()) as BitcodeXApiResponse<CheckKeyShareV2Response>;
}
