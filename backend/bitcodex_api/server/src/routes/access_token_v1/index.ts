import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { getAppForApiKey } from "@bitcodex/bitcodex-pg-interface/apps";
import { encodeAddress } from "@polkadot/util-crypto";
import express, { type Request, type Response } from "express";
import { z } from "zod";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  jwks,
  signAccessToken,
} from "@bitcodex-api/access_token/keys";
import {
  getEd25519WalletById,
  getUserForCustomer,
} from "@bitcodex-api/access_token/users";
import { userJwtMiddlewareV2 } from "@bitcodex-api/middleware/auth/cosmos_compat_auth";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

const AccessTokenResponseSchema = registry.register(
  "AccessTokenResponse",
  z.object({
    success: z.literal(true),
    data: z.object({
      access_token: z
        .string()
        .openapi({
          description: "EdDSA JWT; verify with /.well-known/jwks.json",
        }),
      expires_in: z.number(),
    }),
  }),
);

registry.registerPath({
  method: "get",
  path: "/.well-known/jwks.json",
  tags: ["Access tokens"],
  summary: "Public keys that sign BitcodeX access tokens",
  responses: { 200: { description: "JWKS" } },
});

registry.registerPath({
  method: "post",
  path: "/access_token/v1",
  tags: ["Access tokens"],
  summary: "Exchange the user's BitcodeX session for an app access token",
  description:
    "Needs the user's session (Bearer) and the app's x-api-key. The token's aud is the app ID, sub the user ID, and it carries the coldkey address. Valid 1 hour.",
  responses: {
    200: {
      description: "Access token",
      content: { "application/json": { schema: AccessTokenResponseSchema } },
    },
    401: {
      description: "No session or API key",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "User has not signed in to this app",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const fail = (res: Response, code: keyof typeof ErrorCodeMap, msg: string) =>
  res.status(ErrorCodeMap[code]).json({ success: false, code, msg });

export const ACCESS_TOKEN_ISSUER = () =>
  process.env.BITCODEX_ACCESS_TOKEN_ISSUER || "bitcodex";

async function issueAccessToken(req: Request, res: Response) {
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey !== "string" || !apiKey) {
    return fail(res, "UNAUTHORIZED", "x-api-key header required");
  }
  const db = req.app.locals.db;
  const app = await getAppForApiKey(db, apiKey);
  if (!app.success || !app.data) {
    return fail(res, "INVALID_AUTH_TOKEN", "unknown or inactive API key");
  }
  const walletId = res.locals.user?.wallet_id_ed25519;
  if (!walletId) {
    return fail(
      res,
      "WALLET_NOT_FOUND",
      "this session has no Bittensor (ed25519) wallet",
    );
  }
  const wallet = await getEd25519WalletById(db, walletId);
  if (!wallet) {
    return fail(res, "WALLET_NOT_FOUND", "wallet not found");
  }
  const user = await getUserForCustomer(
    db,
    app.data.customer_id,
    wallet.user_id,
  );
  if (!user) {
    return fail(res, "FORBIDDEN", "this user has not signed in to this app");
  }
  const address =
    wallet.public_key_hex.length === 64
      ? encodeAddress(Buffer.from(wallet.public_key_hex, "hex"), 42)
      : null;
  const token = await signAccessToken({
    appId: app.data.app_id,
    userId: user.user_id,
    address,
    issuer: ACCESS_TOKEN_ISSUER(),
  });
  return res.json({
    success: true,
    data: { access_token: token, expires_in: ACCESS_TOKEN_TTL_SECONDS },
  });
}

export function mountAccessTokenRoutes(app: express.Express) {
  app.get("/.well-known/jwks.json", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(jwks());
  });
  const router = express.Router();
  router.post(
    "/",
    rateLimitMiddleware({ windowSeconds: 60, maxRequests: 60 }),
    userJwtMiddlewareV2,
    issueAccessToken,
  );
  app.use("/access_token/v1", router);
}
