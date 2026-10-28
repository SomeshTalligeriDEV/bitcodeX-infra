import { registry } from "@bitcodex/bitcodex-api-openapi";
import { BitcodeXApiStatusResponseSchema } from "@bitcodex/bitcodex-api-openapi/bitcodex";
import type { Request, Response } from "express";

registry.registerPath({
  method: "get",
  path: "/status",
  tags: ["Status"],
  summary: "Get API status",
  description: "Returns server git hash and public key",
  responses: {
    200: {
      description: "Status retrieved successfully",
      content: {
        "application/json": {
          schema: BitcodeXApiStatusResponseSchema,
        },
      },
    },
  },
});

export function getStatus(req: Request, res: Response) {
  const app = req.app;

  res.json({
    gitHead: app.locals.git_hash,
    serverPublicKey: app.locals.server_keypair.publicKey.toHex(),
  });
}
