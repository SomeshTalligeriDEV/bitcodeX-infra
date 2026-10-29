import { Router } from "express";

import { setKeygenV1Routes } from "./keygen";
import { setKSNodeTelemetryRoutes } from "./ks_node_telemetry";
import { setPresignV1Routes } from "./presign";
import { setSignV1Routes } from "./sign";
import { setTriplesV1Routes } from "./triples";
import { setTssSessionRoutes } from "./tss_session";
import { setUserV1Routes } from "./user";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

export function makeTSSRouterV1() {
  const router = Router();
  // Per-IP limit for the signing/keygen API: one ceremony is several calls; generous for real users, a cap for abuse.
  router.use(rateLimitMiddleware({ windowSeconds: 60, maxRequests: 600 }));

  setKeygenV1Routes(router);
  setTriplesV1Routes(router);
  setPresignV1Routes(router);
  setSignV1Routes(router);
  setUserV1Routes(router);

  setTssSessionRoutes(router);
  setKSNodeTelemetryRoutes(router);

  return router;
}
