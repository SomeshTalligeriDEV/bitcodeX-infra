import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  FaucetDripRequestSchema,
  FaucetDripSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/faucet";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Request, Response } from "express";

import { FAUCET_DISABLED, faucetErrorResponse } from "./errors";
import { type DripResult, getFaucet } from "@bitcodex-api/faucet";

registry.registerPath({
  method: "post",
  path: "/faucet/v1/drip",
  tags: ["Faucet"],
  summary: "Send test TAO",
  description:
    "Sends test TAO from the localnet dev account to an address; one drip per address per cooldown. Refuses unless the connected chain is localnet.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: FaucetDripRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Transfer included in a block",
      content: {
        "application/json": { schema: FaucetDripSuccessResponseSchema },
      },
    },
    400: {
      description: "Invalid address",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Faucet is not configured",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    429: {
      description: "Address funded too recently",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    502: {
      description: "Transfer failed on chain",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    503: {
      description: "Connected chain is not localnet",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export async function postDrip(
  req: Request<unknown, unknown, { address?: unknown }>,
  res: Response<BitcodeXApiResponse<DripResult>>,
) {
  const faucet = getFaucet();
  if (!faucet) {
    return res.status(ErrorCodeMap.FAUCET_DISABLED).json(FAUCET_DISABLED);
  }
  const parsed = FaucetDripRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(ErrorCodeMap.INVALID_REQUEST).json({
      success: false,
      code: "INVALID_REQUEST",
      msg: "body must be { address: string }",
    });
  }
  const dripRes = await faucet.drip(parsed.data.address);
  if (!dripRes.success) {
    const body = faucetErrorResponse(dripRes.err);
    return res.status(ErrorCodeMap[body.code]).json(body);
  }
  req.app.locals.logger.info(
    "faucet: %s rao to %s tx %s",
    dripRes.data.amountRao,
    dripRes.data.address,
    dripRes.data.txHash,
  );
  return res.status(200).json({ success: true, data: dripRes.data });
}
