import type { MakeSignOutputError } from "@bitcodex/bitcodex-sdk-core";
import type {
  KeyPackageRaw,
  PublicKeyPackageRaw,
} from "@bitcodex/bitcodex-types/teddsa";
import type { Result } from "@bitcodex/stdlib-js";
import { runTeddsaSign } from "@bitcodex/teddsa-hooks";

import { TSS_V2_ENDPOINT } from "@bitcodex-attached/requests/bitcodex_api";

export interface KeyPackageEd25519 {
  keyPackage: KeyPackageRaw;
  publicKeyPackage: PublicKeyPackageRaw;
  identifier: Uint8Array;
}

export async function makeSignOutputEd25519(
  message: Uint8Array,
  keyPackage: KeyPackageEd25519,
  apiKey: string,
  authToken: string,
  getIsAborted: () => boolean,
): Promise<Result<Uint8Array, MakeSignOutputError>> {
  const signResult = await runTeddsaSign(
    TSS_V2_ENDPOINT,
    message,
    keyPackage.keyPackage,
    keyPackage.publicKeyPackage,
    authToken,
    apiKey,
    getIsAborted,
  );

  if (!signResult.success) {
    if (signResult.err.type === "aborted") {
      return { success: false, err: { type: "aborted" } };
    }
    return {
      success: false,
      err: {
        type: "sign_fail",
        error: signResult.err,
      },
    };
  }

  return { success: true, data: signResult.data };
}
