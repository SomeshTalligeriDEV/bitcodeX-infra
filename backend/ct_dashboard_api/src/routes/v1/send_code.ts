import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  SendVerificationRequestSchema,
  SendVerificationSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { SendVerificationResponse } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Request, Response } from "express";

import { sendEmailVerificationCode } from "@bitcodex-ctd-api/email/send";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/auth/send-code",
  tags: ["Customer Dashboard"],
  summary: "Send verification code",
  description: "Sends a verification code to the provided email address",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: SendVerificationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Verification code sent successfully",
      content: {
        "application/json": {
          schema: SendVerificationSuccessResponseSchema,
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

export async function sendCode(
  req: Request,
  res: Response<BitcodeXApiResponse<SendVerificationResponse>>,
) {
  const state = req.app.locals;

  const result = await sendEmailVerificationCode(state.db, {
    email: req.body.email,
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
