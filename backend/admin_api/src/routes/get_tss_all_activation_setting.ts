import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { GetTssAllActivationSettingSuccessResponseSchema } from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { getTssAllActivationSetting } from "@bitcodex-admin-api/api/tss";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";
import type { GetTssAllActivationSettingResponse } from "@bitcodex-types/admin";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/tss/get_tss_all_activation_setting",
  tags: ["Admin"],
  summary: "Get TSS activation setting",
  description: "Retrieves the current TSS activation setting",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
  },
  responses: {
    200: {
      description: "TSS activation setting retrieved successfully",
      content: {
        "application/json": {
          schema: GetTssAllActivationSettingSuccessResponseSchema,
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

export async function get_tss_all_activation_setting(
  req: AuthenticatedAdminRequest,
  res: Response<BitcodeXApiResponse<GetTssAllActivationSettingResponse>>,
) {
  const state = req.app.locals;

  const result = await getTssAllActivationSetting(state.db);
  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
