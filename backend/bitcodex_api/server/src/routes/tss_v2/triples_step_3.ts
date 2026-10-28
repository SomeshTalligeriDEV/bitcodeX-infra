import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  TriplesStep3RequestSchema,
  TriplesStep3SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  TriplesStep3Body,
  TriplesStep3Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runTriplesStep3 } from "@bitcodex-api/api/tss/v1/triples";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v1/triples/step3",
  tags: ["TSS"],
  summary: "Execute step 3 of triples generation",
  description: "Processes wait_2 messages and updates triples stage",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: TriplesStep3RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully processed step 3",
      content: {
        "application/json": {
          schema: TriplesStep3SuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export async function triplesStep3(
  req: UserAuthenticatedRequest<TriplesStep3Body>,
  res: Response<BitcodeXApiResponse<TriplesStep3Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  if (!user?.email || !user?.wallet_id_secp256k1) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      msg: "Unauthorized",
    });
    return;
  }

  const runTriplesStep3Res = await runTriplesStep3(state.db, {
    email: user.email,
    wallet_id: user.wallet_id_secp256k1,
    session_id: body.session_id,
    wait_2: body.wait_2,
  });
  if (runTriplesStep3Res.success === false) {
    res
      .status(ErrorCodeMap[runTriplesStep3Res.code] ?? 500)
      .json(runTriplesStep3Res);
    return;
  }

  sendResponseWithNewToken(res, runTriplesStep3Res.data);
}
