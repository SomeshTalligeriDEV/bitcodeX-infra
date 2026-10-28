import type { SocialLoginXVerifyUserResponse } from "@bitcodex/bitcodex-types/social_login";
import type { Result } from "@bitcodex/stdlib-js";

export const X_SOCIAL_LOGIN_TOKEN_URL = "https://api.x.com/2/oauth2/token";
export const X_USER_INFO_URL = "https://api.x.com/2/users/me";
export const X_CLIENT_ID = process.env.X_CLIENT_ID ?? "";

export async function getXUserInfo(accessToken: string): Promise<
  Result<
    SocialLoginXVerifyUserResponse,
    {
      status: number;
      text: string;
    }
  >
> {
  const res = await fetch(X_USER_INFO_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.ok) {
    return {
      success: true,
      data: (await res.json()).data,
    };
  }

  return {
    success: false,
    err: {
      status: res.status,
      text: await res.text(),
    },
  };
}
