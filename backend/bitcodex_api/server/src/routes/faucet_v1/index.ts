import express from "express";

import { getFaucetStatus } from "./get_status";
import { postDrip } from "./post_drip";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

/** Localnet test-TAO faucet (X14). Every route answers FAUCET_DISABLED unless configured. */
export function makeFaucetRouterV1() {
  const router = express.Router();

  router.get(
    "/status",
    rateLimitMiddleware({ windowSeconds: 60, maxRequests: 60 }),
    getFaucetStatus,
  );

  router.post(
    "/drip",
    rateLimitMiddleware({ windowSeconds: 60, maxRequests: 10 }),
    postDrip,
  );

  return router;
}
