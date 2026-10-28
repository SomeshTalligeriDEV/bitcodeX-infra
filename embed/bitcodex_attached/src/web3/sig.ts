import type { MakeSigError, SignOutput } from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";

import { makeSignOutput } from "@bitcodex-attached/crypto/sign";
import { useAppState } from "@bitcodex-attached/store/app";

export async function makeSignature(
  storageKey: string,
  msg: Uint8Array<ArrayBufferLike>,
  getIsAborted: () => boolean,
): Promise<Result<SignOutput, MakeSigError>> {
  const appState = useAppState.getState();

  const walletState = appState.getWallet(storageKey);
  const apiKey = appState.getApiKey(storageKey);
  const keyshare_1 = appState.getKeyshare_1(storageKey);
  const jwtToken = appState.getAuthToken(storageKey);

  if (!apiKey) {
    return { success: false, err: { type: "api_key_not_found" } };
  }

  if (!keyshare_1) {
    return { success: false, err: { type: "key_share_not_combined" } };
  }

  if (!walletState) {
    return { success: false, err: { type: "wallet_not_found" } };
  }

  if (!jwtToken) {
    return { success: false, err: { type: "jwt_not_found" } };
  }

  const sign_output = await makeSignOutput(
    msg,
    walletState.publicKey,
    keyshare_1,
    apiKey,
    jwtToken,
    getIsAborted,
  );

  return sign_output;
}
