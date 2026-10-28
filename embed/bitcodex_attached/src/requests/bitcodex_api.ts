import type {
  CommitRequestBody,
  CommitResponseData,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type {
  CommitRevealParams,
  OperationType,
} from "@bitcodex/bitcodex-types/commit_reveal";
import type { NodeStatusInfo } from "@bitcodex/bitcodex-types/tss";
import type {
  ReportKeyShareNotFoundBody,
  ReportKeyShareNotFoundResponse,
  SaveReferralRequest,
  SaveReferralResponse,
  SignInRequest,
  SignInResponseV2,
} from "@bitcodex/bitcodex-types/user";
import type { Result } from "@bitcodex/stdlib-js";

import { BITCODEX_API_ENDPOINT } from "./endpoints";
import type { FetchError } from "./types";

export const TSS_V1_ENDPOINT = `${BITCODEX_API_ENDPOINT}/tss/v1`;
export const TSS_V2_ENDPOINT = `${BITCODEX_API_ENDPOINT}/tss/v2`;
export const SOCIAL_LOGIN_V1_ENDPOINT = `${BITCODEX_API_ENDPOINT}/social-login/v1`;
export const SOCIAL_LOGIN_V2_ENDPOINT = `${BITCODEX_API_ENDPOINT}/social-login/v2`;

export async function makeBitcodeXApiRequest<T, R>(
  path: string,
  args: T,
  baseUrl: string = TSS_V1_ENDPOINT,
): Promise<Result<BitcodeXApiResponse<R>, FetchError>> {
  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
  } catch (err: any) {
    return { success: false, err: err.toString() };
  }

  if (!resp.ok) {
    return {
      success: false,
      err: { type: "status_fail", status: resp.status },
    };
  }

  try {
    const result = (await resp.json()) as BitcodeXApiResponse<R>;
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, err: err.toString() };
  }
}

export async function makeAuthorizedBitcodeXApiRequest<T, R>(
  path: string,
  idToken: string,
  args: T,
  baseUrl: string = TSS_V1_ENDPOINT,
  commitReveal?: CommitRevealParams,
  apiKey?: string,
): Promise<Result<BitcodeXApiResponse<R>, FetchError>> {
  const body = commitReveal ? { ...args, ...commitReveal } : args;

  let resp: Response;
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    resp = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    return { success: false, err: err };
  }

  if (!resp.ok) {
    return {
      success: false,
      err: { type: "status_fail", status: resp.status },
    };
  }

  try {
    const result = (await resp.json()) as BitcodeXApiResponse<R>;
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, err: err };
  }
}

export async function commitToBitcodeXApi(
  sessionId: string,
  operationType: OperationType,
  clientEphemeralPubkey: string,
  idTokenHash: string,
): Promise<Result<BitcodeXApiResponse<CommitResponseData>, FetchError>> {
  return makeBitcodeXApiRequest<CommitRequestBody, CommitResponseData>(
    "commit",
    {
      session_id: sessionId,
      operation_type: operationType,
      client_ephemeral_pubkey: clientEphemeralPubkey,
      id_token_hash: idTokenHash,
    },
    TSS_V2_ENDPOINT,
  );
}

export async function signInV2(
  idToken: string,
  authType: AuthType,
  commitReveal: CommitRevealParams,
  apiKey?: string,
): Promise<
  Result<SignInResponseV2, { type: "sign_in_request_fail"; error: string }>
> {
  const signInRes = await makeAuthorizedBitcodeXApiRequest<
    SignInRequest,
    SignInResponseV2
  >(
    "user/signin",
    idToken,
    { auth_type: authType },
    TSS_V2_ENDPOINT,
    commitReveal,
    apiKey,
  );

  if (!signInRes.success) {
    console.error("[attached] sign in failed, err: %s", signInRes.err);
    return {
      success: false,
      err: { type: "sign_in_request_fail", error: signInRes.err.toString() },
    };
  }

  const apiResponse = signInRes.data;
  if (!apiResponse.success) {
    console.error(
      "[attached] sign in request failed, err: %s",
      apiResponse.msg,
    );
    return {
      success: false,
      err: {
        type: "sign_in_request_fail",
        error: `code: ${apiResponse.code}`,
      },
    };
  }

  return { success: true, data: apiResponse.data };
}

export async function saveReferralV2(
  authToken: string,
  data: SaveReferralRequest,
): Promise<void> {
  const res = await makeAuthorizedBitcodeXApiRequest<
    SaveReferralRequest,
    SaveReferralResponse
  >("referral", authToken, data, SOCIAL_LOGIN_V2_ENDPOINT);

  if (!res.success) {
    throw new Error(
      `Save referral V2 fetch failed: ${JSON.stringify(res.err)}`,
    );
  }

  const apiResponse = res.data;
  if (!apiResponse.success) {
    throw new Error(`Save referral V2 API error: ${apiResponse.msg}`);
  }
}

/**
 * Report nodes that returned KEY_SHARE_NOT_FOUND during sign-in.
 *
 * This marks the nodes as UNRECOVERABLE_DATA_LOSS in bitcodex_api,
 * triggering a reshare on the next sign-in attempt.
 *
 * @param jwtToken - JWT token from sign-in response
 * @param notFoundNodes - Nodes that returned KEY_SHARE_NOT_FOUND
 */
export async function reportKeyShareNotFound(
  jwtToken: string,
  notFoundNodes: NodeStatusInfo[],
): Promise<void> {
  if (notFoundNodes.length === 0) {
    return;
  }

  const body: ReportKeyShareNotFoundBody = {
    nodes: notFoundNodes.map((n) => ({ name: n.name, endpoint: n.endpoint })),
  };

  try {
    const res = await fetch(
      `${TSS_V2_ENDPOINT}/user/report_key_share_not_found`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      console.warn(
        `[attached] reportKeyShareNotFound failed: HTTP ${res.status}`,
      );
      return;
    }

    const data = (await res.json()) as ReportKeyShareNotFoundResponse;
    console.log(
      `[attached] reportKeyShareNotFound: updated ${data.updated_count_secp256k1} secp256k1, ${data.updated_count_ed25519} ed25519`,
    );
  } catch (err) {
    console.warn(`[attached] reportKeyShareNotFound error: ${String(err)}`);
  }
}
