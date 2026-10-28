import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type {
  CheckEmailRequest,
  CheckEmailResponseV2,
} from "@bitcodex/bitcodex-types/user";
import type { Result } from "@bitcodex/stdlib-js";

import {
  makeBitcodeXApiRequest,
  TSS_V2_ENDPOINT,
} from "@bitcodex-attached/requests/bitcodex_api";
import type { FetchError } from "@bitcodex-attached/requests/types";

export async function checkUserExistsV2(
  email: string,
  authType: AuthType,
): Promise<Result<BitcodeXApiResponse<CheckEmailResponseV2>, FetchError>> {
  const res = await makeBitcodeXApiRequest<
    CheckEmailRequest,
    CheckEmailResponseV2
  >(
    "user/check",
    {
      email,
      auth_type: authType,
    },
    TSS_V2_ENDPOINT,
  );

  return res;
}
