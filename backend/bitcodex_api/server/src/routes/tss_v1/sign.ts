import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import {
  SignStep1RequestSchema,
  SignStep1SuccessResponseSchema,
  SignStep2RequestSchema,
  SignStep2SuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/tss";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  SignStep1Body,
  SignStep1Response,
  SignStep2Body,
  SignStep2Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response, Router } from "express";

import { runSignStep1, runSignStep2 } from "@bitcodex-api/api/tss/v1/sign";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
  userJwtMiddleware,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";
import { tssActivateMiddleware } from "@bitcodex-api/middleware/auth/tss_activate";

export function setSignV1Routes(router: Router) {
  registry.registerPath({
    method: "post",
    path: "/tss/v1/sign/step1",
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
  router.post(
    "/sign/step1",
    [userJwtMiddleware, tssActivateMiddleware],
    async (
      req: UserAuthenticatedRequest<SignStep1Body>,
      res: Response<BitcodeXApiResponse<SignStep1Response>>,
    ) => {
      const state = req.app.locals;
      const user = res.locals.user;
      const body = req.body;

      const runSignStep1Res = await runSignStep1(state.db, {
        email: user.email,
        wallet_id: user.wallet_id,
        session_id: body.session_id,
        msg: body.msg,
        msgs_1: body.msgs_1,
      });
      if (runSignStep1Res.success === false) {
        res
          .status(ErrorCodeMap[runSignStep1Res.code] ?? 500)
          .json(runSignStep1Res);

        return;
      }

      sendResponseWithNewToken(res, runSignStep1Res.data);
    },
  );

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
  router.post(
    "/sign/step2",
    [userJwtMiddleware, tssActivateMiddleware],
    async (
      req: UserAuthenticatedRequest<SignStep2Body>,
      res: Response<BitcodeXApiResponse<SignStep2Response>>,
    ) => {
      const state = req.app.locals;
      const user = res.locals.user;
      const body = req.body;

      const runSignStep2Res = await runSignStep2(state.db, {
        email: user.email,
        wallet_id: user.wallet_id,
        session_id: body.session_id,
        sign_output: body.sign_output,
      });
      if (runSignStep2Res.success === false) {
        res
          .status(ErrorCodeMap[runSignStep2Res.code] ?? 500)
          .json(runSignStep2Res);
        return;
      }

      sendResponseWithNewToken(res, runSignStep2Res.data);
    },
  );
}
