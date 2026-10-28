import { z } from "zod";

import { registry } from "../registry";

export const FaucetDripRequestSchema = registry.register(
  "FaucetDripRequest",
  z.object({
    address: z.string().openapi({
      description: "Bittensor SS58 address (prefix 42) to fund",
      example: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    }),
  }),
);

const FaucetDripResultSchema = registry.register(
  "FaucetDripResult",
  z.object({
    address: z.string().openapi({ description: "Funded address" }),
    amountRao: z.string().openapi({
      description: "Amount sent in rao (1 TAO = 10^9 rao)",
      example: "1000000000000",
    }),
    txHash: z.string().openapi({ description: "Extrinsic hash" }),
    blockHash: z.string().openapi({
      description: "Block the transfer was included in",
    }),
  }),
);

export const FaucetDripSuccessResponseSchema = registry.register(
  "FaucetDripSuccessResponse",
  z.object({
    success: z.literal(true),
    data: FaucetDripResultSchema,
  }),
);

const FaucetStatusSchema = registry.register(
  "FaucetStatus",
  z.object({
    network: z.literal("bittensor:localnet"),
    amountTao: z.number().openapi({ description: "TAO sent per drip" }),
    cooldownSeconds: z.number().openapi({
      description: "Minimum seconds between drips to one address",
    }),
    faucetAddress: z.string().openapi({ description: "Sending dev account" }),
    faucetBalanceRao: z.string().openapi({
      description: "Free balance of the sending account, in rao",
    }),
  }),
);

export const FaucetStatusSuccessResponseSchema = registry.register(
  "FaucetStatusSuccessResponse",
  z.object({
    success: z.literal(true),
    data: FaucetStatusSchema,
  }),
);
