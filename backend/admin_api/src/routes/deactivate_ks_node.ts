import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  DeactivateKSNodeRequestSchema,
  DeactivateKSNodeSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type {
  DeactivateKSNodeRequest,
  DeactivateKSNodeResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { deactivateKSNode } from "@bitcodex-admin-api/api/ks_node";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/ks_node/deactivate_ks_node",
  tags: ["Admin"],
  summary: "Deactivate key share node",
  description: "Deactivates a key share node",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: DeactivateKSNodeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Key share node deactivated successfully",
      content: {
        "application/json": {
          schema: DeactivateKSNodeSuccessResponseSchema,
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

export async function deactivate_ks_node(
  req: AuthenticatedAdminRequest<DeactivateKSNodeRequest>,
  res: Response<BitcodeXApiResponse<DeactivateKSNodeResponse>>,
) {
  const state = req.app.locals;

  const result = await deactivateKSNode(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
