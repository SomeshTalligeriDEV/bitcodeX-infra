import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  GetTssSessionListRequestSchema,
  GetTssSessionListSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getTssSessionList } from "@bitcodex-admin-api/api/tss";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";
import type {
  GetTssSessionListRequest,
  GetTssSessionListResponse,
} from "@bitcodex-types/admin";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/tss/get_tss_session_list",
  tags: ["Admin"],
  summary: "Get tss sessions with pagination",
  description: "Retrieves a list of TSS sessions with next/prev pagination",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: false,
      content: {
        "application/json": {
          schema: GetTssSessionListRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "TSS sessions retrieved successfully",
      content: {
        "application/json": {
          schema: GetTssSessionListSuccessResponseSchema,
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

export async function get_tss_session_list(
  req: AuthenticatedAdminRequest<GetTssSessionListRequest>,
  res: Response<BitcodeXApiResponse<GetTssSessionListResponse>>,
) {
  const state = req.app.locals;

  const result = await getTssSessionList(state.db, req.body);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
