import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { GetAllKSNodeSuccessResponseSchema } from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { GetAllKSNodeResponse } from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getAllKSNodes } from "@bitcodex-admin-api/api/ks_node";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/ks_node/get_all_ks_nodes",
  tags: ["Admin"],
  summary: "Get all key share nodes",
  description: "Retrieves all key share nodes with health status",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
  },
  responses: {
    200: {
      description: "Key share nodes retrieved successfully",
      content: {
        "application/json": {
          schema: GetAllKSNodeSuccessResponseSchema,
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

export async function get_all_ks_nodes(
  req: AuthenticatedAdminRequest,
  res: Response<BitcodeXApiResponse<GetAllKSNodeResponse>>,
) {
  const state = req.app.locals;

  const result = await getAllKSNodes(state.db);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
