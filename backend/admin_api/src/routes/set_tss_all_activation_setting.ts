import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  SetTssAllActivationSettingRequestSchema,
  SetTssAllActivationSettingSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Response } from "express";

import { setTssAllActivationSetting } from "@bitcodex-admin-api/api/tss";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";
import type {
  SetTssAllActivationSettingRequest,
  SetTssAllActivationSettingResponse,
} from "@bitcodex-types/admin";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/tss/set_tss_all_activation_setting",
  tags: ["Admin"],
  summary: "Set TSS activation setting",
  description: "Enable or disable TSS functionality for all users",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: SetTssAllActivationSettingRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "TSS activation setting updated successfully",
      content: {
        "application/json": {
          schema: SetTssAllActivationSettingSuccessResponseSchema,
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

export async function set_tss_all_activation_setting(
  req: AuthenticatedAdminRequest<SetTssAllActivationSettingRequest>,
  res: Response<BitcodeXApiResponse<SetTssAllActivationSettingResponse>>,
) {
  const state = req.app.locals;

  const result = await setTssAllActivationSetting(state.db, req.body);

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
