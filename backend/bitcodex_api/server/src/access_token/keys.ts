/**
 * Access tokens (X10, Privy-style): short-lived JWTs an app's frontend sends to its own
 * backend, which verifies them with the public keys at /.well-known/jwks.json. Signed
 * with a DEDICATED Ed25519 key (not the commit-reveal server keypair).
 * BITCODEX_ACCESS_TOKEN_KEY = PKCS8 PEM (newlines as \n) or base64 of it.
 */
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from "node:crypto";
import { exportJWK, type JWK, SignJWT } from "jose";

export const ACCESS_TOKEN_TTL_SECONDS = 3600;

let signingKey: KeyObject | null = null;
let publicJwk: (JWK & { kid: string }) | null = null;

function loadPem(raw: string): string {
  const text = raw.includes("BEGIN")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return text.replace(/\\n/g, "\n");
}

export async function initAccessTokenKey(
  raw: string | undefined,
  log: (msg: string) => void,
) {
  if (raw) {
    signingKey = createPrivateKey(loadPem(raw));
  } else {
    // Dev only: tokens stop verifying after a restart. Production sets the env key.
    signingKey = generateKeyPairSync("ed25519").privateKey;
    log(
      "BITCODEX_ACCESS_TOKEN_KEY not set: using an ephemeral access-token key",
    );
  }
  if (signingKey.asymmetricKeyType !== "ed25519") {
    throw new Error("BITCODEX_ACCESS_TOKEN_KEY must be an Ed25519 private key");
  }
  const jwk = await exportJWK(createPublicKey(signingKey));
  const kid = createHash("sha256")
    .update(String(jwk.x))
    .digest("base64url")
    .slice(0, 16);
  publicJwk = { ...jwk, kid, alg: "EdDSA", use: "sig" };
}

export function jwks() {
  if (!publicJwk) {
    throw new Error("access token key not initialised");
  }
  return { keys: [publicJwk] };
}

export interface AccessTokenClaims {
  appId: string;
  userId: string;
  /** SS58 coldkey address. */
  address: string | null;
  issuer: string;
}

export async function signAccessToken(c: AccessTokenClaims): Promise<string> {
  if (!signingKey || !publicJwk) {
    throw new Error("access token key not initialised");
  }
  return new SignJWT({ address: c.address })
    .setProtectedHeader({ alg: "EdDSA", kid: publicJwk.kid, typ: "JWT" })
    .setIssuer(c.issuer)
    .setAudience(c.appId)
    .setSubject(c.userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(signingKey);
}
