// X04 wallet login (Privy "login with wallet"): the user proves control of an extension
// wallet (Talisman, SubWallet, Polkadot.js) with a Sign-In with Bittensor message and a
// server nonce. No embedded key is created for wallet-only users; they keep signing with
// their extension. A signed-in user can link a wallet to their account.
import { randomBytes } from "node:crypto";
import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { getAppForApiKey } from "@bitcodex/bitcodex-pg-interface/apps";
import {
  consumeWalletLoginNonce,
  getUserIdForWallet,
  insertWalletLoginNonce,
  linkWallet,
} from "@bitcodex/bitcodex-pg-interface/wallet_login";
import type { App } from "@bitcodex/bitcodex-types/ct_dashboard";
import {
  type BittensorChainId,
  caip2ChainId,
  getApi,
  parseSiwbMessage,
  verifySiwb,
} from "@bitcodex/bittensor-chain";
import { checkAddress } from "@polkadot/util-crypto";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  signAccessToken,
} from "@bitcodex-api/access_token/keys";
import { getEd25519WalletById } from "@bitcodex-api/access_token/users";
import { userJwtMiddlewareV2 } from "@bitcodex-api/middleware/auth/cosmos_compat_auth";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";
import { ACCESS_TOKEN_ISSUER } from "@bitcodex-api/routes/access_token_v1";

const NONCE_TTL_SECONDS = 600;
const SignedSchema = z.object({
  message: z.string().max(4096),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

for (const [path, summary] of [
  [
    "/wallet_login/v1/nonce",
    "Get a single-use nonce for Sign-In with Bittensor (10 min)",
  ],
  [
    "/wallet_login/v1/verify",
    "Verify a wallet's Sign-In with Bittensor message; returns an access token",
  ],
  ["/wallet_login/v1/link", "Link an extension wallet to the signed-in user"],
] as const) {
  registry.registerPath({
    method: "post",
    path,
    tags: ["Wallet login"],
    summary,
    description:
      "Needs x-api-key. The message's domain must be the host of one of the app's allowed origins (any domain if the app allows any origin), and its chain the app's network.",
    responses: {
      200: { description: "OK" },
      400: {
        description: "Bad message or signature",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      401: {
        description: "Bad API key, nonce or signature",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });
}

const fail = (res: Response, code: keyof typeof ErrorCodeMap, msg: string) =>
  res.status(ErrorCodeMap[code]).json({ success: false, code, msg });

async function appFromKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey !== "string" || !apiKey) {
    return fail(res, "UNAUTHORIZED", "x-api-key header required");
  }
  const app = await getAppForApiKey(req.app.locals.db, apiKey);
  if (!app.success || !app.data) {
    return fail(res, "INVALID_AUTH_TOKEN", "unknown or inactive API key");
  }
  res.locals.app = app.data;
  next();
  return undefined;
}

/** Genesis of the app's network, read live (a localnet genesis changes on every reset). */
async function appGenesis(app: App): Promise<string | null> {
  const api = await getApi(app.network as BittensorChainId, {
    rpcUrl:
      app.network === "bittensor:localnet"
        ? process.env.BITCODEX_FAUCET_RPC_URL || undefined
        : undefined,
  });
  return api.success ? api.data.genesisHash.toHex() : null;
}

/**
 * Hosts this app may sign in from: the hosts of its allowed origins. An app with an empty
 * list allows any origin (developer dashboard), so any well-formed domain is accepted.
 */
function domainAllowed(app: App, domain: string): boolean {
  if (app.allowed_origins.length === 0) {
    return domain.length > 0;
  }
  return app.allowed_origins.some((o) => {
    try {
      return new URL(o).host === domain;
    } catch {
      return false;
    }
  });
}

async function nonce(req: Request, res: Response) {
  const app = res.locals.app as App;
  const address = String(req.body?.address ?? "");
  if (!checkAddress(address, 42)[0]) {
    return fail(
      res,
      "INVALID_REQUEST",
      "address must be a Bittensor (SS58 42) address",
    );
  }
  const genesis = await appGenesis(app);
  if (!genesis) {
    return fail(res, "SERVICE_UNAVAILABLE", `cannot reach ${app.network}`);
  }
  const value = randomBytes(16).toString("hex");
  const ins = await insertWalletLoginNonce(
    req.app.locals.db,
    value,
    address,
    app.app_id,
    NONCE_TTL_SECONDS,
  );
  if (!ins.success) {
    return fail(res, "UNKNOWN_ERROR", "could not store nonce");
  }
  return res.json({
    success: true,
    data: {
      nonce: value,
      chain_id: caip2ChainId(genesis),
      expires_in: NONCE_TTL_SECONDS,
    },
  });
}

/** Verify signature, domain, chain and expiry, then consume the nonce (once). */
async function verifyWalletMessage(
  req: Request,
  res: Response,
): Promise<string | null> {
  const app = res.locals.app as App;
  const body = SignedSchema.safeParse(req.body);
  if (!body.success) {
    fail(res, "INVALID_REQUEST", "body must be { message, signature }");
    return null;
  }
  const fields = parseSiwbMessage(body.data.message);
  if (!fields) {
    fail(res, "INVALID_REQUEST", "not a Sign-In with Bittensor message");
    return null;
  }
  if (!domainAllowed(app, fields.domain)) {
    fail(
      res,
      "FORBIDDEN",
      `domain ${fields.domain} is not an allowed origin of this app`,
    );
    return null;
  }
  const genesis = await appGenesis(app);
  if (!genesis) {
    fail(res, "SERVICE_UNAVAILABLE", `cannot reach ${app.network}`);
    return null;
  }
  const v = verifySiwb(body.data.message, body.data.signature, {
    domain: fields.domain,
    nonce: fields.nonce ?? "",
    genesisHash: genesis,
  });
  if (!v.success) {
    fail(res, "INVALID_SIGNATURE", v.err);
    return null;
  }
  const used = await consumeWalletLoginNonce(
    req.app.locals.db,
    fields.nonce ?? "",
    fields.address,
    app.app_id,
  );
  if (!used.success || !used.data) {
    fail(res, "INVALID_SIGNATURE", "nonce unknown, expired or already used");
    return null;
  }
  return fields.address;
}

async function verify(req: Request, res: Response) {
  const address = await verifyWalletMessage(req, res);
  if (!address) {
    return undefined;
  }
  const app = res.locals.app as App;
  // A wallet linked to a BitcodeX user signs in as that user.
  const linkedUser = await getUserIdForWallet(req.app.locals.db, address);
  const token = await signAccessToken({
    appId: app.app_id,
    userId: linkedUser ?? `wallet:${address}`,
    address,
    issuer: ACCESS_TOKEN_ISSUER(),
  });
  return res.json({
    success: true,
    data: {
      access_token: token,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      user_id: linkedUser ?? `wallet:${address}`,
      address,
      linked_user: linkedUser !== null,
    },
  });
}

async function link(req: Request, res: Response) {
  const walletId = res.locals.user?.wallet_id_ed25519;
  const own = walletId
    ? await getEd25519WalletById(req.app.locals.db, walletId)
    : null;
  if (!own) {
    return fail(res, "WALLET_NOT_FOUND", "sign in with BitcodeX first");
  }
  const address = await verifyWalletMessage(req, res);
  if (!address) {
    return undefined;
  }
  const r = await linkWallet(req.app.locals.db, own.user_id, address);
  if (!r.success) {
    return fail(res, "UNKNOWN_ERROR", "could not link wallet");
  }
  if (r.data === "linked_to_other_user") {
    return fail(
      res,
      "FORBIDDEN",
      "this wallet is already linked to another account",
    );
  }
  return res.json({ success: true, data: { address, status: r.data } });
}

export function makeWalletLoginRouterV1() {
  const router = express.Router();
  router.use(rateLimitMiddleware({ windowSeconds: 60, maxRequests: 30 }));
  router.post("/nonce", appFromKey, nonce);
  router.post("/verify", appFromKey, verify);
  router.post("/link", userJwtMiddlewareV2, appFromKey, link);
  return router;
}
