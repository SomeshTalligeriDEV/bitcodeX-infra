import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  GetCustomerListQuerySchema,
  GetCustomerListSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { CustomerWithAPIKeys } from "@bitcodex/bitcodex-types/customers";
import type { Response } from "express";

import { getCustomerList } from "@bitcodex-admin-api/api/customer";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "get",
  path: "/bitcodex_admin/v1/customer/get_customer_list",
  tags: ["Admin"],
  summary: "Get customers with pagination",
  description: "Retrieves a list of customers with pagination",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    query: GetCustomerListQuerySchema,
  },
  responses: {
    200: {
      description: "Customer list retrieved successfully",
      content: {
        "application/json": {
          schema: GetCustomerListSuccessResponseSchema,
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

export async function get_customer_list(
  req: AuthenticatedAdminRequest,
  res: Response<
    BitcodeXApiResponse<{
      customerWithAPIKeysList: CustomerWithAPIKeys[];
      pagination: {
        total: number;
        current_page: number;
        total_pages: number;
        verified_count: number;
        tx_active_count: number;
      };
    }>
  >,
) {
  const state = req.app.locals;

  let { limit, offset } = req.query;
  if (!limit || !offset) {
    limit = 10;
    offset = 0;
  } else {
    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);
  }

  const getCustomerListRes = await getCustomerList(state.db, limit, offset);
  if (getCustomerListRes.success === false) {
    res
      .status(ErrorCodeMap[getCustomerListRes.code] ?? 500)
      .json(getCustomerListRes);
    return;
  }

  res.status(200).json({
    success: true,
    data: getCustomerListRes.data,
  });
  return;
}
