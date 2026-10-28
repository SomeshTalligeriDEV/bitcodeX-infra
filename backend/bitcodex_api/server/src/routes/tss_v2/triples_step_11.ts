import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  TriplesStep11RequestSchema,
  TriplesStep11SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  TriplesStep11Body,
  TriplesStep11Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runTriplesStep11 } from "@bitcodex-api/api/tss/v1/triples";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v1/triples/step11",
  tags: ["TSS"],
  summary: "Execute step 11 of triples generation",
  description: "Finalizes triples and returns public triples",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: TriplesStep11RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully completed triples generation",
      content: {
        "application/json": {
          schema: TriplesStep11SuccessResponseSchema,
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

export async function triplesStep11(
  req: UserAuthenticatedRequest<TriplesStep11Body>,
  res: Response<BitcodeXApiResponse<TriplesStep11Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  const runTriplesStep11Res = await runTriplesStep11(state.db, {
    email: user.email,
    wallet_id: user.wallet_id_secp256k1,
    session_id: body.session_id,
    pub_v: body.pub_v,
  });
  if (runTriplesStep11Res.success === false) {
    res
      .status(ErrorCodeMap[runTriplesStep11Res.code] ?? 500)
      .json(runTriplesStep11Res);
    return;
  }

  sendResponseWithNewToken(res, runTriplesStep11Res.data);
}
