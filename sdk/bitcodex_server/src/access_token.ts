import { createRemoteJWKSet, errors, jwtVerify } from "jose";

export interface VerifiedAccessToken {
  appId: string;
  userId: string;
  /** SS58 coldkey address (prefix 42), or null. */
  address: string | null;
  issuedAt: number;
  expiresAt: number;
}

export interface VerifyAccessTokenOptions {
  /** Your app ID (developer dashboard): the token's audience. */
  appId: string;
  /** BitcodeX API base URL, e.g. https://api.example.com; JWKS at /.well-known/jwks.json. */
  apiUrl: string;
  /** Expected issuer (BITCODEX_ACCESS_TOKEN_ISSUER on the server). Default "bitcodex". */
  issuer?: string;
}

export type AccessTokenError =
  | "token_expired"
  | "invalid_signature"
  | "wrong_audience"
  | "wrong_issuer"
  | "invalid_token";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/** Verify a BitcodeX access token (EdDSA JWT) from your frontend. Never trusts unsigned data. */
export async function verifyAccessToken(
  token: string,
  options: VerifyAccessTokenOptions,
): Promise<
  | { success: true; data: VerifiedAccessToken }
  | { success: false; err: AccessTokenError; msg: string }
> {
  const url = `${options.apiUrl.replace(/\/+$/, "")}/.well-known/jwks.json`;
  let jwks = jwksCache.get(url);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(url), {
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
    });
    jwksCache.set(url, jwks);
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["EdDSA"],
      audience: options.appId,
      issuer: options.issuer ?? "bitcodex",
    });
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return {
        success: false,
        err: "invalid_token",
        msg: "missing sub or exp",
      };
    }
    return {
      success: true,
      data: {
        appId: options.appId,
        userId: payload.sub,
        address: typeof payload.address === "string" ? payload.address : null,
        issuedAt: payload.iat ?? 0,
        expiresAt: payload.exp,
      },
    };
  } catch (e) {
    if (e instanceof errors.JWTExpired) {
      return { success: false, err: "token_expired", msg: e.message };
    }
    if (
      e instanceof errors.JWSSignatureVerificationFailed ||
      e instanceof errors.JWKSNoMatchingKey
    ) {
      return { success: false, err: "invalid_signature", msg: e.message };
    }
    if (e instanceof errors.JWTClaimValidationFailed) {
      return {
        success: false,
        err:
          e.claim === "aud"
            ? "wrong_audience"
            : e.claim === "iss"
              ? "wrong_issuer"
              : "invalid_token",
        msg: e.message,
      };
    }
    return {
      success: false,
      err: "invalid_token",
      msg: e instanceof Error ? e.message : String(e),
    };
  }
}
