import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { PublicAppConfigSuccessResponseSchema } from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import {
  getAppForApiKey,
  toPublicAppConfig,
} from "@bitcodex/bitcodex-pg-interface/apps";
import express, { type Request, type Response } from "express";

import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

registry.registerPath({
  method: "get",
  path: "/app_config/v1",
  tags: ["App config"],
  summary: "Public config of the app that owns an API key",
  description:
    "Allowed origins, login methods (in order), appearance and network. Used by the BitcodeX iframe and SDK. Never includes the app secret.",
  responses: {
    200: {
      description: "App config",
      content: {
        "application/json": { schema: PublicAppConfigSuccessResponseSchema },
      },
    },
    401: {
      description: "Missing or unknown API key",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

async function getAppConfig(req: Request, res: Response) {
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    return res
      .status(ErrorCodeMap.UNAUTHORIZED)
      .json({
        success: false,
        code: "UNAUTHORIZED",
        msg: "x-api-key header required",
      });
  }
  const app = await getAppForApiKey(req.app.locals.db, apiKey);
  if (!app.success) {
    return res
      .status(ErrorCodeMap.UNKNOWN_ERROR)
      .json({
        success: false,
        code: "UNKNOWN_ERROR",
        msg: "app lookup failed",
      });
  }
  if (!app.data) {
    return res
      .status(ErrorCodeMap.INVALID_AUTH_TOKEN)
      .json({
        success: false,
        code: "INVALID_AUTH_TOKEN",
        msg: "unknown or inactive API key",
      });
  }
  // Short cache: dashboard changes show up within a minute.
  res.setHeader("Cache-Control", "public, max-age=30");
  return res.json({ success: true, data: toPublicAppConfig(app.data) });
}

export function makeAppConfigRouterV1() {
  const router = express.Router();
  router.get(
    "/",
    rateLimitMiddleware({ windowSeconds: 60, maxRequests: 120 }),
    getAppConfig,
  );
  return router;
}
