import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  PresignStep1RequestSchema,
  PresignStep1SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  PresignStep1Body,
  PresignStep1Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runPresignStep1 } from "@bitcodex-api/api/tss/v1/presign";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v2/presign/step1",
  tags: ["TSS"],
  summary: "Initiate presign process using completed triples",
  description: "Creates presign stage and generates initial presign messages",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: PresignStep1RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully initialized presign generation",
      content: {
        "application/json": {
          schema: PresignStep1SuccessResponseSchema,
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

export async function presignStep1(
  req: UserAuthenticatedRequest<PresignStep1Body>,
  res: Response<BitcodeXApiResponse<PresignStep1Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  const runPresignStep1Res = await runPresignStep1(
    state.db,
    {
      email: user.email,
      wallet_id: user.wallet_id_secp256k1,
      session_id: body.session_id,
      msgs_1: body.msgs_1,
    },
    state.encryption_secret,
  );
  if (runPresignStep1Res.success === false) {
    res
      .status(ErrorCodeMap[runPresignStep1Res.code] ?? 500)
      .json(runPresignStep1Res);

    return;
  }

  sendResponseWithNewToken(res, runPresignStep1Res.data);
}
