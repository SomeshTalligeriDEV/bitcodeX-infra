import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  UpdateKSNodeRequestSchema,
  UpdateKSNodeSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type {
  UpdateKSNodeRequest,
  UpdateKSNodeResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { updateKSNode } from "@bitcodex-admin-api/api/ks_node";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/ks_node/update_ks_node",
  tags: ["Admin"],
  summary: "Update key share node",
  description: "Updates a key share node server URL",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: UpdateKSNodeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Key share node updated successfully",
      content: {
        "application/json": {
          schema: UpdateKSNodeSuccessResponseSchema,
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

export async function update_ks_node(
  req: AuthenticatedAdminRequest<UpdateKSNodeRequest>,
  res: Response<BitcodeXApiResponse<UpdateKSNodeResponse>>,
) {
  const state = req.app.locals;

  const result = await updateKSNode(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
