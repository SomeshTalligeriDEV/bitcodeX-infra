import { Router } from "express";

import { keyshareV2Check } from "./check";
import { commit } from "./commit";
import { registerKeyshareEd25519 } from "./ed25519";
import { getKeysharesV2 } from "./get_key_shares";
import { keyshareV2Register } from "./register";
import { keyshareV2Reshare } from "./reshare";
import {
  bearerTokenMiddleware,
  commitRevealMiddleware,
} from "@bitcodex-ksn-server/middlewares";
import { rateLimitMiddleware } from "@bitcodex-ksn-server/middlewares/rate_limit";

export function makeKeyshareV2Router() {
  const router = Router();
  // Per-IP limit on key share routes (keygen, sign-in, reshare).
  router.use(rateLimitMiddleware({ windowSeconds: 60, maxRequests: 300 }));

  router.post(
    "/",
    commitRevealMiddleware("get_key_shares"),
    bearerTokenMiddleware,
    getKeysharesV2,
  );

  router.post("/check", keyshareV2Check);

  router.post(
    "/register",
    commitRevealMiddleware("register"),
    bearerTokenMiddleware,
    keyshareV2Register,
  );

  router.post(
    "/register/ed25519",
    commitRevealMiddleware("register_ed25519"),
    bearerTokenMiddleware,
    registerKeyshareEd25519,
  );

  router.post(
    "/reshare",
    commitRevealMiddleware("reshare"),
    bearerTokenMiddleware,
    keyshareV2Reshare,
  );

  router.post("/commit", commit);

  return router;
}
