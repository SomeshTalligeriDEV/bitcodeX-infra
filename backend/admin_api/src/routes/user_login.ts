import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  AdminLoginSuccessResponseSchema,
  LoginRequestSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Request, Response } from "express";

import { login } from "@bitcodex-admin-api/api/user";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/user/login",
  tags: ["Admin"],
  summary: "Admin login",
  description: "Authenticates an admin user",
  security: [],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully logged in",
      content: {
        "application/json": {
          schema: AdminLoginSuccessResponseSchema,
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
    401: {
      description: "Invalid credentials",
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

export async function user_login(
  req: Request<any, any, AdminLoginRequest>,
  res: Response<BitcodeXApiResponse<AdminLoginResponse>>,
) {
  const state = req.app.locals;

  const result = await login(state.db, req.body, {
    secret: state.jwt_secret,
    expires_in: state.jwt_expires_in,
  });

  if (result.success === false) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
