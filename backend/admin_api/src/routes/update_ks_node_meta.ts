import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  UpdateKeyShareNodeMetaRequestSchema,
  UpdateKeyShareNodeMetaSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type {
  UpdateKeyShareNodeMetaRequest,
  UpdateKeyShareNodeMetaResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { updateKeyShareNodeMeta } from "@bitcodex-admin-api/api/ks_node";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/ks_node/update_ks_node_meta",
  tags: ["Admin"],
  summary: "Update key share node metadata",
  description:
    "Updates registration_threshold for key share node meta. Value must be >= sss_threshold or null.",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: UpdateKeyShareNodeMetaRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Key share node meta updated successfully",
      content: {
        "application/json": {
          schema: UpdateKeyShareNodeMetaSuccessResponseSchema,
        },
      },
    },
    400: {
      description:
        "Invalid request (e.g., registration_threshold < sss_threshold)",
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

export async function update_ks_node_meta(
  req: AuthenticatedAdminRequest<UpdateKeyShareNodeMetaRequest>,
  res: Response<BitcodeXApiResponse<UpdateKeyShareNodeMetaResponse>>,
) {
  const state = req.app.locals;

  const result = await updateKeyShareNodeMeta(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
