import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  ForgotPasswordRequestSchema,
  ForgotPasswordSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Request, Response } from "express";

import { forgotPasswordRequest } from "@bitcodex-ctd-api/api/customer_password";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/auth/forgot-password",
  tags: ["Customer Dashboard"],
  summary: "Request password reset",
  description: "Sends a password reset verification code to the email",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ForgotPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reset code sent successfully",
      content: {
        "application/json": {
          schema: ForgotPasswordSuccessResponseSchema,
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
    429: {
      description: "Too many requests",
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

export async function forgotPassword(
  req: Request,
  res: Response<BitcodeXApiResponse<{ message: string; expires_at: string }>>,
) {
  const state = req.app.locals;

  const result = await forgotPasswordRequest(state.db, req.body, {
    email_verification_expiration_minutes:
      state.email_verification_expiration_minutes,
    from_email: state.from_email,
    smtp_config: {
      smtp_host: state.smtp_host,
      smtp_port: state.smtp_port,
      smtp_user: state.smtp_user,
      smtp_pass: state.smtp_pass,
    },
  });

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
