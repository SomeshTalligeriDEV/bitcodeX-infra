import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  PresignStep2RequestSchema,
  PresignStep2SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  PresignStep2Body,
  PresignStep2Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runPresignStep2 } from "@bitcodex-api/api/tss/v1/presign";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v2/presign/step2",
  tags: ["TSS"],
  summary: "Execute step 2 of presign process",
  description: "Processes wait messages and updates presign stage",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: PresignStep2RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully processed step 2",
      content: {
        "application/json": {
          schema: PresignStep2SuccessResponseSchema,
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

export async function presignStep2(
  req: UserAuthenticatedRequest<PresignStep2Body>,
  res: Response<BitcodeXApiResponse<PresignStep2Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  const runPresignStep2Res = await runPresignStep2(state.db, {
    email: user.email,
    wallet_id: user.wallet_id_secp256k1,
    session_id: body.session_id,
    wait_1_0_1: body.wait_1_0_1,
  });
  if (runPresignStep2Res.success === false) {
    res
      .status(ErrorCodeMap[runPresignStep2Res.code] ?? 500)
      .json(runPresignStep2Res);

    return;
  }

  sendResponseWithNewToken(res, runPresignStep2Res.data);
}
