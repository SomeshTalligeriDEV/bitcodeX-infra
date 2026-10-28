import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  GetKSNHealthChecksRequestSchema,
  GetKSNHealthChecksSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type {
  GetKSNHealthChecksRequest,
  GetKSNHealthChecksResponse,
} from "@bitcodex/bitcodex-types/admin";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getKSNHealthChecks } from "@bitcodex-admin-api/api/ks_node";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/ks_node/get_ksn_health_checks",
  tags: ["Admin"],
  summary: "Get KS node health checks",
  description: "Retrieves KS node health checks with pagination",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: GetKSNHealthChecksRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Health checks retrieved successfully",
      content: {
        "application/json": {
          schema: GetKSNHealthChecksSuccessResponseSchema,
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
export async function get_ksn_health_checks(
  req: AuthenticatedAdminRequest<GetKSNHealthChecksRequest>,
  res: Response<BitcodeXApiResponse<GetKSNHealthChecksResponse>>,
) {
  const state = req.app.locals;

  const result = await getKSNHealthChecks(
    state.db,
    req.body.pageIndex,
    req.body.pageSize,
  );

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
