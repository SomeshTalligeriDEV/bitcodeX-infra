import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  CustomerIdParamSchema,
  GetCustomerSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { Customer } from "@bitcodex/bitcodex-types/customers";
import type { Response } from "express";

import { getCustomerById } from "@bitcodex-admin-api/api/customer";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "get",
  path: "/bitcodex_admin/v1/customer/get_customer/{customer_id}",
  tags: ["Admin"],
  summary: "Get customer by ID",
  description: "Retrieves customer information by customer ID",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    params: CustomerIdParamSchema,
  },
  responses: {
    200: {
      description: "Customer information retrieved successfully",
      content: {
        "application/json": {
          schema: GetCustomerSuccessResponseSchema,
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
    404: {
      description: "Customer not found",
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

export async function get_customer(
  req: AuthenticatedAdminRequest,
  res: Response<BitcodeXApiResponse<Customer>>,
) {
  const state = req.app.locals;
  const { customer_id: customerId } = req.params;

  if (!customerId) {
    res.status(400).json({
      success: false,
      code: "MISSING_CUSTOMER_ID",
      msg: "Customer ID is required",
    });
    return;
  }

  const getCustomerByIdRes = await getCustomerById(state.db, customerId);
  if (getCustomerByIdRes.success === false) {
    res
      .status(ErrorCodeMap[getCustomerByIdRes.code] ?? 500)
      .json(getCustomerByIdRes);
    return;
  }

  res.status(200).json({ success: true, data: getCustomerByIdRes.data });
  return;
}
