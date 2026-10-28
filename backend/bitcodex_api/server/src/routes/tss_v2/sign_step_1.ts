import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  SignStep1RequestSchema,
  SignStep1SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  SignStep1Body,
  SignStep1Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runSignStep1 } from "@bitcodex-api/api/tss/v1/sign";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v2/sign/step1",
  tags: ["TSS"],
  summary: "Initiate signing process using completed presign",
  description: "Creates sign stage and generates initial sign messages",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: SignStep1RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully initialized signing process",
      content: {
        "application/json": {
          schema: SignStep1SuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request - Session or stage validation failed",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing JWT token",
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

export async function signStep1(
  req: UserAuthenticatedRequest<SignStep1Body>,
  res: Response<BitcodeXApiResponse<SignStep1Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  const runSignStep1Res = await runSignStep1(state.db, {
    email: user.email,
    wallet_id: user.wallet_id_secp256k1,
    session_id: body.session_id,
    msg: body.msg,
    msgs_1: body.msgs_1,
  });
  if (runSignStep1Res.success === false) {
    res.status(ErrorCodeMap[runSignStep1Res.code] ?? 500).json(runSignStep1Res);

    return;
  }

  sendResponseWithNewToken(res, runSignStep1Res.data);
}
