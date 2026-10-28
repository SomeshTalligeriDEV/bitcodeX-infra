import { registry } from "@bitcodex/bitcodex-api-openapi";
import { BitcodeXApiRootResponseSchema } from "@bitcodex/bitcodex-api-openapi/bitcodex";
import type { ServerState } from "@bitcodex/bitcodex-api-server-state";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { loggingMiddleware } from "@bitcodex-api/middleware/logging";
import { installSwaggerDocs } from "@bitcodex-api/openapi";
import { setRoutes } from "@bitcodex-api/routes";

export function makeApp(state: ServerState) {
  const app = express();

  app.use(morgan("dev"));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  app.use(
    cors({
      exposedHeaders: ["X-New-Token"],
    }),
  );

  // Make req.ip the nearest reverse-proxy ip address
  app.set("trust proxy", 1);

  // Exclude typeform webhook from JSON parsing (needs raw body for signature verification)
  app.use((req, res, next) => {
    if (
      req.path === "/bitcodex_admin/v1/customer/create_customer_by_typeform"
    ) {
      return next();
    }
    express.json({ limit: "10mb" })(req, res, next);
  });

  app.locals = state;
  app.use(loggingMiddleware());
  registry.registerPath({
    method: "get",
    path: "/",
    tags: ["Status"],
    summary: "Health check",
    description: "Returns service health status",
    responses: {
      200: {
        description: "Service is healthy",
        content: {
          "text/plain": {
            schema: BitcodeXApiRootResponseSchema,
          },
        },
      },
    },
  });
  // biome-ignore lint/complexity/noBannedTypes: Express generic params
  app.get<{}, string>("/", (_, res) => {
    res.send("Ok");
  });

  setRoutes(app);

  // Should be called after registering all the components
  installSwaggerDocs(app);

  return app;
}
