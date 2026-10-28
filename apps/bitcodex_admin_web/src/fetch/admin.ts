import type {
  AdminLoginResponse,
  AdminLogoutResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";

import { BITCODEX_ADMIN_API_ENDPOINT_V1 } from "@bitcodex-admin/fetch";
import { doFetch } from "@bitcodex-admin/fetch/fetcher";

export async function postLoginAdmin(email: string, password: string) {
  return doFetch<AdminLoginResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/user/login`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function postLogoutAdmin(
  token?: string,
): Promise<BitcodeXApiResponse<AdminLogoutResponse>> {
  return doFetch<AdminLogoutResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/user/logout`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
