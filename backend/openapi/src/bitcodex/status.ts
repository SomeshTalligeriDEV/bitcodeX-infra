import { z } from "zod";

import { registry } from "../registry";

export const BitcodeXApiStatusResponseSchema = registry.register(
  "BitcodeXApiStatusResponse",
  z.object({
    gitHead: z.string().openapi({
      description: "Git commit hash",
    }),
    serverPublicKey: z.string().openapi({
      description: "Server public key",
    }),
  }),
);

export const BitcodeXApiRootResponseSchema = registry.register(
  "BitcodeXApiRootResponse",
  z.string().openapi({
    description: "Service health response",
    example: "Ok",
  }),
);
