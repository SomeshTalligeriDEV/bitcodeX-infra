import { reqAbortTssSession } from "@bitcodex/api-lib";
import type { MakeSignOutputError } from "@bitcodex/bitcodex-sdk-core";
import {
  runPresign,
  runSign,
  runTriples,
} from "@bitcodex/cait-sith-cosmos-compat-hooks";
import type { Result } from "@bitcodex/stdlib-js";
import type { SignOutput } from "@bitcodex/tecdsa-interface";

import { TSS_V2_ENDPOINT } from "@bitcodex-attached/requests/bitcodex_api";

export async function makeSignOutput(
  hash: Uint8Array,
  publicKey: string,
  keyshare0: string,
  apiKey: string,
  authToken: string,
  getIsAborted: () => boolean,
): Promise<Result<SignOutput, MakeSignOutputError>> {
  const currentAuthToken = authToken;

  const triplesRes = await runTriples(
    TSS_V2_ENDPOINT,
    apiKey,
    currentAuthToken,
    getIsAborted,
  );
  if (!triplesRes.success) {
    console.log("triples fail", triplesRes.err);

    return {
      success: false,
      err: { type: "triples_fail", error: triplesRes.err },
    };
  }

  const { triple0, triple1, sessionId } = triplesRes.data;

  const presignRes = await runPresign(
    TSS_V2_ENDPOINT,
    sessionId,
    {
      triple0,
      triple1,
    },
    {
      public_key: publicKey,
      private_share: keyshare0,
    },
    currentAuthToken,
    getIsAborted,
  );

  if (!presignRes.success) {
    if (presignRes.err.type === "aborted") {
      await reqAbortTssSession(
        TSS_V2_ENDPOINT,
        { session_id: sessionId },
        currentAuthToken,
      );
    }

    return {
      success: false,
      err: { type: "presign_fail", error: presignRes.err },
    };
  }

  const signOutput = await runSign(
    TSS_V2_ENDPOINT,
    sessionId,
    hash,
    presignRes.data,
    currentAuthToken,
    getIsAborted,
  );
  if (!signOutput.success) {
    if (signOutput.err.type === "aborted") {
      await reqAbortTssSession(
        TSS_V2_ENDPOINT,
        { session_id: sessionId },
        currentAuthToken,
      );
    }

    return {
      success: false,
      err: { type: "sign_fail", error: signOutput.err },
    };
  }

  return { success: true, data: signOutput.data };
}
