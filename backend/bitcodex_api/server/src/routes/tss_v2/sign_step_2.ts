import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  SignStep2RequestSchema,
  SignStep2SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  SignStep2Body,
  SignStep2Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runSignStep2 } from "@bitcodex-api/api/tss/v1/sign";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v1/sign/step2",
  tags: ["TSS"],
  summary: "Complete signing process",
  description: "Validates sign result and completes sign stage",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: SignStep2RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully completed signing process",
      content: {
        "application/json": {
          schema: SignStep2SuccessResponseSchema,
        },
      },
    },
    400: {
      description:
        "Invalid request - Session, stage, or sign result validation failed",
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

export async function signStep2(
  req: UserAuthenticatedRequest<SignStep2Body>,
  res: Response<BitcodeXApiResponse<SignStep2Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  const runSignStep2Res = await runSignStep2(state.db, {
    email: user.email,
    wallet_id: user.wallet_id_secp256k1,
    session_id: body.session_id,
    sign_output: body.sign_output,
  });
  if (runSignStep2Res.success === false) {
    res.status(ErrorCodeMap[runSignStep2Res.code] ?? 500).json(runSignStep2Res);
    return;
  }

  sendResponseWithNewToken(res, runSignStep2Res.data);
}
