import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  GetWalletListRequestSchema,
  GetWalletListSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getWalletList } from "@bitcodex-admin-api/api/wallet";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";
import type {
  GetWalletListRequest,
  GetWalletListResponse,
} from "@bitcodex-types/admin";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/wallet/get_wallet_list",
  tags: ["Admin"],
  summary: "Get wallet list with pagination",
  description: "Retrieves a list of wallets with pagination",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: false,
      content: {
        "application/json": {
          schema: GetWalletListRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Wallet list retrieved successfully",
      content: {
        "application/json": {
          schema: GetWalletListSuccessResponseSchema,
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

export async function get_wallet_list(
  req: AuthenticatedAdminRequest<GetWalletListRequest>,
  res: Response<BitcodeXApiResponse<GetWalletListResponse>>,
) {
  const state = req.app.locals;

  const result = await getWalletList(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
