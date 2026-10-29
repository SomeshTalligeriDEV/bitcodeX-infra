// Server-to-server API (X10, Privy Node SDK style): authenticated with the app ID and
// app secret (HTTP Basic). An app only sees users who signed in to it.
import { createHash, timingSafeEqual } from "node:crypto";
import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { getAppByIdOnly } from "@bitcodex/bitcodex-pg-interface/apps";
import type { App } from "@bitcodex/bitcodex-types/ct_dashboard";
import { encodeAddress } from "@polkadot/util-crypto";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  getEd25519Wallets,
  getUserForCustomer,
} from "@bitcodex-api/access_token/users";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

for (const [path, summary] of [
  ["/server/v1/users/{user_id}", "Get a user of this app"],
  ["/server/v1/users/{user_id}/wallets", "Get a user's Bittensor wallets"],
] as const) {
  registry.registerPath({
    method: "get",
    path,
    tags: ["Server API"],
    summary,
    description: "HTTP Basic auth: app ID as username, app secret as password.",
    responses: {
      200: { description: "OK" },
      401: {
        description: "Bad app credentials",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "No such user in this app",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });
}

const fail = (res: Response, code: keyof typeof ErrorCodeMap, msg: string) =>
  res.status(ErrorCodeMap[code]).json({ success: false, code, msg });

async function appSecretAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const m = /^Basic\s+([A-Za-z0-9+/=]+)$/.exec(header);
  if (!m) {
    return fail(
      res,
      "UNAUTHORIZED",
      "HTTP Basic auth required (app ID : app secret)",
    );
  }
  const decoded = Buffer.from(m[1], "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  const appId = decoded.slice(0, sep);
  const secret = decoded.slice(sep + 1);
  if (sep < 1 || !/^[0-9a-f-]{36}$/.test(appId) || !secret) {
    return fail(res, "UNAUTHORIZED", "invalid app credentials");
  }
  const app = await getAppByIdOnly(req.app.locals.db, appId);
  const given = createHash("sha256").update(secret).digest();
  const stored =
    app.success && app.data?.secret_hash
      ? Buffer.from(app.data.secret_hash, "hex")
      : null;
  if (
    !stored ||
    stored.length !== given.length ||
    !timingSafeEqual(stored, given)
  ) {
    return fail(res, "UNAUTHORIZED", "invalid app credentials");
  }
  res.locals.app = app.success ? app.data : null;
  next();
  return undefined;
}

const address = (hex: string) =>
  hex.length === 64 ? encodeAddress(Buffer.from(hex, "hex"), 42) : null;

async function getUser(req: Request, res: Response) {
  const app = res.locals.app as App;
  const user = await getUserForCustomer(
    req.app.locals.db,
    app.customer_id,
    String(req.params.user_id),
  );
  if (!user) {
    return fail(res, "USER_NOT_FOUND", "no such user in this app");
  }
  const wallets = await getEd25519Wallets(req.app.locals.db, user.user_id);
  return res.json({
    success: true,
    data: {
      id: user.user_id,
      created_at: new Date(user.created_at).toISOString(),
      linked_accounts: [{ type: user.auth_type, email: user.email }],
      wallets: wallets.map((w) => ({
        chain: "bittensor",
        address: address(w.public_key_hex),
      })),
    },
  });
}

async function getWallets(req: Request, res: Response) {
  const app = res.locals.app as App;
  const user = await getUserForCustomer(
    req.app.locals.db,
    app.customer_id,
    String(req.params.user_id),
  );
  if (!user) {
    return fail(res, "USER_NOT_FOUND", "no such user in this app");
  }
  const wallets = await getEd25519Wallets(req.app.locals.db, user.user_id);
  return res.json({
    success: true,
    data: wallets.map((w) => ({
      chain: "bittensor",
      address: address(w.public_key_hex),
      public_key: `0x${w.public_key_hex}`,
      key_type: "ed25519 (FROST 2-of-2)",
      created_at: new Date(w.created_at).toISOString(),
    })),
  });
}

export function makeServerRouterV1() {
  const router = express.Router();
  router.use(rateLimitMiddleware({ windowSeconds: 60, maxRequests: 300 }));
  router.use(appSecretAuth);
  router.get("/users/:user_id", getUser);
  router.get("/users/:user_id/wallets", getWallets);
  return router;
}
