import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  GetUserListRequestSchema,
  GetUserListSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getUserList } from "@bitcodex-admin-api/api/wallet";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";
import type {
  GetUserListRequest,
  GetUserListResponse,
} from "@bitcodex-types/admin";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/wallet/get_user_list",
  tags: ["Admin"],
  summary: "Get user list with wallets by curve type",
  description:
    "Retrieves a list of users with their wallets grouped by curve type (secp256k1/ed25519)",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: false,
      content: {
        "application/json": {
          schema: GetUserListRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User list retrieved successfully",
      content: {
        "application/json": {
          schema: GetUserListSuccessResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
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

export async function get_user_list(
  req: AuthenticatedAdminRequest<GetUserListRequest>,
  res: Response<BitcodeXApiResponse<GetUserListResponse>>,
) {
  const state = req.app.locals;

  const result = await getUserList(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
