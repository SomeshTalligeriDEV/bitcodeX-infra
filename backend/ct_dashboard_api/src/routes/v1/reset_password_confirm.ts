import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  ResetPasswordConfirmRequestSchema,
  ResetPasswordConfirmSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Request, Response } from "express";

import { resetPasswordConfirmRequest } from "@bitcodex-ctd-api/api/customer_password";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/auth/reset-password-confirm",
  tags: ["Customer Dashboard"],
  summary: "Confirm password reset",
  description: "Resets the password using a valid verification code",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ResetPasswordConfirmRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset successfully",
      content: {
        "application/json": {
          schema: ResetPasswordConfirmSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request or code",
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

export async function resetPasswordConfirm(
  req: Request,
  res: Response<BitcodeXApiResponse<{ message: string }>>,
) {
  const state = req.app.locals;

  const result = await resetPasswordConfirmRequest(state.db, req.body);

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
