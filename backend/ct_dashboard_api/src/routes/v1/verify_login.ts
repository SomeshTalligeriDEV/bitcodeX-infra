import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  LoginSuccessResponseSchema,
  VerifyAndLoginRequestSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { LoginResponse } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Request, Response } from "express";

import { verifyLoginCustomer } from "@bitcodex-ctd-api/api/customer_auth";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/auth/verify-login",
  tags: ["Customer Dashboard"],
  summary: "Verify email and login",
  description:
    "Verifies the email with provided code and logs in the customer dashboard user",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: VerifyAndLoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully verified and logged in",
      content: {
        "application/json": {
          schema: LoginSuccessResponseSchema,
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
    404: {
      description: "Account not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export async function verifyLogin(
  req: Request,
  res: Response<BitcodeXApiResponse<LoginResponse>>,
) {
  const state = req.app.locals;

  const result = await verifyLoginCustomer(state.db, req.body, {
    secret: state.jwt_secret,
    expires_in: state.jwt_expires_in,
  });

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
