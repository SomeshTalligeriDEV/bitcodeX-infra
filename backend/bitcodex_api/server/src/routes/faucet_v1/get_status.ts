import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { FaucetStatusSuccessResponseSchema } from "@bitcodex/bitcodex-api-openapi/faucet";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Request, Response } from "express";

import { FAUCET_DISABLED, faucetErrorResponse } from "./errors";
import { type FaucetStatus, getFaucet } from "@bitcodex-api/faucet";

registry.registerPath({
  method: "get",
  path: "/faucet/v1/status",
  tags: ["Faucet"],
  summary: "Faucet status",
  description:
    "Network, amount per drip, cooldown and live balance of the localnet faucet account",
  responses: {
    200: {
      description: "Faucet is running on localnet",
      content: {
        "application/json": { schema: FaucetStatusSuccessResponseSchema },
      },
    },
    404: {
      description: "Faucet is not configured",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Connected chain is not localnet",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export async function getFaucetStatus(
  _req: Request,
  res: Response<BitcodeXApiResponse<FaucetStatus>>,
) {
  const faucet = getFaucet();
  if (!faucet) {
    return res.status(ErrorCodeMap.FAUCET_DISABLED).json(FAUCET_DISABLED);
  }
  const statusRes = await faucet.status();
  if (!statusRes.success) {
    const body = faucetErrorResponse(statusRes.err);
    return res.status(ErrorCodeMap[body.code]).json(body);
  }
  return res.status(200).json({ success: true, data: statusRes.data });
}
