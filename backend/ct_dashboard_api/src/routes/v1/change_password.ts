import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  ChangePasswordRequestSchema,
  ChangePasswordSuccessResponseSchema,
  CustomerAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Response } from "express";

import { changeCustomerPassword } from "@bitcodex-ctd-api/api/customer_password";
import type { CustomerAuthenticatedRequest } from "@bitcodex-ctd-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/auth/change-password",
  tags: ["Customer Dashboard"],
  summary: "Change customer password",
  description: "Changes the password for a customer account",
  security: [{ customerAuth: [] }],
  request: {
    headers: CustomerAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ChangePasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: ChangePasswordSuccessResponseSchema,
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
    403: {
      description: "Forbidden or original password incorrect",
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

export async function changePassword(
  req: CustomerAuthenticatedRequest<ChangePasswordRequest>,
  res: Response<BitcodeXApiResponse<ChangePasswordResponse>>,
) {
  const state = req.app.locals;
  const userId = res.locals.user_id;

  const result = await changeCustomerPassword(state.db, req.body, userId);

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
