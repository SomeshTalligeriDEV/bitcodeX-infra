import { createHash, randomBytes } from "node:crypto";
import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  AppCreatedSuccessResponseSchema,
  AppIdRequestSchema,
  AppListSuccessResponseSchema,
  AppSecretSuccessResponseSchema,
  AppSuccessResponseSchema,
  AppUsersSuccessResponseSchema,
  CreateAppRequestSchema,
  CustomerAuthHeaderSchema,
  UpdateAppRequestSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import { insertAPIKey } from "@bitcodex/bitcodex-pg-interface/api_keys";
import {
  getAppById,
  getAppsByCustomerId,
  getAppUsers,
  insertApp,
  setApiKeyApp,
  setAppSecretHash,
  updateApp,
} from "@bitcodex/bitcodex-pg-interface/apps";
import type { App } from "@bitcodex/bitcodex-types/ct_dashboard";
import { encodeAddress } from "@polkadot/util-crypto";
import type { Request, Response } from "express";
import type { ZodType } from "zod";

import type { TeamContext } from "@bitcodex-ctd-api/middleware/auth";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newSecret = () => `bcx_sk_${randomBytes(32).toString("hex")}`;

function register(
  path: string,
  summary: string,
  body: ZodType | null,
  ok: ZodType,
) {
  registry.registerPath({
    method: "post",
    path: `/customer_dashboard/v1${path}`,
    tags: ["Customer Dashboard", "Apps"],
    summary,
    security: [{ customerAuth: [] }],
    request: {
      headers: CustomerAuthHeaderSchema,
      ...(body
        ? {
            body: {
              required: true,
              content: { "application/json": { schema: body } },
            },
          }
        : {}),
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: ok } },
      },
      400: {
        description: "Invalid input",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      403: {
        description: "Admin role required",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      404: {
        description: "App not found",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });
}

register(
  "/apps/list",
  "List apps with their API keys",
  null,
  AppListSuccessResponseSchema,
);
register(
  "/apps/create",
  "Create an app (API key and secret shown once)",
  CreateAppRequestSchema,
  AppCreatedSuccessResponseSchema,
);
register(
  "/apps/update",
  "Update allowed origins, login methods, appearance, network",
  UpdateAppRequestSchema,
  AppSuccessResponseSchema,
);
register(
  "/apps/rotate_secret",
  "Replace the app secret (shown once)",
  AppIdRequestSchema,
  AppSecretSuccessResponseSchema,
);
register(
  "/apps/users",
  "Users of this customer's apps (Preview)",
  AppIdRequestSchema,
  AppUsersSuccessResponseSchema,
);

const team = (res: Response) => res.locals.team as TeamContext;

const fail = (res: Response, code: keyof typeof ErrorCodeMap, msg: string) =>
  res.status(ErrorCodeMap[code]).json({ success: false, code, msg });

async function appView(req: Request, app: App) {
  const keys = await req.app.locals.db.query(
    "SELECT key_id, hashed_key, is_active FROM api_keys WHERE app_id = $1 ORDER BY created_at",
    [app.app_id],
  );
  return {
    app_id: app.app_id,
    label: app.label,
    allowed_origins: app.allowed_origins,
    login_methods: app.login_methods,
    accent_color: app.accent_color,
    theme_mode: app.theme_mode,
    logo_url: app.logo_url,
    network: app.network,
    has_secret: app.secret_hash !== null,
    api_keys: keys.rows.map(
      (k: { key_id: string; hashed_key: string; is_active: boolean }) => ({
        key_id: k.key_id,
        // The column is named hashed_key but stores the public client key itself.
        api_key: k.hashed_key,
        is_active: k.is_active,
      }),
    ),
    created_at: new Date(app.created_at).toISOString(),
  };
}

export async function listApps(req: Request, res: Response) {
  const apps = await getAppsByCustomerId(
    req.app.locals.db,
    team(res).customer_id,
  );
  if (!apps.success) {
    return fail(res, "UNKNOWN_ERROR", apps.err);
  }
  return res.json({
    success: true,
    data: await Promise.all(apps.data.map((a) => appView(req, a))),
  });
}

export async function createApp(req: Request, res: Response) {
  const parsed = CreateAppRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(
      res,
      "INVALID_REQUEST",
      parsed.error.issues.map((i) => i.message).join("; "),
    );
  }
  const db = req.app.locals.db;
  const customerId = team(res).customer_id;
  const secret = newSecret();
  const app = await insertApp(
    db,
    customerId,
    parsed.data.label,
    parsed.data.allowed_origins ?? [],
    sha256(secret),
  );
  if (!app.success) {
    return fail(res, "UNKNOWN_ERROR", app.err);
  }
  const apiKey = randomBytes(32).toString("hex");
  const key = await insertAPIKey(db, customerId, apiKey);
  if (!key.success) {
    return fail(res, "UNKNOWN_ERROR", key.err);
  }
  const link = await setApiKeyApp(db, key.data.key_id, app.data.app_id);
  if (!link.success) {
    return fail(res, "UNKNOWN_ERROR", link.err);
  }
  return res.json({
    success: true,
    data: {
      app: await appView(req, app.data),
      api_key: apiKey,
      app_secret: secret,
    },
  });
}

export async function updateAppRoute(req: Request, res: Response) {
  const parsed = UpdateAppRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(
      res,
      "INVALID_REQUEST",
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  }
  const { app_id, ...update } = parsed.data;
  const app = await updateApp(
    req.app.locals.db,
    team(res).customer_id,
    app_id,
    update,
  );
  if (!app.success) {
    return fail(res, "UNKNOWN_ERROR", app.err);
  }
  if (!app.data) {
    return fail(res, "CUSTOMER_NOT_FOUND", "app not found");
  }
  return res.json({ success: true, data: await appView(req, app.data) });
}

export async function rotateAppSecret(req: Request, res: Response) {
  const parsed = AppIdRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "INVALID_REQUEST", "app_id required");
  }
  const secret = newSecret();
  const app = await setAppSecretHash(
    req.app.locals.db,
    team(res).customer_id,
    parsed.data.app_id,
    sha256(secret),
  );
  if (!app.success) {
    return fail(res, "UNKNOWN_ERROR", app.err);
  }
  if (!app.data) {
    return fail(res, "CUSTOMER_NOT_FOUND", "app not found");
  }
  return res.json({
    success: true,
    data: { app_id: app.data.app_id, app_secret: secret },
  });
}

export async function getAppUsersRoute(req: Request, res: Response) {
  const parsed = AppIdRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "INVALID_REQUEST", "app_id required");
  }
  const db = req.app.locals.db;
  const customerId = team(res).customer_id;
  const app = await getAppById(db, customerId, parsed.data.app_id);
  if (!app.success || !app.data) {
    return fail(res, "CUSTOMER_NOT_FOUND", "app not found");
  }
  const users = await getAppUsers(db, customerId);
  if (!users.success) {
    return fail(res, "UNKNOWN_ERROR", users.err);
  }
  return res.json({
    success: true,
    data: users.data.map((u) => ({
      user_id: u.user_id,
      email: u.email,
      auth_type: u.auth_type,
      // Coldkey address = SS58(42) of the FROST ed25519 group key.
      address:
        u.public_key_ed25519 && u.public_key_ed25519.length === 64
          ? encodeAddress(Buffer.from(u.public_key_ed25519, "hex"), 42)
          : null,
      connected_at: new Date(u.connected_at).toISOString(),
      last_seen_at: new Date(u.last_seen_at).toISOString(),
    })),
  });
}
